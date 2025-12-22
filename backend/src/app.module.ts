import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { AuthMiddleware } from './auth/auth.middleware';

@Module({
  imports: [
    // Rate limiting - 60 requests per minute
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),
    ConfigModule,
    AuthModule,
    MailModule,
    HealthModule,
    OrganizationModule,
    PrismaModule,
    DaysModule,
    PrioritiesModule,
    DiscussionItemsModule,
    TimeBlocksModule,
    QuickNotesModule,
    DailyReviewModule,
    SettingsModule,
    EisenhowerModule,
    DecisionLogModule,
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
