import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { startOfDay, endOfDay, parseISO, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 1. Permissão: ADMIN ou DOCTOR
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "DOCTOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const queryDoctorId = url.searchParams.get("doctorId");
    const dateStart = url.searchParams.get("dateStart");
    const dateEnd = url.searchParams.get("dateEnd");
    let targetDoctorId: string | undefined = undefined;

    if (session.user.role === "DOCTOR") {
      targetDoctorId = session.user.id;
    } else if (queryDoctorId && queryDoctorId !== "all") {
      targetDoctorId = queryDoctorId;
    }

    // 3. Filtros de Data
    const dateFilter: any = {};
    if (dateStart) dateFilter.gte = startOfDay(parseISO(dateStart));
    if (dateEnd) dateFilter.lte = endOfDay(parseISO(dateEnd));

    // 4. Filtro Comum (Usado para Agendamentos e Histórico)
    const whereCommon = {
      ...(targetDoctorId ? { doctorId: targetDoctorId } : {}),
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
    };

    // --- A. DADOS GERAIS (Cards do Topo) ---

    // Faturamento Total (Filtrado por Médico e Data do Agendamento)
    const payments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: { in: ["APPROVED", "CONFIRMED"] },
        appointment: whereCommon, // Filtra pagamentos cujos agendamentos batem com o filtro
      }
    });

    // Total de Pacientes (Se for médico, conta pacientes únicos atendidos por ele)
    let totalPatients = 0;
    if (targetDoctorId) {
        // Conta quantos pacientes distintos esse médico já atendeu
        const uniquePatients = await prisma.appointment.findMany({
            where: { doctorId: targetDoctorId },
            distinct: ['userId'],
            select: { userId: true }
        });
        totalPatients = uniquePatients.length;
    } else {
        totalPatients = await prisma.user.count({
            where: { role: "USER" }
        });
    }

    // Total de Agendamentos Ativos (No filtro)
    const totalActiveAppointmentsCount = await prisma.appointment.count({
        where: whereCommon
    });

    // --- B. BUSCAR DADOS PARA GRÁFICOS E TABELAS ---

    // Agendamentos Ativos/Concluídos
    const activeAppointments = await prisma.appointment.findMany({
      where: {
        ...whereCommon,
        status: { in: ["CONFIRMED", "COMPLETED"] }
      },
      select: { id: true, doctorId: true, status: true }
    });

    // Histórico de Cancelamentos
    const historyAppointments = await prisma.appointmentHistory.findMany({
      where: {
        ...whereCommon,
        status: "CANCELLED" // Filtra explicitamente apenas cancelados
      },
      select: { id: true, doctorId: true, reason: true, status: true }
    });

    // --- C. PROCESSAMENTO DOS DADOS ---

    // Agrupar motivos de cancelamento para o Gráfico de Pizza
    const cancellationReasons = {
      timeout: historyAppointments.filter(a => a.reason === "TIMEOUT_PAYMENT").length,
      manualAdmin: historyAppointments.filter(a => a.reason === "MANUAL_ADMIN").length,
      manualDoctor: historyAppointments.filter(a => a.reason === "MANUAL_DOCTOR").length,
      manualPatient: historyAppointments.filter(a => a.reason === "MANUAL_PATIENT").length,
    };

    // Agrupar performance por médico para a Tabela
    const byDoctor: Record<string, any> = {};
    
    const initDoc = (id: string) => {
        if (!byDoctor[id]) byDoctor[id] = { attended: 0, cancelledTotal: 0, cancelledByMe: 0 };
    }

    // Computar Atendidos
    activeAppointments.forEach(app => {
        const docId = app.doctorId || "unknown";
        initDoc(docId);
        byDoctor[docId].attended++;
    });

    // Computar Cancelados
    historyAppointments.forEach(app => {
        const docId = app.doctorId || "unknown";
        initDoc(docId);
        byDoctor[docId].cancelledTotal++;
        if (app.reason === "MANUAL_DOCTOR") {
            byDoctor[docId].cancelledByMe++;
        }
    });

    const doctorIds = Object.keys(byDoctor).filter(id => id !== "unknown");
    const doctorsDb = await prisma.user.findMany({
        where: { id: { in: doctorIds } },
        select: { id: true, name: true, email: true }
    });

    const doctorStats = doctorsDb.map(doc => ({
        id: doc.id,
        name: doc.name,
        email: doc.email,
        ...byDoctor[doc.id]
    }));

    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthStart = startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
        const monthEnd = endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
        const monthlyRevenue = await prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
                status: { in: ["APPROVED", "CONFIRMED"] },
                createdAt: { gte: monthStart, lte: monthEnd },
                ...(targetDoctorId ? { appointment: { doctorId: targetDoctorId } } : {})
            }
        });
        
        monthlyData.push({
            name: format(date, 'MMM', { locale: ptBR }),
            total: Number(monthlyRevenue._sum.amount || 0)
        });
    }

    return NextResponse.json({
      summary: {
        totalRevenue: Number(payments._sum.amount || 0),
        totalPatients,
        totalAppointments: totalActiveAppointmentsCount + historyAppointments.length,
      },
      charts: {
        cancellationReasons,
        monthlyData
      },
      doctors: doctorStats
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}