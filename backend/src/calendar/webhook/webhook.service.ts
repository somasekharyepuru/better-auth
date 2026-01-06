import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { CALENDAR_QUEUES } from '../queue/calendar-queue.constants';

@Injectable()
export class CalendarWebhookService {
  private readonly logger = new Logger(CalendarWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(CALENDAR_QUEUES.GOOGLE_SYNC) private readonly googleQueue: Queue,
    @InjectQueue(CALENDAR_QUEUES.MICROSOFT_SYNC) private readonly microsoftQueue: Queue,
  ) {}

  async verifyGoogleWebhook(connectionId: string, channelToken?: string): Promise<boolean> {
    if (!channelToken) return false;

    const connection = await this.prisma.calendarConnection.findUnique({
      where: { id: connectionId },
      select: { webhookSecret: true },
    });

    return connection?.webhookSecret === channelToken;
  }

  async verifyMicrosoftWebhook(connectionId: string, clientState?: string): Promise<boolean> {
    if (!clientState) return false;

    const connection = await this.prisma.calendarConnection.findUnique({
      where: { id: connectionId },
      select: { webhookSecret: true },
    });

    return connection?.webhookSecret === clientState;
  }

  async markTokenExpired(connectionId: string): Promise<void> {
    await this.prisma.calendarConnection.update({
      where: { id: connectionId },
      data: {
        status: 'TOKEN_EXPIRED',
        errorMessage: 'Token requires reauthorization',
        lastErrorAt: new Date(),
      },
    });

    this.logger.warn(`Marked connection ${connectionId} as TOKEN_EXPIRED`);
  }

  async markWebhookExpired(connectionId: string): Promise<void> {
    await this.prisma.calendarConnection.update({
      where: { id: connectionId },
      data: {
        webhookChannelId: null,
        webhookExpiresAt: null,
        webhookResourceId: null,
      },
    });

    this.logger.warn(`Cleared webhook for connection ${connectionId}`);
  }

  async triggerFullSync(connectionId: string): Promise<void> {
    const connection = await this.prisma.calendarConnection.findUnique({
      where: { id: connectionId },
      select: { provider: true, userId: true },
    });

    if (!connection) return;

    const queue = connection.provider === 'GOOGLE' ? this.googleQueue : this.microsoftQueue;

    await queue.add('full-sync', {
      connectionId,
      userId: connection.userId,
      provider: connection.provider,
      triggeredBy: 'webhook-missed',
    });

    this.logger.log(`Triggered full sync for ${connectionId} due to missed notifications`);
  }

  async triggerIncrementalSync(connectionId: string, sourceId?: string): Promise<void> {
    const connection = await this.prisma.calendarConnection.findUnique({
      where: { id: connectionId },
      include: { sources: { where: { syncEnabled: true } } },
    });

    if (!connection) return;

    const queue = connection.provider === 'GOOGLE' ? this.googleQueue : this.microsoftQueue;
    const sources = sourceId
      ? connection.sources.filter((s) => s.id === sourceId)
      : connection.sources;

    for (const source of sources) {
      await queue.add('incremental-sync', {
        connectionId,
        userId: connection.userId,
        provider: connection.provider,
        sourceId: source.id,
        syncToken: source.calendarSyncToken,
        triggeredBy: 'webhook',
      });
    }

    this.logger.log(`Triggered incremental sync for ${connectionId} (${sources.length} sources)`);
  }
}
