import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CalendarConnectionService } from './services/calendar-connection.service';
import { CalendarSyncService } from './services/calendar-sync.service';
import { PrismaService } from '../prisma/prisma.service';
import { CircuitBreakerService } from './rate-limit/circuit-breaker.service';
import { CalendarRateLimiterService } from './rate-limit/rate-limiter.service';
import {
  InitiateConnectionDto,
  CompleteConnectionDto,
  CompleteAppleConnectionDto,
  UpdateConnectionDto,
  UpdateSourceDto,
  UpdateCalendarSettingsDto,
  ResolveConflictDto,
} from './dto/calendar.dto';

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

@Controller('api/calendar')
export class CalendarController {
  constructor(
    private readonly connectionService: CalendarConnectionService,
    private readonly syncService: CalendarSyncService,
    private readonly prisma: PrismaService,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly rateLimiter: CalendarRateLimiterService,
  ) {}

  @Post('connections')
  async initiateConnection(
    @Body() dto: InitiateConnectionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    return this.connectionService.initiateConnection(userId, dto.provider, dto.redirectUri);
  }

  @Post('connections/callback')
  async completeConnection(@Body() dto: CompleteConnectionDto) {
    return this.connectionService.completeConnection(dto.state, dto.code, dto.redirectUri);
  }

  @Post('connections/apple/complete')
  async completeAppleConnection(@Body() dto: CompleteAppleConnectionDto) {
    return this.connectionService.completeAppleConnection(
      dto.state,
      dto.appleId,
      dto.appSpecificPassword,
    );
  }

  @Get('connections')
  async getConnections(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    return this.connectionService.getConnections(userId);
  }

  @Get('connections/:id')
  async getConnection(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    return this.connectionService.getConnection(id, userId);
  }

  @Put('connections/:id')
  async updateConnection(
    @Param('id') id: string,
    @Body() dto: UpdateConnectionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    return this.connectionService.updateConnection(id, userId, dto);
  }

  @Delete('connections/:id')
  async disconnectConnection(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    await this.connectionService.disconnectConnection(id, userId);
    return { success: true };
  }

  @Post('connections/:id/sync')
  async triggerSync(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    await this.syncService.triggerInitialSync(id);
    return { success: true, message: 'Sync queued' };
  }

  @Get('connections/:id/sources')
  async getSources(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    const connection = await this.connectionService.getConnection(id, userId);
    return connection.sources;
  }

  @Post('connections/:id/sources/refresh')
  async refreshSources(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    return this.connectionService.refreshCalendarList(id, userId);
  }

  @Put('sources/:id')
  async updateSource(
    @Param('id') id: string,
    @Body() dto: UpdateSourceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    const source = await this.prisma.calendarSource.findUnique({
      where: { id },
      include: { connection: true },
    });

    if (!source || source.connection.userId !== userId) {
      throw new Error('Source not found');
    }

    return this.prisma.calendarSource.update({
      where: { id },
      data: dto,
    });
  }

  @Get('settings')
  async getSettings(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    let settings = await this.prisma.userCalendarSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.userCalendarSettings.create({
        data: { userId },
      });
    }

    return settings;
  }

  @Put('settings')
  async updateSettings(
    @Body() dto: UpdateCalendarSettingsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    return this.prisma.userCalendarSettings.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }

  @Get('conflicts')
  async getConflicts(
    @Query('resolved') resolved: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    return this.prisma.calendarConflict.findMany({
      where: {
        connection: { userId },
        resolved: resolved === 'true',
      },
      include: { connection: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @Put('conflicts/:id')
  async resolveConflict(
    @Param('id') id: string,
    @Body() dto: ResolveConflictDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    const conflict = await this.prisma.calendarConflict.findUnique({
      where: { id },
      include: { connection: true },
    });

    if (!conflict || conflict.connection.userId !== userId) {
      throw new Error('Conflict not found');
    }

    return this.prisma.calendarConflict.update({
      where: { id },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolution: dto.resolution,
      },
    });
  }

  @Get('status')
  async getSyncStatus(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    const connections = await this.prisma.calendarConnection.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        status: true,
        lastSyncAt: true,
        errorMessage: true,
      },
    });

    const circuitStatus = await this.circuitBreaker.getAllStatus();

    const providerStats = await Promise.all(
      (['GOOGLE', 'MICROSOFT', 'APPLE'] as const).map(async (provider) => ({
        provider,
        stats: await this.rateLimiter.getStats(provider),
      })),
    );

    return {
      connections,
      circuitBreakers: circuitStatus,
      rateLimitStats: Object.fromEntries(providerStats.map((p) => [p.provider, p.stats])),
    };
  }
}
