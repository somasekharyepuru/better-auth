export const CALENDAR_QUEUES = {
  GOOGLE_SYNC: 'calendar_google_sync',
  MICROSOFT_SYNC: 'calendar_microsoft_sync',
  APPLE_SYNC: 'calendar_apple_sync',
  WEBHOOK_PROCESS: 'calendar_webhook_process',
  TOKEN_REFRESH: 'calendar_token_refresh',
  OUTBOUND_SYNC: 'calendar_outbound_sync',
  CLEANUP: 'calendar_cleanup',
} as const;

export type CalendarQueueName = (typeof CALENDAR_QUEUES)[keyof typeof CALENDAR_QUEUES];
