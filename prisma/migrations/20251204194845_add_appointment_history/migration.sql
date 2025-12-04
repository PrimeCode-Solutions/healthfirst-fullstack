-- CreateTable
CREATE TABLE "public"."appointment_history" (
    "id" TEXT NOT NULL,
    "originalId" TEXT,
    "userId" TEXT NOT NULL,
    "doctorId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "amount" DECIMAL(10,2),
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_history_pkey" PRIMARY KEY ("id")
);
