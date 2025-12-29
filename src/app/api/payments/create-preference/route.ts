import { MercadoPagoConfig, Preference } from "mercadopago";
import { prisma } from "@/app/providers/prisma";

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;

const client = new MercadoPagoConfig({
    accessToken: accessToken || "",
});

const preferenceClient = new Preference(client);

export async function POST(req: Request) {
    try {
        const { appointmentId } = await req.json();

        if (!appointmentId) {
            return new Response(
                JSON.stringify({ error: "appointmentId é obrigatório!" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const existingPayment = await prisma.payment.findFirst({
            where: { appointmentId },
        });

        if (!existingPayment) {
            return new Response(JSON.stringify({ error: "Pagamento não encontrado!" }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        const response = await preferenceClient.create({
            body: {
                items: [
                    {
                        id: appointmentId.toString(),
                        title: existingPayment.description || "Consulta",
                        quantity: 1,
                        unit_price: Number(existingPayment.amount),
                        currency_id: existingPayment.currency || "BRL",
                    },
                ],
                back_urls: {
                    success: `${process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000'}/success`,
                    failure: `${process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000'}/failure`,
                    pending: `${process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000'}/pending`,
                },
                auto_return: "approved",
                external_reference: appointmentId.toString(),
                metadata: {
                    appointmentId,
                },
            }
        });

        await prisma.payment.update({
            where: { id: existingPayment.id },
            data: { preferenceId: response.id }
        })

        return new Response(
            JSON.stringify({
                preferenceId: response.id,
                initPoint: response.init_point,
                sandboxInitPoint: response.sandbox_init_point,
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" }
            }
        )

    } catch (error) {
        console.error("Erro create-preference:", error);
        const mensagem = error instanceof Error ? error.message : "Erro desconhecido";
        return new Response(
            JSON.stringify({ error: mensagem }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        );
    }
}