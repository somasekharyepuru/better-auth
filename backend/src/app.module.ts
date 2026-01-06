import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { HealthModule } from './health/health.module';
import { OrganizationModule } from './organization/organization.module';
import { PrismaModule } from './prisma/prisma.module';
import { DaysModule } from './days/days.module';
import { PrioritiesModule } from './priorities/priorities.module';
import { DiscussionItemsModule } from './discussion-items/discussion-items.module';
import { TimeBlocksModule } from './time-blocks/time-blocks.module';
import { QuickNotesModule } from './quick-notes/quick-notes.module';
import { DailyReviewModule } from './daily-review/daily-review.module';
import { SettingsModule } from './settings/settings.module';
import { EisenhowerModule } from './eisenhower/eisenhower.module';
import { DecisionLogModule } from './decision-log/decision-log.module';
import { LifeAreasModule } from './life-areas/life-areas.module';
import { CalendarModule } from './calendar/calendar.module';
import { AuthMiddleware } from './auth/auth.middleware';

@Module({
  imports: [
    // Rate limiting - 60 requests per minute
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),
    // BullMQ for job queues (Redis)
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    }),
    ConfigModule,
    AuthModule,
    MailModule,
    HealthModule,
    OrganizationModule,
    PrismaModule,
    LifeAreasModule,
    DaysModule,
    PrioritiesModule,
    DiscussionItemsModule,
    TimeBlocksModule,
    QuickNotesModule,
    DailyReviewModule,
    SettingsModule,
    EisenhowerModule,
    DecisionLogModule,
    CalendarModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('api/*');
  }
}
