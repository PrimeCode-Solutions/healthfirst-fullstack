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
      include: { payment: true },
      take: 50, 
    });

    if (appointmentsToDelete.length > 0) {
      await prisma.$transaction(async (tx) => {
        
        await tx.appointmentHistory.createMany({
          data: appointmentsToDelete.map(app => ({
            originalId: app.id,
            userId: app.userId,
            doctorId: app.doctorId,
            date: app.date,
            status: "CANCELLED",
            reason: "TIMEOUT_PAYMENT",
            amount: Number(app.payment?.amount || 0)
          }))
        });

        const ids = appointmentsToDelete.map(a => a.id);
        await tx.appointment.deleteMany({
          where: { id: { in: ids } }
        });
      });
    }

    return NextResponse.json({
      message: "Limpeza executada",
      processed: appointmentsToDelete.length,
    });

  } catch (error: any) {
    console.error("Erro na limpeza:", error);
    // Retorna os detalhes do erro para facilitar o debug se você chamar a rota manualmente
    return NextResponse.json({ error: "Internal Error", details: error.message }, { status: 500 });
  }
}