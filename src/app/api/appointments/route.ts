import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { prisma } from "@/app/providers/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { AppointmentStatus, ConsultationType, PaymentStatus } from "@/generated/prisma";
import { parseISO, isValid as isValidDate, startOfDay, endOfDay } from "date-fns";
import { z } from "zod";

// --- Configuração do Mercado Pago ---
const mpAccessToken = process.env.MP_ACCESS_TOKEN;
const client = new MercadoPagoConfig({ 
  accessToken: mpAccessToken || "" 
});
const preference = new Preference(client);

// --- Schema de Validação para o GET ---
const querySchema = z.object({
  status: z.string().optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  userId: z.string().optional(),
  q: z.string().optional(),
  page: z.string().optional().transform((v) => Math.max(parseInt(v ?? "1", 10) || 1, 1)),
  pageSize: z.string().optional().transform((v) => {
      const n = Math.max(parseInt(v ?? "20", 10) || 20, 1);
      return Math.min(n, 100);
    }),
});

// --- GET: Listar Agendamentos (Restaurado Completo) ---
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", issues: parsed.error.issues }, { status: 422 });
    }

    const { status, dateStart, dateEnd, userId, q, page, pageSize } = parsed.data;
    const where: any = {};

    // Filtro de Status
    if (status && Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
      where.status = status as AppointmentStatus;
    }

    // Permissão de visualização
    if (session.user.role === "ADMIN" || session.user.role === "DOCTOR") {
      if (userId) where.userId = userId;
    } else {
      where.userId = session.user.id;
    }

    // Filtro de Data
    if (dateStart || dateEnd) {
      const ds = dateStart ? parseISO(dateStart) : undefined;
      const de = dateEnd ? parseISO(dateEnd) : undefined;

      if ((ds && !isValidDate(ds)) || (de && !isValidDate(de))) {
        return NextResponse.json({ error: "invalid_date_range" }, { status: 400 });
      }

      where.date = {};
      if (ds) where.date.gte = startOfDay(ds);
      if (de) where.date.lte = endOfDay(de);
    }

    // Filtro de Busca (Nome do paciente)
    if (q && q.trim()) {
      where.patientName = { contains: q.trim(), mode: "insensitive" };
    }

    const skip = (page - 1) * pageSize;

    const [total, items] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        orderBy: [{ date: "desc" }, { startTime: "asc" }],
        skip,
        take: pageSize,
        include: {
          payment: true,
          user: { select: { id: true, name: true, email: true } }
        },
      }),
    ]);

    return NextResponse.json({
      meta: {
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
      },
      items,
    });

  } catch (err) {
    console.error("Erro no GET /appointments:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

// --- POST: Criar Agendamento (Com Mercado Pago) ---
export async function POST(req: NextRequest) {
  console.log("➡️ [POST /appointments] Iniciando...");

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
    }

    if (!mpAccessToken) {
      return NextResponse.json({ error: "Erro de configuração no servidor." }, { status: 500 });
    }

    const body = await req.json();
    const { date, startTime, endTime, type, amount, description, patientName, doctorId } = body;

    if (!date || !amount) {
      return NextResponse.json({ error: "Dados obrigatórios faltando." }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const { appointment, payment } = await prisma.$transaction(async (tx) => {
      const newAppointment = await tx.appointment.create({
        data: {
          userId: session.user.id,
          doctorId: doctorId,
          date: parseISO(date),
          startTime,
          endTime,
          type: type as ConsultationType || "GENERAL",
          status: AppointmentStatus.PENDING,
          patientName: patientName || session.user.name,
          patientEmail: session.user.email
        }
      });

      const newPayment = await tx.payment.create({
        data: {
          appointmentId: newAppointment.id,
          amount: Number(amount),
          currency: "BRL",
          description: description || "Consulta Médica",
          status: PaymentStatus.PENDING,
          payerEmail: session.user.email,
          payerName: session.user.name
        }
      });

      return { appointment: newAppointment, payment: newPayment };
    });

    let mpPreference;
    try {
      mpPreference = await preference.create({
        body: {
          items: [{
            id: appointment.id,
            title: description || "Consulta Médica",
            quantity: 1,
            unit_price: Number(amount),
            currency_id: "BRL",
          }],
          payer: {
            email: session.user.email,
            name: session.user.name,
          },
          back_urls: {
            success: `${baseUrl}/success?payment_id=${payment.id}`,
            failure: `${baseUrl}/failure`,
            pending: `${baseUrl}/pending`
          },
          external_reference: payment.id,
          notification_url: `${process.env.NEXT_PUBLIC_API_URL}/webhooks/mercado-pago`,
        }
      });
    } catch (mpError) {
      console.error("Erro no Mercado Pago:", mpError);
      await prisma.appointment.delete({ where: { id: appointment.id } });
      return NextResponse.json({ error: "Erro ao comunicar com gateway de pagamento." }, { status: 502 });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        preferenceId: mpPreference.id,
        pendingUrl: mpPreference.init_point,
      },
    });

    return NextResponse.json({ 
      appointmentId: appointment.id,
      init_point: mpPreference.init_point 
    }, { status: 201 });

  } catch (e: any) {
    console.error("❌ Erro POST /appointments:", e);
    return NextResponse.json({ error: "Falha ao criar.", details: e.message }, { status: 500 });
  }
}