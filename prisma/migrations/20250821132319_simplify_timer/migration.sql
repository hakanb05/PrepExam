/*
  Warnings:

  - You are about to drop the column `pausedAt` on the `Attempt` table. All the data in the column will be lost.
  - You are about to drop the column `totalPausedTime` on the `Attempt` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Attempt" DROP COLUMN "pausedAt",
DROP COLUMN "totalPausedTime",
ADD COLUMN     "elapsedSeconds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isPaused" BOOLEAN NOT NULL DEFAULT false;
