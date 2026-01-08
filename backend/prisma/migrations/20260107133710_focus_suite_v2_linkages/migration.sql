-- AlterTable
ALTER TABLE "decision_entry" ADD COLUMN     "eisenhowerTaskId" TEXT,
ADD COLUMN     "priorityId" TEXT;

-- AlterTable
ALTER TABLE "eisenhower_task" ADD COLUMN     "promotedDate" TIMESTAMP(3),
ADD COLUMN     "promotedPriorityId" TEXT,
ADD COLUMN     "scheduledTimeBlockId" TEXT;

-- CreateTable
CREATE TABLE "decision_focus_session" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "focusSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_focus_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "decision_focus_session_decisionId_idx" ON "decision_focus_session"("decisionId");

-- CreateIndex
CREATE INDEX "decision_focus_session_focusSessionId_idx" ON "decision_focus_session"("focusSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "decision_focus_session_decisionId_focusSessionId_key" ON "decision_focus_session"("decisionId", "focusSessionId");

-- CreateIndex
CREATE INDEX "decision_entry_eisenhowerTaskId_idx" ON "decision_entry"("eisenhowerTaskId");

-- CreateIndex
CREATE INDEX "decision_entry_priorityId_idx" ON "decision_entry"("priorityId");

-- CreateIndex
CREATE INDEX "eisenhower_task_scheduledTimeBlockId_idx" ON "eisenhower_task"("scheduledTimeBlockId");

-- AddForeignKey
ALTER TABLE "eisenhower_task" ADD CONSTRAINT "eisenhower_task_scheduledTimeBlockId_fkey" FOREIGN KEY ("scheduledTimeBlockId") REFERENCES "time_block"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_entry" ADD CONSTRAINT "decision_entry_eisenhowerTaskId_fkey" FOREIGN KEY ("eisenhowerTaskId") REFERENCES "eisenhower_task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_entry" ADD CONSTRAINT "decision_entry_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "top_priority"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_focus_session" ADD CONSTRAINT "decision_focus_session_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "decision_entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_focus_session" ADD CONSTRAINT "decision_focus_session_focusSessionId_fkey" FOREIGN KEY ("focusSessionId") REFERENCES "focus_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
