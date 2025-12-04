import { MercadoPagoConfig, Payment, PreApproval } from "mercadopago";
import { prisma } from "@/app/providers/prisma";
import crypto from "crypto";
import { PaymentStatus } from "@/generated/prisma";

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN as string });
const paymentClient = new Payment(client);
const preApprovalClient = new PreApproval(client);

function validateSignature(req: Request, body: string, signature: string | null, requestId: string | null): boolean {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret || !signature || !requestId) return false;

    const parts = signature.split(',');
    let ts, v1;
    parts.forEach(p => {
        const [k, v] = p.split('=');
        if (k.trim() === 'ts') ts = v;
        if (k.trim() === 'v1') v1 = v;
    });

    if (!ts || !v1) return false;

    const parsedBody = JSON.parse(body);
    const manifest = `id:${parsedBody.data?.id};request-id:${requestId};ts:${ts};`;
    const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

    return hmac === v1;
}

export async function POST(req: Request) {
    try {
        const bodyText = await req.text();
        const signature = req.headers.get("x-signature");
        const requestId = req.headers.get("x-request-id");

        // Em produção, valida assinatura
        if (process.env.NODE_ENV === 'production' && process.env.MP_WEBHOOK_SECRET) {
             if (!validateSignature(req, bodyText, signature, requestId)) {
                return new Response("Invalid Signature", { status: 401 });
             }
        }

        const body = JSON.parse(bodyText);
        const { type, data } = body;
        const id = data?.id;

        if (!id) return new Response("No ID", { status: 200 });

        if (type === "payment") {
            const payment = await paymentClient.get({ id });
            let status: PaymentStatus = "PENDING";
            
            if (payment.status === "approved") status = "CONFIRMED";
            else if (payment.status === "rejected") status = "REJECTED";
            else if (payment.status === "cancelled") status = "CANCELLED";

            const dbPayment = await prisma.payment.findFirst({
                where: { OR: [{ mercadoPagoId: String(id) }, { id: payment.external_reference }] }
            });

            if (dbPayment) {
                await prisma.payment.update({
                    where: { id: dbPayment.id },
                    data: { status, mercadoPagoId: String(id), paidAt: status === "CONFIRMED" ? new Date() : undefined }
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
            }
        }

        if (type === "subscription_preapproval") {
            const sub = await preApprovalClient.get({ id });
            let status = "INACTIVE";
            if (sub.status === "authorized") status = "ACTIVE";
            
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