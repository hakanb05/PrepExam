/*
  Warnings:

  - You are about to drop the column `purchaseDate` on the `Purchase` table. All the data in the column will be lost.
  - You are about to drop the column `validUntil` on the `Purchase` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,examId]` on the table `Purchase` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Purchase_userId_examId_purchaseDate_idx";

-- DropIndex
DROP INDEX "public"."Purchase_userId_examId_purchaseDate_key";

-- AlterTable
ALTER TABLE "public"."Purchase" DROP COLUMN "purchaseDate",
DROP COLUMN "validUntil",
ADD COLUMN     "amount" INTEGER NOT NULL DEFAULT 2500,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'usd',
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "stripePaymentIntentId" TEXT;

-- CreateIndex
CREATE INDEX "Purchase_userId_examId_purchasedAt_idx" ON "public"."Purchase"("userId", "examId", "purchasedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_userId_examId_key" ON "public"."Purchase"("userId", "examId");
