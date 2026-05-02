-- CreateTable
CREATE TABLE "stripe_webhook_event" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stripe_webhook_event_stripeEventId_key" ON "stripe_webhook_event"("stripeEventId");

-- CreateIndex
CREATE INDEX "stripe_webhook_event_processed_idx" ON "stripe_webhook_event"("processed");
