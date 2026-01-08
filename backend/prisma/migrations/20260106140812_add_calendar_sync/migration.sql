-- CreateEnum
CREATE TYPE "CalendarProvider" AS ENUM ('GOOGLE', 'MICROSOFT', 'APPLE');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('DISCONNECTED', 'CONNECTING', 'INITIAL_SYNC', 'ACTIVE', 'SYNCING', 'PAUSED', 'ERROR', 'TOKEN_EXPIRED');

-- CreateEnum
CREATE TYPE "SyncDirection" AS ENUM ('READ_ONLY', 'WRITE_ONLY', 'BIDIRECTIONAL');

-- CreateEnum
CREATE TYPE "PrivacyMode" AS ENUM ('FULL', 'BUSY_ONLY', 'TITLE_ONLY');

-- CreateEnum
CREATE TYPE "EventSyncStatus" AS ENUM ('SYNCED', 'PENDING_INBOUND', 'PENDING_OUTBOUND', 'CONFLICT', 'ERROR');

-- CreateEnum
CREATE TYPE "ConflictStrategy" AS ENUM ('LAST_WRITE_WINS', 'SOURCE_PRIORITY', 'MANUAL');

-- AlterTable
ALTER TABLE "time_block" ADD COLUMN     "calendarSourceId" TEXT,
ADD COLUMN     "externalEventId" TEXT,
ADD COLUMN     "isFromCalendar" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "calendar_connection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "CalendarProvider" NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "providerEmail" TEXT,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "errorMessage" TEXT,
    "lastErrorAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncDuration" INTEGER,
    "syncToken" TEXT,
    "webhookChannelId" TEXT,
    "webhookSecret" TEXT,
    "webhookExpiresAt" TIMESTAMP(3),
    "webhookResourceId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "syncIntervalMins" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_token" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "accessTokenEncrypted" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT,
    "tokenIv" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "scopes" TEXT[],
    "tokenType" TEXT NOT NULL DEFAULT 'Bearer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_source" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "externalCalendarId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "timeZone" TEXT,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "syncDirection" "SyncDirection" NOT NULL DEFAULT 'BIDIRECTIONAL',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "privacyMode" "PrivacyMode" NOT NULL DEFAULT 'FULL',
    "defaultEventType" TEXT NOT NULL DEFAULT 'Meeting',
    "excludePatterns" TEXT[],
    "calendarSyncToken" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_mapping" (
    "id" TEXT NOT NULL,
    "calendarSourceId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "externalEtag" TEXT,
    "externalUpdatedAt" TIMESTAMP(3),
    "timeBlockId" TEXT,
    "syncStatus" "EventSyncStatus" NOT NULL DEFAULT 'SYNCED',
    "lastSyncDirection" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "syncError" TEXT,
    "lastKnownTitle" TEXT,
    "lastKnownStart" TIMESTAMP(3),
    "lastKnownEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_conflict" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "conflictType" TEXT NOT NULL,
    "localEventId" TEXT,
    "localTitle" TEXT,
    "localStart" TIMESTAMP(3),
    "localEnd" TIMESTAMP(3),
    "localUpdatedAt" TIMESTAMP(3),
    "remoteEventId" TEXT,
    "remoteTitle" TEXT,
    "remoteStart" TIMESTAMP(3),
    "remoteEnd" TIMESTAMP(3),
    "remoteUpdatedAt" TIMESTAMP(3),
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_conflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_audit_log" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "eventsProcessed" INTEGER,
    "eventsCreated" INTEGER,
    "eventsUpdated" INTEGER,
    "eventsDeleted" INTEGER,
    "conflictsFound" INTEGER,
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_calendar_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultSyncDirection" "SyncDirection" NOT NULL DEFAULT 'BIDIRECTIONAL',
    "defaultPrivacyMode" "PrivacyMode" NOT NULL DEFAULT 'FULL',
    "defaultEventType" TEXT NOT NULL DEFAULT 'Meeting',
    "conflictStrategy" "ConflictStrategy" NOT NULL DEFAULT 'LAST_WRITE_WINS',
    "primaryCalendarId" TEXT,
    "notifyOnConflict" BOOLEAN NOT NULL DEFAULT true,
    "syncRangeMonthsPast" INTEGER NOT NULL DEFAULT 1,
    "syncRangeMonthsFuture" INTEGER NOT NULL DEFAULT 6,
    "doubleBookingAlert" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_calendar_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calendar_connection_userId_idx" ON "calendar_connection"("userId");

-- CreateIndex
CREATE INDEX "calendar_connection_status_idx" ON "calendar_connection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_connection_userId_provider_providerAccountId_key" ON "calendar_connection"("userId", "provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_token_connectionId_key" ON "calendar_token"("connectionId");

-- CreateIndex
CREATE INDEX "calendar_token_expiresAt_idx" ON "calendar_token"("expiresAt");

-- CreateIndex
CREATE INDEX "calendar_source_connectionId_idx" ON "calendar_source"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_source_connectionId_externalCalendarId_key" ON "calendar_source"("connectionId", "externalCalendarId");

-- CreateIndex
CREATE INDEX "event_mapping_timeBlockId_idx" ON "event_mapping"("timeBlockId");

-- CreateIndex
CREATE INDEX "event_mapping_syncStatus_idx" ON "event_mapping"("syncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "event_mapping_calendarSourceId_externalEventId_key" ON "event_mapping"("calendarSourceId", "externalEventId");

-- CreateIndex
CREATE INDEX "calendar_conflict_connectionId_idx" ON "calendar_conflict"("connectionId");

-- CreateIndex
CREATE INDEX "calendar_conflict_resolved_idx" ON "calendar_conflict"("resolved");

-- CreateIndex
CREATE INDEX "sync_audit_log_connectionId_idx" ON "sync_audit_log"("connectionId");

-- CreateIndex
CREATE INDEX "sync_audit_log_createdAt_idx" ON "sync_audit_log"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_calendar_settings_userId_key" ON "user_calendar_settings"("userId");

-- CreateIndex
CREATE INDEX "time_block_isFromCalendar_idx" ON "time_block"("isFromCalendar");

-- CreateIndex
CREATE INDEX "time_block_externalEventId_idx" ON "time_block"("externalEventId");

-- AddForeignKey
ALTER TABLE "calendar_token" ADD CONSTRAINT "calendar_token_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "calendar_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_source" ADD CONSTRAINT "calendar_source_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "calendar_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_mapping" ADD CONSTRAINT "event_mapping_calendarSourceId_fkey" FOREIGN KEY ("calendarSourceId") REFERENCES "calendar_source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_conflict" ADD CONSTRAINT "calendar_conflict_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "calendar_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_audit_log" ADD CONSTRAINT "sync_audit_log_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "calendar_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
