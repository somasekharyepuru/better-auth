export const CALENDAR_QUEUES = {
  GOOGLE_SYNC: 'calendar:google:sync',
  MICROSOFT_SYNC: 'calendar:microsoft:sync',
  APPLE_SYNC: 'calendar:apple:sync',
  WEBHOOK_PROCESS: 'calendar:webhook:process',
  TOKEN_REFRESH: 'calendar:token:refresh',
  OUTBOUND_SYNC: 'calendar:outbound:sync',
  CLEANUP: 'calendar:cleanup',
} as const;

export type CalendarQueueName = (typeof CALENDAR_QUEUES)[keyof typeof CALENDAR_QUEUES];
