-- AlterEnum
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'CONFIRMED';

-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "paymentMethod" TEXT;

-- CreateTable
CREATE TABLE "public"."processed_webhook_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "action" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processed_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "processed_webhook_events_eventId_key" ON "public"."processed_webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "processed_webhook_events_eventId_idx" ON "public"."processed_webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "processed_webhook_events_processed_idx" ON "public"."processed_webhook_events"("processed");
