import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CalendarProvider, EventSyncStatus, ConnectionStatus, SyncDirection } from '@prisma/client';
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
    pageToken?: string,
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
        syncToken: pageToken ? undefined : (syncToken || source.calendarSyncToken || undefined),
        pageToken: pageToken,
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
      } else {
        // Only update syncToken when pagination is complete
        await this.prisma.calendarSource.update({
          where: { id: sourceId },
          data: {
            calendarSyncToken: result.nextSyncToken,
            lastSyncAt: new Date(),
            eventCount: await this.prisma.eventMapping.count({ where: { calendarSourceId: sourceId } }),
          },
        });
      }

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

    // Skip if this is a blocking event we created (avoid infinite loop)
    if (existingMapping?.isBlockingEvent) {
      this.logger.debug(`Skipping blocking event ${event.id}`);
      return;
    }

    if (event.status === 'cancelled') {
      this.logger.log(`Event cancelled/deleted: ${event.id} (${event.title})`);
      if (existingMapping) {
        // Delete all blocking events created from this event
        await this.deleteBlockingEvents(existingMapping.id);

        if (existingMapping.timeBlockId) {
          await this.prisma.timeBlock.delete({
            where: { id: existingMapping.timeBlockId },
          }).catch(() => {});
        }
        await this.prisma.eventMapping.delete({
          where: { id: existingMapping.id },
        });
        this.logger.log(`Deleted event mapping and blocking events for: ${event.title}`);
      }
      return;
    }

    const source = await this.prisma.calendarSource.findUnique({
      where: { id: calendarSourceId },
      select: { privacyMode: true, defaultEventType: true, connectionId: true },
    });

    let title = event.title;
    if (source?.privacyMode === 'BUSY_ONLY') {
      title = 'Busy';
    } else if (source?.privacyMode === 'TITLE_ONLY') {
      title = event.title;
    }

    const day = await this.getOrCreateDay(userId, event.startTime);
    let mappingId: string;

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
      mappingId = existingMapping.id;

      // Update blocking events on other calendars
      await this.updateBlockingEvents(existingMapping.id, event);
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

      const newMapping = await this.prisma.eventMapping.create({
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
      mappingId = newMapping.id;

      // Create blocking events on other calendars
      await this.createBlockingEventsOnOtherCalendars(
        userId,
        calendarSourceId,
        mappingId,
        event,
      );
    }
  }

  /**
   * Create "Busy" blocking events on all other connected calendars
   */
  private async createBlockingEventsOnOtherCalendars(
    userId: string,
    sourceCalendarSourceId: string,
    sourceMappingId: string,
    event: ExternalEvent,
  ): Promise<void> {
    this.logger.log(`Looking for other calendars: userId=${userId}, excludeSourceId=${sourceCalendarSourceId}`);

    // Get all other writable calendar sources for this user
    const otherSources = await this.prisma.calendarSource.findMany({
      where: {
        id: { not: sourceCalendarSourceId },
        syncEnabled: true,
        syncDirection: { in: [SyncDirection.BIDIRECTIONAL, SyncDirection.WRITE_ONLY] },
        connection: {
          userId,
          status: ConnectionStatus.ACTIVE,
          enabled: true,
        },
      },
      include: { connection: true },
    });

    this.logger.log(`Found ${otherSources.length} other calendars: ${otherSources.map(s => s.name).join(', ')}`);
    this.logger.log(`Creating blocking events on ${otherSources.length} other calendars for event: ${event.title}`);

    for (const targetSource of otherSources) {
      try {
        await this.createBlockingEvent(targetSource, sourceMappingId, event);
      } catch (error) {
        this.logger.error(`Failed to create blocking event on ${targetSource.name}:`, error);
      }
    }
  }

  /**
   * Create a single blocking event on a target calendar
   */
  private async createBlockingEvent(
    targetSource: { id: string; externalCalendarId: string; connectionId: string; connection: { provider: CalendarProvider } },
    sourceMappingId: string,
    event: ExternalEvent,
  ): Promise<void> {
    const accessToken = await this.tokenService.getValidToken(targetSource.connectionId);
    const provider = this.providerFactory.getProvider(targetSource.connection.provider);

    // Create "Busy" event on the external calendar
    const blockingTitle = `Busy (${event.title})`;

    const createdEvent = await provider.createEvent(accessToken, targetSource.externalCalendarId, {
      title: blockingTitle,
      description: `Blocked time from another calendar`,
      startTime: event.startTime,
      endTime: event.endTime,
    });

    // Track this as a blocking event
    await this.prisma.eventMapping.create({
      data: {
        calendarSourceId: targetSource.id,
        externalEventId: createdEvent.id,
        externalEtag: createdEvent.etag,
        externalUpdatedAt: createdEvent.updatedAt,
        syncStatus: EventSyncStatus.SYNCED,
        lastKnownTitle: blockingTitle,
        lastKnownStart: event.startTime,
        lastKnownEnd: event.endTime,
        lastSyncAt: new Date(),
        lastSyncDirection: 'outbound',
        isBlockingEvent: true,
        blockedByMappingId: sourceMappingId,
      },
    });

    this.logger.log(`Created blocking event "${blockingTitle}" on calendar ${targetSource.externalCalendarId}`);
  }

  /**
   * Update all blocking events when the source event changes
   */
  private async updateBlockingEvents(sourceMappingId: string, event: ExternalEvent): Promise<void> {
    const blockingMappings = await this.prisma.eventMapping.findMany({
      where: { blockedByMappingId: sourceMappingId },
      include: {
        calendarSource: {
          include: { connection: true },
        },
      },
    });

    this.logger.log(`Updating ${blockingMappings.length} blocking events`);

    for (const blocking of blockingMappings) {
      try {
        const accessToken = await this.tokenService.getValidToken(blocking.calendarSource.connectionId);
        const provider = this.providerFactory.getProvider(blocking.calendarSource.connection.provider);

        const blockingTitle = `Busy (${event.title})`;

        await provider.updateEvent(accessToken, blocking.calendarSource.externalCalendarId, {
          id: blocking.externalEventId,
          title: blockingTitle,
          startTime: event.startTime,
          endTime: event.endTime,
        });

        await this.prisma.eventMapping.update({
          where: { id: blocking.id },
          data: {
            lastKnownTitle: blockingTitle,
            lastKnownStart: event.startTime,
            lastKnownEnd: event.endTime,
            lastSyncAt: new Date(),
          },
        });

        this.logger.log(`Updated blocking event on ${blocking.calendarSource.name}`);
      } catch (error) {
        this.logger.error(`Failed to update blocking event ${blocking.id}:`, error);
      }
    }
  }

  /**
   * Delete all blocking events when the source event is deleted
   */
  private async deleteBlockingEvents(sourceMappingId: string): Promise<void> {
    const blockingMappings = await this.prisma.eventMapping.findMany({
      where: { blockedByMappingId: sourceMappingId },
      include: {
        calendarSource: {
          include: { connection: true },
        },
      },
    });

    this.logger.log(`Deleting ${blockingMappings.length} blocking events`);

    for (const blocking of blockingMappings) {
      try {
        const accessToken = await this.tokenService.getValidToken(blocking.calendarSource.connectionId);
        const provider = this.providerFactory.getProvider(blocking.calendarSource.connection.provider);

        await provider.deleteEvent(accessToken, blocking.calendarSource.externalCalendarId, blocking.externalEventId);
        await this.prisma.eventMapping.delete({ where: { id: blocking.id } });

        this.logger.log(`Deleted blocking event on ${blocking.calendarSource.name}`);
      } catch (error) {
        this.logger.error(`Failed to delete blocking event ${blocking.id}:`, error);
      }
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
