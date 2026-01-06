import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { CALENDAR_QUEUES } from '../queue/calendar-queue.constants';

@Injectable()
export class ScheduledJobsService {
  private readonly logger = new Logger(ScheduledJobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(CALENDAR_QUEUES.TOKEN_REFRESH) private tokenQueue: Queue,
    @InjectQueue(CALENDAR_QUEUES.APPLE_SYNC) private appleQueue: Queue,
    @InjectQueue(CALENDAR_QUEUES.GOOGLE_SYNC) private googleQueue: Queue,
    @InjectQueue(CALENDAR_QUEUES.MICROSOFT_SYNC) private microsoftQueue: Queue,
  ) {}

  @Cron('*/15 * * * *')
  async checkExpiringTokens() {
    this.logger.log('Checking for expiring tokens');

    const expiringTokens = await this.prisma.calendarToken.findMany({
      where: {
        expiresAt: {
          lte: new Date(Date.now() + 15 * 60 * 1000),
          gte: new Date(),
        },
      },
      include: { connection: true },
    });

    for (const token of expiringTokens) {
      await this.tokenQueue.add('proactive-refresh', {
        connectionId: token.connectionId,
        provider: token.connection.provider,
        expiresAt: token.expiresAt,
        isProactive: true,
      });
    }

    if (expiringTokens.length > 0) {
      this.logger.log(`Queued ${expiringTokens.length} token refresh jobs`);
    }
  }

  @Cron('0 * * * *')
  async checkExpiringWebhooks() {
    this.logger.log('Checking for expiring webhooks');

    const expiringConnections = await this.prisma.calendarConnection.findMany({
      where: {
        status: 'ACTIVE',
        webhookExpiresAt: {
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        provider: { in: ['GOOGLE', 'MICROSOFT'] },
      },
    });

    for (const connection of expiringConnections) {
      const queue = connection.provider === 'GOOGLE' ? this.googleQueue : this.microsoftQueue;
      await queue.add('renew-webhook', {
        connectionId: connection.id,
        provider: connection.provider,
      });
    }

    if (expiringConnections.length > 0) {
      this.logger.log(`Queued ${expiringConnections.length} webhook renewal jobs`);
    }
  }

  @Cron('*/10 * * * *')
  async pollAppleCalendars() {
    this.logger.log('Polling Apple calendars');

    const appleConnections = await this.prisma.calendarConnection.findMany({
      where: {
        provider: 'APPLE',
        status: 'ACTIVE',
        enabled: true,
      },
      include: {
        sources: { where: { syncEnabled: true } },
      },
    });

    let jobCount = 0;
    for (const connection of appleConnections) {
      for (const source of connection.sources) {
        await this.appleQueue.add('poll-sync', {
          connectionId: connection.id,
          userId: connection.userId,
          provider: 'APPLE',
          sourceId: source.id,
          triggeredBy: 'poll',
        });
        jobCount++;
      }
    }

    if (jobCount > 0) {
      this.logger.log(`Queued ${jobCount} Apple poll jobs`);
    }
  }

  @Cron('0 3 * * *')
  async cleanupStaleData() {
    this.logger.log('Running daily cleanup');

    const deletedLogs = await this.prisma.syncAuditLog.deleteMany({
      where: {
        createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const deletedConflicts = await this.prisma.calendarConflict.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        resolved: false,
      },
    });

    this.logger.log(`Cleaned up ${deletedLogs.count} logs, ${deletedConflicts.count} conflicts`);
  }

  @Cron('*/30 * * * *')
  async syncActiveConnections() {
    this.logger.log('Running scheduled sync for active connections');

    const connections = await this.prisma.calendarConnection.findMany({
      where: {
        status: 'ACTIVE',
        enabled: true,
        provider: { in: ['GOOGLE', 'MICROSOFT'] },
      },
      include: {
        sources: { where: { syncEnabled: true } },
      },
    });

    for (const connection of connections) {
      const lastSync = connection.lastSyncAt;
      const syncInterval = connection.syncIntervalMins * 60 * 1000;

      if (!lastSync || Date.now() - lastSync.getTime() > syncInterval) {
        const queue = connection.provider === 'GOOGLE' ? this.googleQueue : this.microsoftQueue;

        for (const source of connection.sources) {
          await queue.add('scheduled-sync', {
            connectionId: connection.id,
            userId: connection.userId,
            provider: connection.provider,
            sourceId: source.id,
            syncToken: source.calendarSyncToken,
            triggeredBy: 'poll',
          });
        }
      }
    }
  }
}
