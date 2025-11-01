import { PrismaClient } from "@/generated/prisma";
import webhookRepository, {
  WebhookEventRow,
} from "@/modules/webhooks/domain/webhook.repository";

const prisma = new PrismaClient();

type LocalPaymentStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "REFUNDED";

type LocalSubscriptionStatus = "ACTIVE" | "INACTIVE" | "CANCELLED" | "EXPIRED";

function getStr(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function normalizePaymentStatus(raw?: string): LocalPaymentStatus | undefined {
  const s = raw?.toLowerCase();
  switch (s) {
    case "approved":
    case "authorized":
      return "APPROVED";
    case "rejected":
      return "REJECTED";
    case "cancelled":
    case "canceled":
      return "CANCELLED";
    case "refunded":
    case "charged_back":
      return "REFUNDED";
    case "pending":
    case "in_process":
    case "in_mediation":
    case "hold":
      return "PENDING";
    default:
      return undefined;
  }
}

function inferPaymentStatusFromAction(
  action?: string,
): LocalPaymentStatus | undefined {
  if (!action) return undefined;
  const a = action.toLowerCase();
  if (a.includes("approved")) return "APPROVED";
  if (a.includes("rejected")) return "REJECTED";
  if (a.includes("cancelled") || a.includes("canceled")) return "CANCELLED";
  if (a.includes("refunded") || a.includes("chargeback")) return "REFUNDED";
  if (a.includes("created") || a.includes("updated")) return "PENDING";
  return undefined;
}

function normalizeSubscriptionStatus(
  raw?: string,
): LocalSubscriptionStatus | undefined {
  const s = raw?.toLowerCase();
  switch (s) {
    case "authorized":
    case "active":
      return "ACTIVE";
    case "paused":
    case "halted":
    case "inactive":
      return "INACTIVE";
    case "cancelled":
    case "canceled":
      return "CANCELLED";
    case "expired":
      return "EXPIRED";
    default:
      return undefined;
  }
}

export async function handlePaymentWebhook(
  event: WebhookEventRow,
): Promise<void> {
  const paymentIdFromMp = event.dataId; 
  if (!paymentIdFromMp) return;

  const payment = await prisma.payment.findFirst({
    where: { mercadoPagoId: paymentIdFromMp },
  });
  if (!payment) {
    return;
  }

  const rd: any = event.rawData ?? {};
  const statusRaw =
    getStr(rd?.data?.status) ??
    getStr(rd?.status) ??
    getStr(rd?.payment?.status);

  const normalized =
    normalizePaymentStatus(statusRaw) ??
    inferPaymentStatusFromAction(event.action);

  if (!normalized) return;

  const data: any = {
    status: normalized,
    updatedAt: new Date(),
  };

  if (normalized === "APPROVED" && !payment.paidAt) {
    data.paidAt = new Date();
  }

  if (!payment.mercadoPagoId) data.mercadoPagoId = paymentIdFromMp;

  if (rd?.description && typeof rd.description === "string") {
    data.description = rd.description;
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data,
  });
}

export async function handleSubscriptionWebhook(
  event: WebhookEventRow,
): Promise<void> {
  const preapprovalId = event.dataId; 
  if (!preapprovalId) return;

  const sub = await prisma.subscription.findUnique({
    where: { preapprovalId },
  });
  if (!sub) return;

  const rd: any = event.rawData ?? {};
  const statusRaw =
    getStr(rd?.data?.status) ??
    getStr(rd?.status) ??
    getStr(rd?.subscription?.status) ??
    getStr(rd?.preapproval?.status);

  const normalized = normalizeSubscriptionStatus(statusRaw);
  if (!normalized) return;

  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: normalized,
      updatedAt: new Date(),
    },
  });
}


export async function processWebhookQueue(batchSize = 50): Promise<void> {
  const events = await webhookRepository.getUnprocessedEvents(batchSize);

  for (const e of events) {
    await webhookRepository.processWebhookEvent(e.id, async (evt) => {
      if (evt.type === "payment") {
        await handlePaymentWebhook(evt);
      } else if (evt.type === "subscription") {
        await handleSubscriptionWebhook(evt);
      } else {
      }
    });
  }
}

export default {
  handlePaymentWebhook,
  handleSubscriptionWebhook,
  processWebhookQueue,
};
