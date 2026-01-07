-- AlterTable
ALTER TABLE "calendar_source" ADD COLUMN     "webhookChannelId" TEXT,
ADD COLUMN     "webhookExpiresAt" TIMESTAMP(3),
ADD COLUMN     "webhookResourceId" TEXT;

-- CreateIndex
CREATE INDEX "calendar_source_webhookExpiresAt_idx" ON "calendar_source"("webhookExpiresAt");
