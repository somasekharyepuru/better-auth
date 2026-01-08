import { CalendarProvider } from '@prisma/client';

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes: string[];
  tokenType: string;
}

export interface ExternalCalendar {
  id: string;
  name: string;
  description?: string;
  color?: string;
  timeZone?: string;
  isPrimary: boolean;
  accessRole: 'owner' | 'writer' | 'reader';
}

export interface ExternalEvent {
  id: string;
  recurringEventId?: string;
  etag?: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  timeZone?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  visibility: 'public' | 'private' | 'confidential';
  attendees?: EventAttendee[];
  recurrence?: string[];
  updatedAt: Date;
  createdAt: Date;
  htmlLink?: string;
}

export interface EventAttendee {
  email: string;
  name?: string;
  responseStatus?: string;
}

export interface EventsResult {
  events: ExternalEvent[];
  nextSyncToken?: string;
  nextPageToken?: string;
  hasMore: boolean;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  isAllDay?: boolean;
  timeZone?: string;
  location?: string;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string;
}

export interface WebhookChannel {
  channelId: string;
  resourceId?: string;
  expiration: Date;
  token?: string;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface GetEventsOptions {
  syncToken?: string;
  pageToken?: string;
  maxResults?: number;
  appleId?: string;
}

export interface RateLimitConfig {
  provider: CalendarProvider;
  limits: {
    perSecond: number;
    perMinute: number;
  };
  userLimits: {
    perSecond: number;
    perMinute: number;
  };
}

export interface CircuitState {
  status: 'closed' | 'open' | 'half-open';
  failures: number;
  nextAttemptAt: number;
  lastError?: string;
}

export enum CalendarJobType {
  INITIAL_SYNC = 'initial_sync',
  INCREMENTAL_SYNC = 'incremental_sync',
  WEBHOOK_SYNC = 'webhook_sync',
  OUTBOUND_CREATE = 'outbound_create',
  OUTBOUND_UPDATE = 'outbound_update',
  OUTBOUND_DELETE = 'outbound_delete',
  TOKEN_REFRESH = 'token_refresh',
  WEBHOOK_RENEW = 'webhook_renew',
  CLEANUP_STALE = 'cleanup_stale',
}

export interface InitialSyncJobData {
  connectionId: string;
  userId: string;
  provider: CalendarProvider;
  sourceIds?: string[];
}

export interface IncrementalSyncJobData {
  connectionId: string;
  userId: string;
  provider: CalendarProvider;
  sourceId: string;
  syncToken?: string;
  triggeredBy: 'webhook' | 'poll' | 'manual';
}

export interface OutboundSyncJobData {
  connectionId: string;
  sourceId: string;
  timeBlockId: string;
  action: 'create' | 'update' | 'delete';
  previousData?: {
    externalEventId?: string;
    title?: string;
    startTime?: Date;
    endTime?: Date;
  };
}

export interface TokenRefreshJobData {
  connectionId: string;
  provider: CalendarProvider;
  expiresAt: Date;
  isProactive: boolean;
}

export interface WebhookProcessJobData {
  connectionId: string;
  sourceId: string;
  provider: CalendarProvider;
  payload: Record<string, unknown>;
  receivedAt: Date;
}
