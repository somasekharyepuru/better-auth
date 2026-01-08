-- AlterTable
ALTER TABLE "time_block" ADD COLUMN     "blockExternalCalendars" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'focus',
ADD COLUMN     "parentBlockId" TEXT,
ADD COLUMN     "priorityId" TEXT,
ADD COLUMN     "recurrenceEndDate" TIMESTAMP(3),
ADD COLUMN     "recurrenceRule" TEXT;

-- CreateTable
CREATE TABLE "focus_session" (
    "id" TEXT NOT NULL,
    "timeBlockId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "interrupted" BOOLEAN NOT NULL DEFAULT false,
    "sessionType" TEXT NOT NULL DEFAULT 'focus',
    "targetDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "focus_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "focus_session_timeBlockId_idx" ON "focus_session"("timeBlockId");

-- CreateIndex
CREATE INDEX "focus_session_startedAt_idx" ON "focus_session"("startedAt");

-- CreateIndex
CREATE INDEX "time_block_priorityId_idx" ON "time_block"("priorityId");

-- CreateIndex
CREATE INDEX "time_block_category_idx" ON "time_block"("category");

-- CreateIndex
CREATE INDEX "time_block_parentBlockId_idx" ON "time_block"("parentBlockId");

-- AddForeignKey
ALTER TABLE "time_block" ADD CONSTRAINT "time_block_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "top_priority"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_block" ADD CONSTRAINT "time_block_parentBlockId_fkey" FOREIGN KEY ("parentBlockId") REFERENCES "time_block"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_session" ADD CONSTRAINT "focus_session_timeBlockId_fkey" FOREIGN KEY ("timeBlockId") REFERENCES "time_block"("id") ON DELETE CASCADE ON UPDATE CASCADE;
