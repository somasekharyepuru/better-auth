import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CalendarProvider, EventSyncStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarProviderFactory } from '../providers/calendar-provider.factory';
import { CalendarTokenService } from './calendar-token.service';
import { CalendarRateLimiterService } from '../rate-limit/rate-limiter.service';
import { CircuitBreakerService } from '../rate-limit/circuit-breaker.service';
import { CALENDAR_QUEUES } from '../queue/calendar-queue.constants';
import { ExternalEvent, TimeRange } from '../types/calendar.types';

@Injectable()
export class CalendarSyncService {
  private readonly logger = new Logger(CalendarSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: CalendarProviderFactory,
    private readonly tokenService: CalendarTokenService,
    private readonly rateLimiter: CalendarRateLimiterService,
    private readonly circuitBreaker: CircuitBreakerService,
    @InjectQueue(CALENDAR_QUEUES.GOOGLE_SYNC) private readonly googleQueue: Queue,
    @InjectQueue(CALENDAR_QUEUES.MICROSOFT_SYNC) private readonly microsoftQueue: Queue,
    @InjectQueue(CALENDAR_QUEUES.APPLE_SYNC) private readonly appleQueue: Queue,
  ) {}

  async triggerInitialSync(connectionId: string): Promise<void> {
    const connection = await this.prisma.calendarConnection.findUnique({
      where: { id: connectionId },
      include: { sources: { where: { syncEnabled: true } } },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    const queue = this.getQueue(connection.provider);

    await this.prisma.calendarConnection.update({
      where: { id: connectionId },
      data: { status: 'INITIAL_SYNC' },
    });

    await queue.add('initial-sync', {
      connectionId,
      userId: connection.userId,
      provider: connection.provider,
      sourceIds: connection.sources.map((s) => s.id),
    });

    this.logger.log(`Queued initial sync for ${connectionId}`);
  }

  async performSync(
    connectionId: string,
    sourceId: string,
    syncToken?: string,
  ): Promise<{ eventsProcessed: number; newSyncToken?: string }> {
    const source = await this.prisma.calendarSource.findUnique({
      where: { id: sourceId },
      include: { connection: true },
    });

    if (!source) {
      throw new Error('Source not found');
    }

    const { connection } = source;

    if (await this.circuitBreaker.isOpen(connection.provider)) {
      throw new Error(`Circuit breaker open for ${connection.provider}`);
    }

    const { allowed, retryAfter } = await this.rateLimiter.checkLimit(
      connection.provider,
      connection.userId,
    );

    if (!allowed) {
      throw new Error(`Rate limited, retry after ${retryAfter}ms`);
    }

    try {
      const accessToken = await this.tokenService.getValidToken(connectionId);
      const provider = this.providerFactory.getProvider(connection.provider);

      const settings = await this.prisma.userCalendarSettings.findUnique({
        where: { userId: connection.userId },
      });

      const now = new Date();
      const timeRange: TimeRange = {
        start: new Date(now.getTime() - (settings?.syncRangeMonthsPast || 1) * 30 * 24 * 60 * 60 * 1000),
        end: new Date(now.getTime() + (settings?.syncRangeMonthsFuture || 6) * 30 * 24 * 60 * 60 * 1000),
      };

      await this.rateLimiter.recordRequest(connection.provider, connection.userId);

      const result = await provider.getEvents(accessToken, source.externalCalendarId, timeRange, {
        syncToken: syncToken || source.calendarSyncToken || undefined,
        maxResults: 250,
      });

      let eventsProcessed = 0;

      for (const event of result.events) {
        await this.processEvent(source.id, connection.userId, event);
        eventsProcessed++;
      }

      if (result.hasMore && result.nextPageToken) {
        await this.getQueue(connection.provider).add('continue-sync', {
          connectionId,
          sourceId,
          pageToken: result.nextPageToken,
        });
      }

      await this.prisma.calendarSource.update({
        where: { id: sourceId },
        data: {
          calendarSyncToken: result.nextSyncToken,
          lastSyncAt: new Date(),
          eventCount: await this.prisma.eventMapping.count({ where: { calendarSourceId: sourceId } }),
        },
      });

      await this.circuitBreaker.recordSuccess(connection.provider);

      await this.createAuditLog(connectionId, 'sync', 'success', {
        eventsProcessed,
        sourceId,
      });

      return { eventsProcessed, newSyncToken: result.nextSyncToken };
    } catch (error) {
      await this.circuitBreaker.recordFailure(connection.provider, String(error));
      await this.createAuditLog(connectionId, 'sync', 'error', {
        sourceId,
        error: String(error),
      });
      throw error;
    }
  }

  private async processEvent(
    calendarSourceId: string,
    userId: string,
    event: ExternalEvent,
  ): Promise<void> {
    const existingMapping = await this.prisma.eventMapping.findUnique({
      where: {
        calendarSourceId_externalEventId: {
          calendarSourceId,
          externalEventId: event.id,
        },
      },
    });

    if (event.status === 'cancelled') {
      if (existingMapping?.timeBlockId) {
        await this.prisma.timeBlock.delete({
          where: { id: existingMapping.timeBlockId },
        }).catch(() => {});
      }
      if (existingMapping) {
        await this.prisma.eventMapping.delete({
          where: { id: existingMapping.id },
        });
      }
      return;
    }

    const source = await this.prisma.calendarSource.findUnique({
      where: { id: calendarSourceId },
      select: { privacyMode: true, defaultEventType: true },
    });

    let title = event.title;
    if (source?.privacyMode === 'BUSY_ONLY') {
      title = 'Busy';
    } else if (source?.privacyMode === 'TITLE_ONLY') {
      title = event.title;
    }

    const day = await this.getOrCreateDay(userId, event.startTime);

    if (existingMapping?.timeBlockId) {
      await this.prisma.timeBlock.update({
        where: { id: existingMapping.timeBlockId },
        data: {
          title,
          startTime: event.startTime,
          endTime: event.endTime,
          updatedAt: new Date(),
        },
      });

      await this.prisma.eventMapping.update({
        where: { id: existingMapping.id },
        data: {
          externalEtag: event.etag,
          externalUpdatedAt: event.updatedAt,
          lastKnownTitle: event.title,
          lastKnownStart: event.startTime,
          lastKnownEnd: event.endTime,
          syncStatus: EventSyncStatus.SYNCED,
          lastSyncAt: new Date(),
          lastSyncDirection: 'inbound',
        },
      });
    } else {
      const timeBlock = await this.prisma.timeBlock.create({
        data: {
          title,
          startTime: event.startTime,
          endTime: event.endTime,
          type: source?.defaultEventType || 'Meeting',
          dayId: day.id,
          isFromCalendar: true,
          calendarSourceId,
          externalEventId: event.id,
        },
      });

      await this.prisma.eventMapping.create({
        data: {
          calendarSourceId,
          externalEventId: event.id,
          externalEtag: event.etag,
          externalUpdatedAt: event.updatedAt,
          timeBlockId: timeBlock.id,
          syncStatus: EventSyncStatus.SYNCED,
          lastKnownTitle: event.title,
          lastKnownStart: event.startTime,
          lastKnownEnd: event.endTime,
          lastSyncAt: new Date(),
          lastSyncDirection: 'inbound',
        },
      });
    }
  }

  private async getOrCreateDay(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    let day = await this.prisma.day.findFirst({
      where: {
        userId,
        date: startOfDay,
        lifeAreaId: null,
      },
    });

    if (!day) {
      day = await this.prisma.day.create({
        data: {
          userId,
          date: startOfDay,
          lifeAreaId: null,
        },
      });
    }

    return day;
  }

  async performOutboundSync(
    connectionId: string,
    sourceId: string,
    timeBlockId: string,
    action: 'create' | 'update' | 'delete',
  ): Promise<void> {
    const source = await this.prisma.calendarSource.findUnique({
      where: { id: sourceId },
      include: { connection: true },
    });

    if (!source || source.syncDirection === 'READ_ONLY') {
      return;
    }

    const { connection } = source;

    if (await this.circuitBreaker.isOpen(connection.provider)) {
      throw new Error(`Circuit breaker open for ${connection.provider}`);
    }

    const { allowed } = await this.rateLimiter.checkLimit(connection.provider, connection.userId);
    if (!allowed) {
      throw new Error('Rate limited');
    }

    const accessToken = await this.tokenService.getValidToken(connectionId);
    const provider = this.providerFactory.getProvider(connection.provider);

    await this.rateLimiter.recordRequest(connection.provider, connection.userId);

    if (action === 'delete') {
      const mapping = await this.prisma.eventMapping.findFirst({
        where: { timeBlockId },
      });

      if (mapping?.externalEventId) {
        await provider.deleteEvent(accessToken, source.externalCalendarId, mapping.externalEventId);
        await this.prisma.eventMapping.delete({ where: { id: mapping.id } });
      }
      return;
    }

    const timeBlock = await this.prisma.timeBlock.findUnique({
      where: { id: timeBlockId },
    });

    if (!timeBlock) {
      return;
    }

    if (action === 'create') {
      const createdEvent = await provider.createEvent(accessToken, source.externalCalendarId, {
        title: timeBlock.title,
        startTime: timeBlock.startTime,
        endTime: timeBlock.endTime,
      });

      await this.prisma.eventMapping.create({
        data: {
          calendarSourceId: sourceId,
          externalEventId: createdEvent.id,
          externalEtag: createdEvent.etag,
          externalUpdatedAt: createdEvent.updatedAt,
          timeBlockId,
          syncStatus: EventSyncStatus.SYNCED,
          lastKnownTitle: timeBlock.title,
          lastKnownStart: timeBlock.startTime,
          lastKnownEnd: timeBlock.endTime,
          lastSyncAt: new Date(),
          lastSyncDirection: 'outbound',
        },
      });

      await this.prisma.timeBlock.update({
        where: { id: timeBlockId },
        data: {
          calendarSourceId: sourceId,
          externalEventId: createdEvent.id,
        },
      });
    } else if (action === 'update') {
      const mapping = await this.prisma.eventMapping.findFirst({
        where: { timeBlockId },
      });

      if (mapping?.externalEventId) {
        const updatedEvent = await provider.updateEvent(accessToken, source.externalCalendarId, {
          id: mapping.externalEventId,
          title: timeBlock.title,
          startTime: timeBlock.startTime,
          endTime: timeBlock.endTime,
        });

        await this.prisma.eventMapping.update({
          where: { id: mapping.id },
          data: {
            externalEtag: updatedEvent.etag,
            externalUpdatedAt: updatedEvent.updatedAt,
            lastKnownTitle: timeBlock.title,
            lastKnownStart: timeBlock.startTime,
            lastKnownEnd: timeBlock.endTime,
            syncStatus: EventSyncStatus.SYNCED,
            lastSyncAt: new Date(),
            lastSyncDirection: 'outbound',
          },
        });
      }
    }

    await this.circuitBreaker.recordSuccess(connection.provider);
  }

  private getQueue(provider: CalendarProvider): Queue {
    switch (provider) {
      case 'GOOGLE':
        return this.googleQueue;
      case 'MICROSOFT':
        return this.microsoftQueue;
      case 'APPLE':
        return this.appleQueue;
    }
  }

  private async createAuditLog(
    connectionId: string,
    action: string,
    status: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.syncAuditLog.create({
      data: {
        connectionId,
        action,
        status,
        eventsProcessed: metadata.eventsProcessed as number | undefined,
        errorMessage: metadata.error as string | undefined,
        metadata: metadata as object,
      },
    });
  }
}
