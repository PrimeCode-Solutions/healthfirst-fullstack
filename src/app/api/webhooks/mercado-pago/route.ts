import { MercadoPagoConfig, Payment, PreApproval } from "mercadopago";
import { prisma } from "@/app/providers/prisma";
import crypto from "crypto";

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
const client = new MercadoPagoConfig({ accessToken: accessToken || "" });

const paymentClient = new Payment(client);
const preApprovalClient = new PreApproval(client);

function validateSignature(body: string, signature: string | null, requestId: string | null): boolean {
    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET || process.env.MP_WEBHOOK_SECRET;
    if (!secret || !signature || !requestId) return true;

    try {
        const parts = signature.split(',');
        let ts, v1;
        parts.forEach(p => {
            const [k, v] = p.split('=');
            if (k.trim() === 'ts') ts = v;
            if (k.trim() === 'v1') v1 = v;
        });

        if (!ts || !v1) return false;

        const manifest = `id:${JSON.parse(body).data?.id};request-id:${requestId};ts:${ts};`;
        const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

        return hmac === v1;
    } catch {
        return false;
    }
}

export async function POST(req: Request) {
    try {
        const bodyText = await req.text();
        const signature = req.headers.get("x-signature");
        const requestId = req.headers.get("x-request-id");

        if (process.env.NODE_ENV === 'production' && process.env.MP_WEBHOOK_SECRET) {
             if (!validateSignature(bodyText, signature, requestId)) {
                return new Response("Invalid Signature", { status: 401 });
             }
        }

        const body = JSON.parse(bodyText);
        const { type, data } = body;
        const id = data?.id;

        if (!id) return new Response("No ID", { status: 200 });

        if (type === "payment") {
            const payment = await paymentClient.get({ id });
            
            let status = "PENDING";
            if (payment.status === "approved") status = "CONFIRMED";
            else if (payment.status === "rejected") status = "REJECTED";
            else if (payment.status === "cancelled") status = "CANCELLED";

            const dbPayment = await prisma.payment.findFirst({
                where: { 
                    OR: [
                        { mercadoPagoId: String(id) }, 
                        { appointmentId: payment.external_reference }
                    ] 
                }
            });

            if (dbPayment) {
                await prisma.payment.update({
                    where: { id: dbPayment.id },
                    data: { 
                        status: status as any, 
                        mercadoPagoId: String(id), 
                        paidAt: status === "CONFIRMED" ? new Date() : undefined 
                    }
                });

                if (dbPayment.appointmentId) {
                     let apptStatus = "PENDING";
                     if (status === "CONFIRMED") apptStatus = "CONFIRMED";
                     else if (status === "REJECTED" || status === "CANCELLED") apptStatus = "CANCELLED";

                    await prisma.appointment.update({
                        where: { id: dbPayment.appointmentId },
                        data: { status: apptStatus as any }
                    });
                }
            } else if (status === "CONFIRMED") {
                const subscriptionId = payment.metadata?.subscription_id || payment.external_reference; 
                if (subscriptionId) {
                    const subscription = await prisma.subscription.findFirst({
                        where: { OR: [{ preapprovalId: subscriptionId }, { userId: payment.external_reference }] }
                    });

                    if (subscription) {
                        await prisma.payment.create({
                            data: {
                                mercadoPagoId: String(id),
                                amount: payment.transaction_amount || 0,
                                currency: payment.currency_id || "BRL",
                                description: payment.description || "Mensalidade Assinatura",
                                status: "CONFIRMED",
                                paymentMethod: payment.payment_method_id,
                                payerEmail: payment.payer?.email,
                                subscriptionId: subscription.id,
                                paidAt: new Date()
                            }
                        });
                    }
                }
            }
        }

        if (type === "subscription_preapproval") {
            const sub = await preApprovalClient.get({ id });
            let status = "INACTIVE";
            if (sub.status === "authorized") status = "ACTIVE";
            if (sub.status === "cancelled") status = "CANCELLED";
            
            await prisma.subscription.updateMany({
                where: { preapprovalId: id },
                data: { status: status as any }
            });
        }

        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error("Webhook Error:", error);
        return new Response("Error", { status: 500 });
    }
}