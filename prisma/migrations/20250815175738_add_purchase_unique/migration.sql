/*
  Warnings:

  - A unique constraint covering the columns `[userId,examId,purchaseDate]` on the table `Purchase` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_userId_examId_purchaseDate_key" ON "public"."Purchase"("userId", "examId", "purchaseDate");
