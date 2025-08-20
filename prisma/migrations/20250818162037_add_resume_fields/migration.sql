-- AlterTable
ALTER TABLE "public"."Attempt" ADD COLUMN     "currentSectionId" TEXT;

-- AlterTable
ALTER TABLE "public"."AttemptSection" ADD COLUMN     "currentQuestionIndex" INTEGER DEFAULT 0;
