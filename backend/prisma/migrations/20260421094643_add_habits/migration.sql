-- CreateEnum
CREATE TYPE "HabitFrequency" AS ENUM ('DAILY', 'WEEKLY', 'X_PER_WEEK', 'X_PER_MONTH');

-- AlterTable
ALTER TABLE "deletion_request" ALTER COLUMN "expiresAt" SET DEFAULT (now() + interval '30 days');

-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN     "habitsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "habit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lifeAreaId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "emoji" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366F1',
    "frequency" "HabitFrequency" NOT NULL DEFAULT 'DAILY',
    "frequencyDays" INTEGER[],
    "targetCount" INTEGER,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_log" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "habit_userId_idx" ON "habit"("userId");

-- CreateIndex
CREATE INDEX "habit_lifeAreaId_idx" ON "habit"("lifeAreaId");

-- CreateIndex
CREATE INDEX "habit_log_habitId_idx" ON "habit_log"("habitId");

-- CreateIndex
CREATE INDEX "habit_log_date_idx" ON "habit_log"("date");

-- CreateIndex
CREATE UNIQUE INDEX "habit_log_habitId_date_key" ON "habit_log"("habitId", "date");

-- AddForeignKey
ALTER TABLE "habit" ADD CONSTRAINT "habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit" ADD CONSTRAINT "habit_lifeAreaId_fkey" FOREIGN KEY ("lifeAreaId") REFERENCES "life_area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_log" ADD CONSTRAINT "habit_log_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

