/*
  Warnings:

  - A unique constraint covering the columns `[questionId,letter]` on the table `Option` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Option_questionId_letter_key" ON "public"."Option"("questionId", "letter");
