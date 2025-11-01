import { PrismaClient } from "@/generated/prisma"; 

const prisma = new PrismaClient();

export type IncomingWebhookEventInput = {
  action: string; 
  apiVersion: string; 
  dataId: string; 
  dateCreated: Date; 
  type: string;
  rawData: unknown; 
};

export type WebhookEventRow = {
  id: string;
  action: string;
  apiVersion: string;
  dataId: string;
  dateCreated: Date;
  type: string;
  rawData: unknown;
  processed: boolean;
  createdAt: Date;
};

export type WebhookProcessHandler = (event: WebhookEventRow) => Promise<void>;

class WebhookRepository {
  constructor(private readonly db: PrismaClient) {}

  async createWebhookEvent(
    input: IncomingWebhookEventInput,
  ): Promise<WebhookEventRow> {
    const created = await this.db.webhookEvent.create({
      data: {
        action: input.action,
        apiVersion: input.apiVersion,
        dataId: input.dataId,
        dateCreated: input.dateCreated,
        type: input.type,
        rawData: input.rawData as any,
        processed: false,
      },
    });
    return created as WebhookEventRow;
  }

  async getUnprocessedEvents(limit = 50): Promise<WebhookEventRow[]> {
    const rows = await this.db.webhookEvent.findMany({
      where: { processed: false },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
    return rows as WebhookEventRow[];
  }

  async processWebhookEvent(
    id: string,
    handler: WebhookProcessHandler,
  ): Promise<void> {
    const evt = await this.db.webhookEvent.findUnique({ where: { id } });
    if (!evt) return;
    if (evt.processed) return;

    await handler(evt as WebhookEventRow);

    await this.db.webhookEvent.update({
      where: { id },
      data: { processed: true },
    });
  }
}

export const webhookRepository = new WebhookRepository(prisma);
export { WebhookRepository };
