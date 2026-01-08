import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CALENDAR_QUEUES } from './calendar-queue.constants';
import {
  GoogleSyncProcessor,
  MicrosoftSyncProcessor,
  AppleSyncProcessor,
  OutboundSyncProcessor,
} from './sync.processor';
import { WebhookProcessor } from './webhook.processor';
import { TokenRefreshProcessor } from './token-refresh.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: CALENDAR_QUEUES.GOOGLE_SYNC,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        },
      },
      {
        name: CALENDAR_QUEUES.MICROSOFT_SYNC,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        },
      },
      {
        name: CALENDAR_QUEUES.APPLE_SYNC,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        },
      },
      {
        name: CALENDAR_QUEUES.WEBHOOK_PROCESS,
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: 'exponential', delay: 1000 },
          priority: 1,
          removeOnComplete: { count: 1000 },
        },
      },
      {
        name: CALENDAR_QUEUES.TOKEN_REFRESH,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'fixed', delay: 5000 },
          removeOnComplete: { count: 50 },
        },
      },
      {
        name: CALENDAR_QUEUES.OUTBOUND_SYNC,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 100 },
        },
      },
      {
        name: CALENDAR_QUEUES.CLEANUP,
        defaultJobOptions: {
          attempts: 1,
          removeOnComplete: { count: 10 },
        },
      },
    ),
  ],
  providers: [
    GoogleSyncProcessor,
    MicrosoftSyncProcessor,
    AppleSyncProcessor,
    OutboundSyncProcessor,
    WebhookProcessor,
    TokenRefreshProcessor,
  ],
  exports: [BullModule],
})
export class CalendarQueueModule {}
