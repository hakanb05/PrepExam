/*
  Warnings:

  - You are about to drop the column `currentSectionId` on the `Attempt` table. All the data in the column will be lost.
  - Made the column `currentQuestionIndex` on table `AttemptSection` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Attempt" DROP COLUMN "currentSectionId";

-- AlterTable
ALTER TABLE "public"."AttemptSection" ALTER COLUMN "currentQuestionIndex" SET NOT NULL;
