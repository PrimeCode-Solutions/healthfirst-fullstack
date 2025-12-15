import { NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { AppointmentStatus, PaymentStatus } from "@/generated/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const timeLimit = new Date(Date.now() - 60 * 60 * 1000);

    const appointmentsToDelete = await prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.PENDING,
        createdAt: { lt: timeLimit },
        payment: {
            status: PaymentStatus.PENDING
        }
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
            amount: app.payment?.amount || 0
          }))
        });

        const ids = appointmentsToDelete.map(a => a.id);
        await tx.appointment.deleteMany({
          where: { id: { in: ids } }
        });
      });
    }

    return NextResponse.json({
      message: "Limpeza executada com segurança",
      processed: appointmentsToDelete.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Erro na limpeza:", error);
    return NextResponse.json({ error: "Internal Error", details: error.message }, { status: 500 });
  }
}