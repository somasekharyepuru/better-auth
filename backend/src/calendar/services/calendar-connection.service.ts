import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CalendarProvider, ConnectionStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarProviderFactory } from '../providers/calendar-provider.factory';
import { CalendarTokenService } from './calendar-token.service';
import { CALENDAR_QUEUES } from '../queue/calendar-queue.constants';

@Injectable()
export class CalendarConnectionService {
  private readonly logger = new Logger(CalendarConnectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: CalendarProviderFactory,
    private readonly tokenService: CalendarTokenService,
    @InjectQueue(CALENDAR_QUEUES.GOOGLE_SYNC) private readonly googleQueue: Queue,
    @InjectQueue(CALENDAR_QUEUES.MICROSOFT_SYNC) private readonly microsoftQueue: Queue,
  ) {}

  async initiateConnection(
    userId: string,
    provider: CalendarProvider,
    redirectUri: string,
  ): Promise<{ authUrl: string; state: string }> {
    const state = randomBytes(16).toString('hex');

    const calendarProvider = this.providerFactory.getProvider(provider);
    const authUrl = calendarProvider.getAuthorizationUrl(state, redirectUri);

    await this.prisma.calendarConnection.create({
      data: {
        userId,
        provider,
        providerAccountId: state,
        status: ConnectionStatus.CONNECTING,
      },
    });

    return { authUrl, state };
  }

  async completeConnection(
    state: string,
    code: string,
    redirectUri: string,
  ): Promise<{ connectionId: string }> {
    const connection = await this.prisma.calendarConnection.findFirst({
      where: { providerAccountId: state, status: ConnectionStatus.CONNECTING },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found or already completed');
    }

    const provider = this.providerFactory.getProvider(connection.provider);
    const tokens = await provider.exchangeCodeForTokens(code, redirectUri);

    const calendars = await provider.listCalendars(tokens.accessToken);
    const primaryCalendar = calendars.find((c) => c.isPrimary) || calendars[0];

    await this.tokenService.storeTokens(
      connection.id,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresAt,
      tokens.scopes,
    );

    await this.prisma.calendarConnection.update({
      where: { id: connection.id },
      data: {
        providerAccountId: primaryCalendar?.id || state,
        providerEmail: primaryCalendar?.name,
        status: ConnectionStatus.ACTIVE,
        webhookSecret: randomBytes(32).toString('hex'),
      },
    });

    for (const calendar of calendars) {
      await this.prisma.calendarSource.create({
        data: {
          connectionId: connection.id,
          externalCalendarId: calendar.id,
          name: calendar.name,
          description: calendar.description,
          color: calendar.color,
          timeZone: calendar.timeZone,
          isPrimary: calendar.isPrimary,
          syncEnabled: calendar.isPrimary,
        },
      });
    }

    this.logger.log(`Connection ${connection.id} completed with ${calendars.length} calendars`);

    await this.setupWebhook(connection.id);
    await this.triggerInitialSync(connection.id);

    return { connectionId: connection.id };
  }

  async completeAppleConnection(
    state: string,
    appleId: string,
    appSpecificPassword: string,
  ): Promise<{ connectionId: string }> {
    const connection = await this.prisma.calendarConnection.findFirst({
      where: { providerAccountId: state, status: ConnectionStatus.CONNECTING, provider: 'APPLE' },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found or already completed');
    }

    const provider = this.providerFactory.getProvider('APPLE');

    await this.tokenService.storeTokens(
      connection.id,
      appSpecificPassword,
      appSpecificPassword,
      undefined,
      ['calendar'],
    );

    const calendars = await provider.listCalendars(appSpecificPassword, { appleId });
    const primaryCalendar = calendars[0];

    await this.prisma.calendarConnection.update({
      where: { id: connection.id },
      data: {
        providerAccountId: appleId,
        providerEmail: appleId,
        status: ConnectionStatus.ACTIVE,
      },
    });

    for (const calendar of calendars) {
      await this.prisma.calendarSource.create({
        data: {
          connectionId: connection.id,
          externalCalendarId: calendar.id,
          name: calendar.name,
          description: calendar.description,
          color: calendar.color,
          timeZone: calendar.timeZone,
          isPrimary: calendar.id === primaryCalendar?.id,
          syncEnabled: calendar.id === primaryCalendar?.id,
        },
      });
    }

    this.logger.log(`Apple connection ${connection.id} completed with ${calendars.length} calendars`);

    return { connectionId: connection.id };
  }

  private async setupWebhook(connectionId: string): Promise<void> {
    const connection = await this.prisma.calendarConnection.findUnique({
      where: { id: connectionId },
      include: { sources: { where: { syncEnabled: true, isPrimary: true }, take: 1 } },
    });

    if (!connection || connection.provider === 'APPLE') {
      return;
    }

    const provider = this.providerFactory.getProvider(connection.provider);
    if (!provider.setupWebhook) {
      return;
    }

    try {
      const accessToken = await this.tokenService.getValidToken(connectionId);
      const webhookBaseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:3002';
      const callbackUrl = `${webhookBaseUrl}/api/webhooks/calendar/${connection.provider.toLowerCase()}/${connectionId}`;

      const primarySource = connection.sources[0];
      if (!primarySource) {
        this.logger.warn(`No primary source found for webhook setup: ${connectionId}`);
        return;
      }

      const channel = await provider.setupWebhook(
        accessToken,
        primarySource.externalCalendarId,
        callbackUrl,
        connection.webhookSecret || randomBytes(32).toString('hex'),
      );

      await this.prisma.calendarConnection.update({
        where: { id: connectionId },
        data: {
          webhookChannelId: channel.channelId,
          webhookResourceId: channel.resourceId,
          webhookExpiresAt: channel.expiration,
          webhookSecret: channel.token,
        },
      });

      this.logger.log(`Webhook setup complete for ${connectionId}, expires: ${channel.expiration}`);
    } catch (error) {
      this.logger.error(`Failed to setup webhook for ${connectionId}:`, error);
    }
  }

  private async triggerInitialSync(connectionId: string): Promise<void> {
    const connection = await this.prisma.calendarConnection.findUnique({
      where: { id: connectionId },
      include: { sources: { where: { syncEnabled: true } } },
    });

    if (!connection) return;

    const queue = connection.provider === 'GOOGLE' ? this.googleQueue : this.microsoftQueue;

    for (const source of connection.sources) {
      await queue.add('initial-sync', {
        connectionId,
        userId: connection.userId,
        provider: connection.provider,
        sourceId: source.id,
      });
    }

    this.logger.log(`Queued initial sync for ${connectionId}`);
  }

  async getConnections(userId: string) {
    return this.prisma.calendarConnection.findMany({
      where: { userId },
      include: {
        sources: true,
        _count: { select: { auditLogs: true, conflicts: { where: { resolved: false } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getConnection(connectionId: string, userId: string) {
    const connection = await this.prisma.calendarConnection.findFirst({
      where: { id: connectionId, userId },
      include: {
        sources: { include: { _count: { select: { eventMappings: true } } } },
        conflicts: { where: { resolved: false }, take: 10 },
        auditLogs: { take: 20, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    return connection;
  }

  async updateConnection(
    connectionId: string,
    userId: string,
    data: { enabled?: boolean; syncIntervalMins?: number },
  ) {
    const connection = await this.prisma.calendarConnection.findFirst({
      where: { id: connectionId, userId },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    return this.prisma.calendarConnection.update({
      where: { id: connectionId },
      data,
    });
  }

  async disconnectConnection(connectionId: string, userId: string): Promise<void> {
    const connection = await this.prisma.calendarConnection.findFirst({
      where: { id: connectionId, userId },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    try {
      const accessToken = await this.tokenService.getValidToken(connectionId);
      const provider = this.providerFactory.getProvider(connection.provider);

      if (connection.webhookChannelId && provider.stopWebhook) {
        await provider.stopWebhook(
          accessToken,
          connection.webhookChannelId,
          connection.webhookResourceId ?? undefined,
        );
      }

      await provider.revokeAccess(accessToken);
    } catch (error) {
      this.logger.warn(`Failed to revoke access for ${connectionId}:`, error);
    }

    await this.prisma.calendarConnection.delete({
      where: { id: connectionId },
    });

    this.logger.log(`Connection ${connectionId} disconnected`);
  }

  async refreshCalendarList(connectionId: string, userId: string) {
    const connection = await this.prisma.calendarConnection.findFirst({
      where: { id: connectionId, userId },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    const accessToken = await this.tokenService.getValidToken(connectionId);
    const provider = this.providerFactory.getProvider(connection.provider);
    const calendars = await provider.listCalendars(accessToken);

    const existingSources = await this.prisma.calendarSource.findMany({
      where: { connectionId },
    });

    const existingIds = new Set(existingSources.map((s) => s.externalCalendarId));
    const newCalendars = calendars.filter((c) => !existingIds.has(c.id));

    for (const calendar of newCalendars) {
      await this.prisma.calendarSource.create({
        data: {
          connectionId,
          externalCalendarId: calendar.id,
          name: calendar.name,
          description: calendar.description,
          color: calendar.color,
          timeZone: calendar.timeZone,
          isPrimary: calendar.isPrimary,
          syncEnabled: false,
        },
      });
    }

    return this.prisma.calendarSource.findMany({
      where: { connectionId },
    });
  }
}
