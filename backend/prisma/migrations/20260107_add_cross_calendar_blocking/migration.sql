-- Add cross-calendar blocking fields to EventMapping
ALTER TABLE "event_mapping" ADD COLUMN "isBlockingEvent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "event_mapping" ADD COLUMN "blockedByMappingId" TEXT;

-- Add foreign key constraint
ALTER TABLE "event_mapping" ADD CONSTRAINT "event_mapping_blockedByMappingId_fkey" FOREIGN KEY ("blockedByMappingId") REFERENCES "event_mapping"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for efficient lookups
CREATE INDEX "event_mapping_blockedByMappingId_idx" ON "event_mapping"("blockedByMappingId");
