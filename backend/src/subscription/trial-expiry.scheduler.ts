import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionService } from './subscription.service';

/**
 * Runs daily at 02:00 UTC to expire in-app trials that have passed their end date.
 * Data is always preserved — only the plan reverts to FREE.
 */
@Injectable()
export class TrialExpiryScheduler {
  private readonly logger = new Logger(TrialExpiryScheduler.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleTrialExpiry() {
    this.logger.log('Running trial expiry check...');
    await this.subscriptionService.expireTrials();
  }
}
