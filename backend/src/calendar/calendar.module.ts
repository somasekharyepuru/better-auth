import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';

import { CalendarController } from './calendar.controller';
import { CalendarEventsController } from './events.controller';
import { CalendarOAuthController } from './calendar-oauth.controller';
import { CalendarWebhookController } from './webhook/webhook.controller';

import { GoogleCalendarProvider } from './providers/google-calendar.provider';
import { MicrosoftCalendarProvider } from './providers/microsoft-calendar.provider';
import { AppleCalDAVProvider } from './providers/apple-caldav.provider';
import { CalendarProviderFactory } from './providers/calendar-provider.factory';

import { CalendarTokenService } from './services/calendar-token.service';
import { CalendarConnectionService } from './services/calendar-connection.service';
import { CalendarSyncService } from './services/calendar-sync.service';
import { CalendarEventsService } from './services/events.service';
import { ScheduledJobsService } from './services/scheduled-jobs.service';

import { CalendarWebhookService } from './webhook/webhook.service';

import { CalendarRateLimiterService } from './rate-limit/rate-limiter.service';
import { CircuitBreakerService } from './rate-limit/circuit-breaker.service';

import {
  GoogleSyncProcessor,
  MicrosoftSyncProcessor,
  AppleSyncProcessor,
  OutboundSyncProcessor,
} from './queue/sync.processor';
import { WebhookProcessor } from './queue/webhook.processor';
import { TokenRefreshProcessor } from './queue/token-refresh.processor';

import { CALENDAR_QUEUES } from './queue/calendar-queue.constants';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue(
      { name: CALENDAR_QUEUES.GOOGLE_SYNC },
      { name: CALENDAR_QUEUES.MICROSOFT_SYNC },
      { name: CALENDAR_QUEUES.APPLE_SYNC },
      { name: CALENDAR_QUEUES.WEBHOOK_PROCESS },
      { name: CALENDAR_QUEUES.TOKEN_REFRESH },
      { name: CALENDAR_QUEUES.OUTBOUND_SYNC },
      { name: CALENDAR_QUEUES.CLEANUP },
    ),
  ],
  controllers: [CalendarController, CalendarEventsController, CalendarOAuthController, CalendarWebhookController],
  providers: [
    GoogleCalendarProvider,
    MicrosoftCalendarProvider,
    AppleCalDAVProvider,
    CalendarProviderFactory,

    CalendarTokenService,
    CalendarConnectionService,
    CalendarSyncService,
    CalendarEventsService,
    ScheduledJobsService,

    CalendarWebhookService,

    CalendarRateLimiterService,
    CircuitBreakerService,

    GoogleSyncProcessor,
    MicrosoftSyncProcessor,
    AppleSyncProcessor,
    OutboundSyncProcessor,
    WebhookProcessor,
    TokenRefreshProcessor,
  ],
  exports: [
    CalendarProviderFactory,
    CalendarTokenService,
    CalendarConnectionService,
    CalendarSyncService,
    CalendarEventsService,
  ],
})
export class CalendarModule { }
