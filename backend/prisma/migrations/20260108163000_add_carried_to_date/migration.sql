-- AlterTable - Add carriedToDate to track carried forward priorities
ALTER TABLE "top_priority" ADD COLUMN "carriedToDate" DATE;

-- CreateIndex
CREATE INDEX "top_priority_carriedToDate_idx" ON "top_priority"("carriedToDate");
