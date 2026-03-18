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

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" TEXT DEFAULT 'user',
    "banned" BOOLEAN,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN DEFAULT false,
    "forcePasswordChange" BOOLEAN DEFAULT false,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,
    "activeOrganizationId" TEXT,
    "activeTeamId" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twoFactor" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "twoFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "bannedAt" TIMESTAMP(3),

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "firstResendAt" TIMESTAMP(3),
    "lastResendAt" TIMESTAMP(3),
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "teamId" TEXT,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizationRole" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permission" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizationRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "organizationId" TEXT,
    "sessionId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deletion_request" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT (now() + interval '30 days'),
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "deletion_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_policy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "minLength" INTEGER NOT NULL DEFAULT 8,
    "requireUppercase" BOOLEAN NOT NULL DEFAULT false,
    "requireLowercase" BOOLEAN NOT NULL DEFAULT false,
    "requireNumbers" BOOLEAN NOT NULL DEFAULT false,
    "requireSpecialChars" BOOLEAN NOT NULL DEFAULT false,
    "preventReuse" INTEGER NOT NULL DEFAULT 5,
    "expirationDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "known_device" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "name" TEXT,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "known_device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ownership_transfer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ownership_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "life_area" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "order" INTEGER NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "life_area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "day" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "userId" TEXT NOT NULL,
    "lifeAreaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "top_priority" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "dayId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "carriedToDate" DATE,

    CONSTRAINT "top_priority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discussion_item" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "dayId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discussion_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_block" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Deep Work',
    "dayId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isFromCalendar" BOOLEAN NOT NULL DEFAULT false,
    "calendarSourceId" TEXT,
    "externalEventId" TEXT,
    "priorityId" TEXT,
    "category" TEXT NOT NULL DEFAULT 'focus',
    "recurrenceRule" TEXT,
    "recurrenceEndDate" TIMESTAMP(3),
    "parentBlockId" TEXT,
    "blockExternalCalendars" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "time_block_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "quick_note" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quick_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_review" (
    "id" TEXT NOT NULL,
    "wentWell" TEXT,
    "didntGoWell" TEXT,
    "dayId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "maxTopPriorities" INTEGER NOT NULL DEFAULT 3,
    "maxDiscussionItems" INTEGER NOT NULL DEFAULT 3,
    "enabledSections" TEXT NOT NULL DEFAULT '["priorities","discussion","schedule","notes","progress","review"]',
    "defaultTimeBlockDuration" INTEGER NOT NULL DEFAULT 60,
    "defaultTimeBlockType" TEXT NOT NULL DEFAULT 'Deep Work',
    "endOfDayReviewEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoCarryForward" BOOLEAN NOT NULL DEFAULT true,
    "autoCreateNextDay" BOOLEAN NOT NULL DEFAULT true,
    "toolsTabEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pomodoroEnabled" BOOLEAN NOT NULL DEFAULT true,
    "eisenhowerEnabled" BOOLEAN NOT NULL DEFAULT true,
    "decisionLogEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pomodoroFocusDuration" INTEGER NOT NULL DEFAULT 25,
    "pomodoroShortBreak" INTEGER NOT NULL DEFAULT 5,
    "pomodoroLongBreak" INTEGER NOT NULL DEFAULT 15,
    "pomodoroSoundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "focusBlocksCalendar" BOOLEAN NOT NULL DEFAULT true,
    "lifeAreasEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultLifeAreaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_block_type" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366F1',
    "icon" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_block_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eisenhower_task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lifeAreaId" TEXT,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "quadrant" INTEGER NOT NULL,
    "scheduledTimeBlockId" TEXT,
    "promotedDate" TIMESTAMP(3),
    "promotedPriorityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eisenhower_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_entry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lifeAreaId" TEXT,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "context" TEXT,
    "decision" TEXT NOT NULL,
    "outcome" TEXT,
    "eisenhowerTaskId" TEXT,
    "priorityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decision_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_focus_session" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "focusSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_focus_session_pkey" PRIMARY KEY ("id")
);

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
    "webhookChannelId" TEXT,
    "webhookResourceId" TEXT,
    "webhookExpiresAt" TIMESTAMP(3),
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
    "isBlockingEvent" BOOLEAN NOT NULL DEFAULT false,
    "blockedByMappingId" TEXT,
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
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "twoFactor_secret_idx" ON "twoFactor"("secret");

-- CreateIndex
CREATE INDEX "twoFactor_userId_idx" ON "twoFactor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- CreateIndex
CREATE INDEX "organization_banned_idx" ON "organization"("banned");

-- CreateIndex
CREATE INDEX "member_organizationId_idx" ON "member"("organizationId");

-- CreateIndex
CREATE INDEX "member_userId_idx" ON "member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "member_userId_organizationId_key" ON "member"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "invitation_organizationId_idx" ON "invitation"("organizationId");

-- CreateIndex
CREATE INDEX "invitation_email_idx" ON "invitation"("email");

-- CreateIndex
CREATE INDEX "team_organizationId_idx" ON "team"("organizationId");

-- CreateIndex
CREATE INDEX "teamMember_teamId_idx" ON "teamMember"("teamId");

-- CreateIndex
CREATE INDEX "teamMember_userId_idx" ON "teamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "teamMember_teamId_userId_key" ON "teamMember"("teamId", "userId");

-- CreateIndex
CREATE INDEX "organizationRole_organizationId_idx" ON "organizationRole"("organizationId");

-- CreateIndex
CREATE INDEX "organizationRole_role_idx" ON "organizationRole"("role");

-- CreateIndex
CREATE UNIQUE INDEX "organizationRole_organizationId_role_key" ON "organizationRole"("organizationId", "role");

-- CreateIndex
CREATE INDEX "audit_log_userId_idx" ON "audit_log"("userId");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_resourceType_resourceId_idx" ON "audit_log"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "audit_log_organizationId_idx" ON "audit_log"("organizationId");

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- CreateIndex
CREATE INDEX "rate_limit_key_idx" ON "rate_limit"("key");

-- CreateIndex
CREATE UNIQUE INDEX "deletion_request_token_key" ON "deletion_request"("token");

-- CreateIndex
CREATE INDEX "deletion_request_userId_idx" ON "deletion_request"("userId");

-- CreateIndex
CREATE INDEX "deletion_request_status_idx" ON "deletion_request"("status");

-- CreateIndex
CREATE INDEX "deletion_request_expiresAt_idx" ON "deletion_request"("expiresAt");

-- CreateIndex
CREATE INDEX "deletion_request_token_idx" ON "deletion_request"("token");

-- CreateIndex
CREATE INDEX "password_history_userId_idx" ON "password_history"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "password_history_userId_hash_key" ON "password_history"("userId", "hash");

-- CreateIndex
CREATE UNIQUE INDEX "password_policy_organizationId_key" ON "password_policy"("organizationId");

-- CreateIndex
CREATE INDEX "known_device_userId_idx" ON "known_device"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "known_device_userId_fingerprint_key" ON "known_device"("userId", "fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "ownership_transfer_token_key" ON "ownership_transfer"("token");

-- CreateIndex
CREATE INDEX "ownership_transfer_organizationId_idx" ON "ownership_transfer"("organizationId");

-- CreateIndex
CREATE INDEX "ownership_transfer_token_idx" ON "ownership_transfer"("token");

-- CreateIndex
CREATE INDEX "ownership_transfer_status_idx" ON "ownership_transfer"("status");

-- CreateIndex
CREATE INDEX "life_area_userId_idx" ON "life_area"("userId");

-- CreateIndex
CREATE INDEX "day_userId_idx" ON "day"("userId");

-- CreateIndex
CREATE INDEX "day_lifeAreaId_idx" ON "day"("lifeAreaId");

-- CreateIndex
CREATE UNIQUE INDEX "day_userId_date_lifeAreaId_key" ON "day"("userId", "date", "lifeAreaId");

-- CreateIndex
CREATE INDEX "top_priority_dayId_idx" ON "top_priority"("dayId");

-- CreateIndex
CREATE INDEX "top_priority_carriedToDate_idx" ON "top_priority"("carriedToDate");

-- CreateIndex
CREATE INDEX "discussion_item_dayId_idx" ON "discussion_item"("dayId");

-- CreateIndex
CREATE INDEX "time_block_dayId_idx" ON "time_block"("dayId");

-- CreateIndex
CREATE INDEX "time_block_isFromCalendar_idx" ON "time_block"("isFromCalendar");

-- CreateIndex
CREATE INDEX "time_block_externalEventId_idx" ON "time_block"("externalEventId");

-- CreateIndex
CREATE INDEX "time_block_priorityId_idx" ON "time_block"("priorityId");

-- CreateIndex
CREATE INDEX "time_block_category_idx" ON "time_block"("category");

-- CreateIndex
CREATE INDEX "time_block_parentBlockId_idx" ON "time_block"("parentBlockId");

-- CreateIndex
CREATE INDEX "focus_session_timeBlockId_idx" ON "focus_session"("timeBlockId");

-- CreateIndex
CREATE INDEX "focus_session_startedAt_idx" ON "focus_session"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "quick_note_dayId_key" ON "quick_note"("dayId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_review_dayId_key" ON "daily_review"("dayId");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- CreateIndex
CREATE INDEX "user_settings_userId_idx" ON "user_settings"("userId");

-- CreateIndex
CREATE INDEX "time_block_type_userId_idx" ON "time_block_type"("userId");

-- CreateIndex
CREATE INDEX "time_block_type_isDefault_idx" ON "time_block_type"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "time_block_type_userId_name_key" ON "time_block_type"("userId", "name");

-- CreateIndex
CREATE INDEX "eisenhower_task_userId_idx" ON "eisenhower_task"("userId");

-- CreateIndex
CREATE INDEX "eisenhower_task_lifeAreaId_idx" ON "eisenhower_task"("lifeAreaId");

-- CreateIndex
CREATE INDEX "eisenhower_task_scheduledTimeBlockId_idx" ON "eisenhower_task"("scheduledTimeBlockId");

-- CreateIndex
CREATE INDEX "decision_entry_userId_idx" ON "decision_entry"("userId");

-- CreateIndex
CREATE INDEX "decision_entry_lifeAreaId_idx" ON "decision_entry"("lifeAreaId");

-- CreateIndex
CREATE INDEX "decision_entry_eisenhowerTaskId_idx" ON "decision_entry"("eisenhowerTaskId");

-- CreateIndex
CREATE INDEX "decision_entry_priorityId_idx" ON "decision_entry"("priorityId");

-- CreateIndex
CREATE INDEX "decision_focus_session_decisionId_idx" ON "decision_focus_session"("decisionId");

-- CreateIndex
CREATE INDEX "decision_focus_session_focusSessionId_idx" ON "decision_focus_session"("focusSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "decision_focus_session_decisionId_focusSessionId_key" ON "decision_focus_session"("decisionId", "focusSessionId");

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
CREATE INDEX "calendar_source_webhookExpiresAt_idx" ON "calendar_source"("webhookExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_source_connectionId_externalCalendarId_key" ON "calendar_source"("connectionId", "externalCalendarId");

-- CreateIndex
CREATE INDEX "event_mapping_timeBlockId_idx" ON "event_mapping"("timeBlockId");

-- CreateIndex
CREATE INDEX "event_mapping_syncStatus_idx" ON "event_mapping"("syncStatus");

-- CreateIndex
CREATE INDEX "event_mapping_blockedByMappingId_idx" ON "event_mapping"("blockedByMappingId");

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

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teamMember" ADD CONSTRAINT "teamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizationRole" ADD CONSTRAINT "organizationRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_request" ADD CONSTRAINT "deletion_request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_transfer" ADD CONSTRAINT "ownership_transfer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "life_area" ADD CONSTRAINT "life_area_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "day" ADD CONSTRAINT "day_lifeAreaId_fkey" FOREIGN KEY ("lifeAreaId") REFERENCES "life_area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "top_priority" ADD CONSTRAINT "top_priority_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_item" ADD CONSTRAINT "discussion_item_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_block" ADD CONSTRAINT "time_block_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_block" ADD CONSTRAINT "time_block_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "top_priority"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_block" ADD CONSTRAINT "time_block_parentBlockId_fkey" FOREIGN KEY ("parentBlockId") REFERENCES "time_block"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_session" ADD CONSTRAINT "focus_session_timeBlockId_fkey" FOREIGN KEY ("timeBlockId") REFERENCES "time_block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quick_note" ADD CONSTRAINT "quick_note_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_review" ADD CONSTRAINT "daily_review_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_block_type" ADD CONSTRAINT "time_block_type_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eisenhower_task" ADD CONSTRAINT "eisenhower_task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eisenhower_task" ADD CONSTRAINT "eisenhower_task_lifeAreaId_fkey" FOREIGN KEY ("lifeAreaId") REFERENCES "life_area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eisenhower_task" ADD CONSTRAINT "eisenhower_task_scheduledTimeBlockId_fkey" FOREIGN KEY ("scheduledTimeBlockId") REFERENCES "time_block"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_entry" ADD CONSTRAINT "decision_entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_entry" ADD CONSTRAINT "decision_entry_lifeAreaId_fkey" FOREIGN KEY ("lifeAreaId") REFERENCES "life_area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_entry" ADD CONSTRAINT "decision_entry_eisenhowerTaskId_fkey" FOREIGN KEY ("eisenhowerTaskId") REFERENCES "eisenhower_task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_entry" ADD CONSTRAINT "decision_entry_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "top_priority"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_focus_session" ADD CONSTRAINT "decision_focus_session_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "decision_entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_focus_session" ADD CONSTRAINT "decision_focus_session_focusSessionId_fkey" FOREIGN KEY ("focusSessionId") REFERENCES "focus_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_connection" ADD CONSTRAINT "calendar_connection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_token" ADD CONSTRAINT "calendar_token_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "calendar_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_source" ADD CONSTRAINT "calendar_source_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "calendar_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_mapping" ADD CONSTRAINT "event_mapping_calendarSourceId_fkey" FOREIGN KEY ("calendarSourceId") REFERENCES "calendar_source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_mapping" ADD CONSTRAINT "event_mapping_blockedByMappingId_fkey" FOREIGN KEY ("blockedByMappingId") REFERENCES "event_mapping"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_conflict" ADD CONSTRAINT "calendar_conflict_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "calendar_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_audit_log" ADD CONSTRAINT "sync_audit_log_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "calendar_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_calendar_settings" ADD CONSTRAINT "user_calendar_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

