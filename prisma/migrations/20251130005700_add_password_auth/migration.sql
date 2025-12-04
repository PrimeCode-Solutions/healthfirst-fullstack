-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "public"."CategoryStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."ConsultationType" AS ENUM ('GENERAL', 'URGENT', 'FOLLOWUP');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ebook_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."CategoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ebook_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ebooks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "author" TEXT NOT NULL,
    "coverImage" TEXT,
    "fileUrl" TEXT NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL(10,2),
    "categoryId" TEXT NOT NULL,
    "fileSize" INTEGER,
    "fileType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ebooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_ebook_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ebookId" TEXT NOT NULL,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastDownload" TIMESTAMP(3),
    "firstAccess" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccess" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_ebook_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."business_hours" (
    "id" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "lunchBreakEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lunchStartTime" TEXT,
    "lunchEndTime" TEXT,
    "mondayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "tuesdayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "wednesdayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "thursdayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "fridayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "saturdayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "sundayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "appointmentDuration" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."appointments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "type" "public"."ConsultationType" NOT NULL DEFAULT 'GENERAL',
    "status" "public"."AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "patientName" TEXT NOT NULL,
    "patientEmail" TEXT,
    "patientPhone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT,
    "subscriptionId" TEXT,
    "mercadoPagoId" TEXT,
    "preferenceId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "description" TEXT NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payerEmail" TEXT,
    "payerName" TEXT,
    "payerPhone" TEXT,
    "successUrl" TEXT,
    "pendingUrl" TEXT,
    "failureUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mercadoPagoId" TEXT,
    "preapprovalId" TEXT NOT NULL,
    "planName" TEXT,
    "amount" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'INACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."webhook_events" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "apiVersion" TEXT NOT NULL,
    "dataId" TEXT NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "rawData" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ebook_categories_name_key" ON "public"."ebook_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_ebook_access_userId_ebookId_key" ON "public"."user_ebook_access"("userId", "ebookId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_appointmentId_key" ON "public"."payments"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_mercadoPagoId_key" ON "public"."payments"("mercadoPagoId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "public"."subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_mercadoPagoId_key" ON "public"."subscriptions"("mercadoPagoId");

-- AddForeignKey
ALTER TABLE "public"."ebooks" ADD CONSTRAINT "ebooks_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ebook_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_ebook_access" ADD CONSTRAINT "user_ebook_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_ebook_access" ADD CONSTRAINT "user_ebook_access_ebookId_fkey" FOREIGN KEY ("ebookId") REFERENCES "public"."ebooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
