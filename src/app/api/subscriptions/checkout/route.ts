import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/app/providers/prisma";

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
const client = new MercadoPagoConfig({ accessToken: accessToken || "" });
const preApprovalClient = new PreApproval(client);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { token, payer, price, planName, userId } = body;

    if (!token) {
        return NextResponse.json({ error: "Token do cartão é obrigatório para checkout transparente" }, { status: 400 });
    }

    const payerEmail = process.env.NODE_ENV === 'production' 
        ? (payer?.email || session.user.email)
        : `test_user_${Date.now()}@test.com`;

    const subscription = await preApprovalClient.create({
      body: {
        reason: planName || "Assinatura HealthFirst",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: Number(price),
          currency_id: "BRL"
        },
        payer_email: payerEmail,
        card_token_id: token, 
        status: "authorized", 
        back_url: process.env.NEXT_PUBLIC_APP_URL, 
        external_reference: userId || session.user.id,
      }
    });

    await prisma.subscription.upsert({
        where: { userId: session.user.id },
        update: {
            preapprovalId: subscription.id!,
            planName: planName,
            amount: Number(price),
            status: subscription.status === 'authorized' ? 'ACTIVE' : 'INACTIVE',
            mercadoPagoId: subscription.id
        },
        create: {
            userId: session.user.id,
            preapprovalId: subscription.id!,
            planName: planName,
            amount: Number(price),
            status: subscription.status === 'authorized' ? 'ACTIVE' : 'INACTIVE',
            mercadoPagoId: subscription.id
        }
    });

    if (subscription.status === 'authorized') {
        await prisma.payment.create({
            data: {
                mercadoPagoId: subscription.id, 
                amount: Number(price),
                currency: "BRL",
                description: `Primeira mensalidade - ${planName}`,
                status: "CONFIRMED",
                paymentMethod: "credit_card",
                payerEmail: payerEmail,
                subscriptionId: (await prisma.subscription.findUnique({ where: { userId: session.user.id } }))?.id,
                paidAt: new Date()
            }
        });
    }

    return NextResponse.json({ 
        id: subscription.id, 
        status: subscription.status 
    });

  } catch (error: any) {
    console.error("Erro ao criar assinatura transparente:", error);
    return NextResponse.json({ 
        error: "Erro ao processar assinatura",
        details: error.message || error.cause, 
        status: error.status || 500
    }, { status: error.status || 500 });
  }
}