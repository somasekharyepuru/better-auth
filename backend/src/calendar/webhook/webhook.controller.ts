import { Controller, Post, Param, Headers, Body, Res, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CALENDAR_QUEUES } from '../queue/calendar-queue.constants';
import { CalendarWebhookService } from './webhook.service';

interface MicrosoftWebhookNotification {
  subscriptionId: string;
  changeType: 'created' | 'updated' | 'deleted';
  resource: string;
  clientState?: string;
  lifecycleEvent?: string;
}

interface MicrosoftWebhookPayload {
  validationToken?: string;
  value?: MicrosoftWebhookNotification[];
}

@Controller('api/webhooks/calendar')
export class CalendarWebhookController {
  private readonly logger = new Logger(CalendarWebhookController.name);

  constructor(
    @InjectQueue(CALENDAR_QUEUES.WEBHOOK_PROCESS) private readonly webhookQueue: Queue,
    private readonly webhookService: CalendarWebhookService,
  ) {}

  @Post('google/:connectionId/:sourceId')
  async handleGoogleWebhook(
    @Param('connectionId') connectionId: string,
    @Param('sourceId') sourceId: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response,
  ) {
    res.status(HttpStatus.OK).send();

    const channelId = headers['x-goog-channel-id'];
    const resourceState = headers['x-goog-resource-state'];

    if (!channelId || !resourceState) {
      this.logger.warn(`Invalid Google webhook for source ${sourceId}`);
      return;
    }

    const isValid = await this.webhookService.verifyGoogleWebhookForSource(sourceId, channelId);
    if (!isValid) {
      this.logger.warn(`Invalid Google webhook for source ${sourceId}`);
      return;
    }

    if (resourceState === 'sync') {
      this.logger.debug(`Received sync confirmation for source ${sourceId}`);
      return;
    }

    this.logger.log(`Google webhook received for source ${sourceId}: ${resourceState}`);

    await this.webhookQueue.add(
      'google-webhook',
      {
        connectionId,
        sourceId,
        provider: 'GOOGLE',
        payload: {
          channelId,
          resourceState,
          resourceId: headers['x-goog-resource-id'],
        },
        receivedAt: new Date(),
      },
      { priority: 1 },
    );
  }

  @Post('microsoft/:connectionId/:sourceId')
  async handleMicrosoftWebhook(
    @Param('connectionId') connectionId: string,
    @Param('sourceId') sourceId: string,
    @Body() body: MicrosoftWebhookPayload,
    @Res() res: Response,
  ): Promise<void> {
    if (body.validationToken) {
      this.logger.debug(`Microsoft validation for source ${sourceId}`);
      res.status(HttpStatus.OK).contentType('text/plain').send(body.validationToken);
      return;
    }

    res.status(HttpStatus.ACCEPTED).send();

    if (body.value && Array.isArray(body.value)) {
      for (const notification of body.value) {
        if (notification.clientState) {
          const isValid = await this.webhookService.verifyMicrosoftWebhookForSource(
            sourceId,
            notification.clientState,
          );
          if (!isValid) {
            this.logger.warn(`Invalid Microsoft webhook for source ${sourceId}`);
            continue;
          }
        }

        if (notification.lifecycleEvent) {
          await this.handleMicrosoftLifecycle(sourceId, notification.lifecycleEvent);
          continue;
        }

        this.logger.log(`Microsoft webhook for source ${sourceId}: ${notification.changeType}`);

        await this.webhookQueue.add(
          'microsoft-webhook',
          {
            connectionId,
            sourceId,
            provider: 'MICROSOFT',
            payload: notification,
            receivedAt: new Date(),
          },
          { priority: 1 },
        );
      }
    }
  }

  private async handleMicrosoftLifecycle(sourceId: string, event: string) {
    switch (event) {
      case 'reauthorizationRequired':
        await this.webhookService.markSourceTokenExpired(sourceId);
        break;
      case 'subscriptionRemoved':
        await this.webhookService.markSourceWebhookExpired(sourceId);
        break;
      case 'missed':
        await this.webhookService.triggerSourceFullSync(sourceId);
        break;
    }
  }
}
