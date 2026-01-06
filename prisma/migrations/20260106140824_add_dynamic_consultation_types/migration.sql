/*
  Warnings:

  - You are about to drop the column `type` on the `appointments` table. All the data in the column will be lost.
  - Added the required column `amount` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `consultationTypeId` to the `appointments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."appointments" DROP COLUMN "type",
ADD COLUMN     "amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "consultationTypeId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "public"."ConsultationType";

-- CreateTable
CREATE TABLE "public"."consultation_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_types_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_consultationTypeId_fkey" FOREIGN KEY ("consultationTypeId") REFERENCES "public"."consultation_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
