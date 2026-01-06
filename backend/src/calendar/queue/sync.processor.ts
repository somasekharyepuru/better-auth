import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { CALENDAR_QUEUES } from './calendar-queue.constants';
import { InitialSyncJobData, IncrementalSyncJobData } from '../types/calendar.types';
import { CalendarSyncService } from '../services/calendar-sync.service';
import { PrismaService } from '../../prisma/prisma.service';

@Processor(CALENDAR_QUEUES.GOOGLE_SYNC)
export class GoogleSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(GoogleSyncProcessor.name);

  constructor(
    @Inject(forwardRef(() => CalendarSyncService))
    private readonly syncService: CalendarSyncService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<InitialSyncJobData | IncrementalSyncJobData>): Promise<void> {
    this.logger.log(`Processing Google sync job ${job.id}: ${job.name}`);

    const data = job.data;

    try {
      if ('sourceIds' in data && data.sourceIds) {
        for (const sourceId of data.sourceIds) {
          await this.syncService.performSync(data.connectionId, sourceId);
        }
      } else if ('sourceId' in data) {
        await this.syncService.performSync(data.connectionId, data.sourceId, data.syncToken);
      }

      await this.prisma.calendarConnection.update({
        where: { id: data.connectionId },
        data: { status: 'ACTIVE', lastSyncAt: new Date() },
      });
    } catch (error) {
      this.logger.error(`Google sync failed for ${data.connectionId}:`, error);
      throw error;
    }
  }
}

@Processor(CALENDAR_QUEUES.MICROSOFT_SYNC)
export class MicrosoftSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(MicrosoftSyncProcessor.name);

  constructor(
    @Inject(forwardRef(() => CalendarSyncService))
    private readonly syncService: CalendarSyncService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<InitialSyncJobData | IncrementalSyncJobData>): Promise<void> {
    this.logger.log(`Processing Microsoft sync job ${job.id}: ${job.name}`);

    const data = job.data;

    try {
      if ('sourceIds' in data && data.sourceIds) {
        for (const sourceId of data.sourceIds) {
          await this.syncService.performSync(data.connectionId, sourceId);
        }
      } else if ('sourceId' in data) {
        await this.syncService.performSync(data.connectionId, data.sourceId, data.syncToken);
      }

      await this.prisma.calendarConnection.update({
        where: { id: data.connectionId },
        data: { status: 'ACTIVE', lastSyncAt: new Date() },
      });
    } catch (error) {
      this.logger.error(`Microsoft sync failed for ${data.connectionId}:`, error);
      throw error;
    }
  }
}

@Processor(CALENDAR_QUEUES.APPLE_SYNC)
export class AppleSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(AppleSyncProcessor.name);

  constructor(
    @Inject(forwardRef(() => CalendarSyncService))
    private readonly syncService: CalendarSyncService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<InitialSyncJobData | IncrementalSyncJobData>): Promise<void> {
    this.logger.log(`Processing Apple sync job ${job.id}: ${job.name}`);

    const data = job.data;

    try {
      if ('sourceIds' in data && data.sourceIds) {
        for (const sourceId of data.sourceIds) {
          await this.syncService.performSync(data.connectionId, sourceId);
        }
      } else if ('sourceId' in data) {
        await this.syncService.performSync(data.connectionId, data.sourceId);
      }

      await this.prisma.calendarConnection.update({
        where: { id: data.connectionId },
        data: { status: 'ACTIVE', lastSyncAt: new Date() },
      });
    } catch (error) {
      this.logger.error(`Apple sync failed for ${data.connectionId}:`, error);
      throw error;
    }
  }
}

@Processor(CALENDAR_QUEUES.OUTBOUND_SYNC)
export class OutboundSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(OutboundSyncProcessor.name);

  constructor(
    @Inject(forwardRef(() => CalendarSyncService))
    private readonly syncService: CalendarSyncService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing outbound sync job ${job.id}: ${job.name}`);
    const { connectionId, sourceId, timeBlockId, action } = job.data;

    try {
      await this.syncService.performOutboundSync(connectionId, sourceId, timeBlockId, action);

      await this.prisma.syncAuditLog.create({
        data: {
          connectionId,
          action: `outbound_${action}`,
          status: 'success',
          eventsProcessed: 1,
          metadata: { timeBlockId } as object,
        },
      });
    } catch (error) {
      this.logger.error(`Outbound sync failed: ${error}`);
      throw error;
    }
  }
}

export const SyncProcessors = [
  GoogleSyncProcessor,
  MicrosoftSyncProcessor,
  AppleSyncProcessor,
  OutboundSyncProcessor,
];
