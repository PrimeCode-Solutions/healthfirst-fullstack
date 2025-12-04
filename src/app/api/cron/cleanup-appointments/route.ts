import { NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { AppointmentStatus } from "@/generated/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const timeLimit = new Date(Date.now() - 10 * 60 * 1000);

    const appointmentsToDelete = await prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.PENDING,
        createdAt: { lt: timeLimit },
      },
      include: { payment: true }
    });

    if (appointmentsToDelete.length > 0) {
      // 2. Salvar no Histórico em massa
      await prisma.appointmentHistory.createMany({
        data: appointmentsToDelete.map(app => ({
          originalId: app.id,
          userId: app.userId,
          doctorId: app.doctorId,
          date: app.date,
          status: "CANCELLED",
          reason: "TIMEOUT_PAYMENT",
          amount: app.payment?.amount || 0
        }))
      });

      const ids = appointmentsToDelete.map(a => a.id);
      await prisma.appointment.deleteMany({
        where: { id: { in: ids } }
      });
    }

    return NextResponse.json({
      message: "Limpeza concluída",
      count: appointmentsToDelete.length,
    });
  } catch (error) {
    console.error("Erro na limpeza:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}