import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { auth } from './auth/auth.config';
import { AuditModule } from './audit/audit.module';
import { EmailQueueModule } from './email-queue/email-queue.module';
import { HealthModule } from './health/health.module';
import { SessionsModule } from './sessions/sessions.module';
import { AccountDeletionModule } from './account-deletion/account-deletion.module';
import { PrismaModule } from './common/prisma.module';
import { PasswordPolicyModule } from './password-policy/password-policy.module';
import { DeviceTrackingModule } from './device-tracking/device-tracking.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { MobileAuthMiddleware } from './common/mobile-auth.middleware';
import { RequestContextMiddleware } from './common/request-context.middleware';
import { AuditMiddleware } from './audit/audit.middleware';
import { AdminModule } from './admin/admin.module';
import { OrganizationModule } from './organization/organization.module';
import { OrganizationBanMiddleware } from './organization/organization-ban.middleware';
import { AuthCompatMiddleware } from './common/auth-compat.middleware';

// Productivity modules
import { CalendarModule } from './calendar/calendar.module';
import { DaysModule } from './days/days.module';
import { PrioritiesModule } from './priorities/priorities.module';
import { TimeBlocksModule } from './time-blocks/time-blocks.module';
import { FocusSuiteModule } from './focus-suite/focus-suite.module';
import { LifeAreasModule } from './life-areas/life-areas.module';
import { EisenhowerModule } from './eisenhower/eisenhower.module';
import { DecisionLogModule } from './decision-log/decision-log.module';
import { DiscussionItemsModule } from './discussion-items/discussion-items.module';
import { QuickNotesModule } from './quick-notes/quick-notes.module';
import { DailyReviewModule } from './daily-review/daily-review.module';
import { SettingsModule } from './settings/settings.module';
import { TimeBlockTypesModule } from './time-block-types/time-block-types.module';

@Module({
    imports: [
        // Infrastructure
        PrismaModule,
        ThrottlerModule,
        BullModule.forRoot({
            connection: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379', 10),
                password: process.env.REDIS_PASSWORD || undefined,
            },
            defaultJobOptions: {
                removeOnComplete: 100,
                removeOnFail: 500,
            },
        }),
        ScheduleModule.forRoot(),

        // Auth-service modules
        AuthModule.forRoot({ auth }),
        AuditModule,
        EmailQueueModule,
        HealthModule,
        SessionsModule,
        AccountDeletionModule,
        PasswordPolicyModule,
        DeviceTrackingModule,
        AdminModule,
        OrganizationModule,

        // Productivity modules
        CalendarModule,
        DaysModule,
        PrioritiesModule,
        TimeBlocksModule,
        FocusSuiteModule,
        LifeAreasModule,
        EisenhowerModule,
        DecisionLogModule,
        DiscussionItemsModule,
        QuickNotesModule,
        DailyReviewModule,
        SettingsModule,
        TimeBlockTypesModule,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RequestContextMiddleware)
            .forRoutes('*');

        consumer
            .apply(MobileAuthMiddleware)
            .exclude('health', 'ready', 'queue-stats')
            .forRoutes('*');

        // Auth compat: copies session user to req.userId for productivity modules
        consumer
            .apply(AuthCompatMiddleware)
            .forRoutes('api/*');

        consumer
            .apply(OrganizationBanMiddleware)
            .forRoutes('api/organizations/*');

        consumer
            .apply(AuditMiddleware)
            .forRoutes('*');
    }
}
