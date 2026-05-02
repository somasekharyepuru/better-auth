import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma.module';
import { PlanLimitsService } from './plan-limits.service';
import { StripeService } from './stripe.service';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { TrialExpiryScheduler } from './trial-expiry.scheduler';

@Module({
  imports: [PrismaModule],
  providers: [
    PlanLimitsService,
    StripeService,
    SubscriptionService,
    TrialExpiryScheduler,
  ],
  controllers: [
    SubscriptionController,
    StripeWebhookController,
  ],
  exports: [
    PlanLimitsService,   // exported so every other module can inject it
    SubscriptionService,
  ],
})
export class SubscriptionModule {}
