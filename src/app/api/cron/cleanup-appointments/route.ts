import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/providers/prisma";
import { AppointmentStatus, PaymentStatus } from "@/generated/prisma"; 

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing Cron Secret" },
      { status: 401 }
    );
  }

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
      success: true,
      message: "Limpeza executada com segurança",
      processed: appointmentsToDelete.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Erro crítico na limpeza (Cron):", error);
    return NextResponse.json(
      { error: "Internal Error", details: error.message }, 
      { status: 500 }
    );
  }
}