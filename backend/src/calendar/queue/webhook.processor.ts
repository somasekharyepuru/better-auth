import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { CALENDAR_QUEUES } from './calendar-queue.constants';
import { WebhookProcessJobData } from '../types/calendar.types';
import { CalendarWebhookService } from '../webhook/webhook.service';

@Processor(CALENDAR_QUEUES.WEBHOOK_PROCESS)
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    @Inject(forwardRef(() => CalendarWebhookService))
    private readonly webhookService: CalendarWebhookService,
  ) {
    super();
  }

  async process(job: Job<WebhookProcessJobData>): Promise<void> {
    const { connectionId, provider, payload } = job.data;
    this.logger.log(`Processing webhook for connection ${connectionId} from ${provider}`);

    try {
      switch (provider) {
        case 'GOOGLE':
          await this.processGoogleWebhook(connectionId, payload);
          break;
        case 'MICROSOFT':
          await this.processMicrosoftWebhook(connectionId, payload);
          break;
        default:
          this.logger.warn(`Unknown provider for webhook: ${provider}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process webhook for ${connectionId}:`, error);
      throw error;
    }
  }

  private async processGoogleWebhook(connectionId: string, payload: Record<string, unknown>): Promise<void> {
    this.logger.debug(`Google webhook payload for ${connectionId}:`, payload);
    const resourceState = payload.resourceState as string;

    if (resourceState === 'exists' || resourceState === 'update') {
      await this.webhookService.triggerIncrementalSync(connectionId);
    }
  }

  private async processMicrosoftWebhook(connectionId: string, payload: Record<string, unknown>): Promise<void> {
    this.logger.debug(`Microsoft webhook payload for ${connectionId}:`, payload);
    const changeType = payload.changeType as string;

    if (['created', 'updated', 'deleted'].includes(changeType)) {
      await this.webhookService.triggerIncrementalSync(connectionId);
    }
  }
}
