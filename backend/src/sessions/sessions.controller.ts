import { Controller, Get, Delete, Param, Req, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiCookieAuth, ApiParam } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { AuditService } from '../audit/audit.service';
import { fromNodeHeaders } from 'better-auth/node';
import { SessionDto, SuccessResponseDto } from '../common/dto';

type AuthenticatedUserSession = Partial<UserSession> & {
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
  session?: {
    id: string;
  };
};

@ApiTags('Sessions')
@ApiBearerAuth('bearerAuth')
@ApiCookieAuth('cookieAuth')
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly auditService: AuditService,
  ) { }

  @Get('me')
  @ApiOperation({ summary: 'Get my sessions', description: 'Retrieves all active sessions for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved', type: [SessionDto] })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async getMySessions(@Session() session: AuthenticatedUserSession, @Req() req: any): Promise<SessionDto[]> {
    const userId = session?.user?.id;
    if (!userId) {
      throw new ForbiddenException('Not authenticated');
    }

    const headers = fromNodeHeaders(req.headers);
    return this.sessionsService.getUserSessions(userId, headers);
  }

  @Get('me/current')
  @ApiOperation({ summary: 'Get current session', description: 'Retrieves the currently active session' })
  @ApiResponse({ status: 200, description: 'Current session retrieved', type: SessionDto })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async getCurrentSession(@Session() session: AuthenticatedUserSession): Promise<SessionDto> {
    const sessionId = session?.session?.id;
    const userId = session?.user?.id;
    if (!sessionId || !userId) {
      throw new ForbiddenException('Not authenticated');
    }

    return this.sessionsService.getSessionById(sessionId, userId);
  }

  @Delete('me/:id')
  @ApiOperation({ summary: 'Revoke specific session', description: 'Revokes a specific session (cannot revoke current session)' })
  @ApiParam({ name: 'id', description: 'Session ID to revoke', example: 'session_123abc' })
  @ApiResponse({ status: 200, description: 'Session revoked', type: SuccessResponseDto })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Cannot revoke current session' })
  async revokeSession(@Session() session: AuthenticatedUserSession, @Req() req: any, @Param('id') sessionId: string): Promise<SuccessResponseDto> {
    const userId = session?.user?.id;
    const currentSessionId = session?.session?.id;

    if (!userId) {
      throw new ForbiddenException('Not authenticated');
    }

    if (sessionId === currentSessionId) {
      throw new ForbiddenException('Cannot revoke current session. Use logout instead.');
    }

    const headers = fromNodeHeaders(req.headers);
    await this.sessionsService.revokeSession(userId, sessionId, headers);

    const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers?.['x-real-ip'] || 'unknown';
    const userAgent = req.headers?.['user-agent'] || 'unknown';

    await this.auditService.logUserAction(
      userId,
      'session.revoked',
      { sessionId },
      currentSessionId,
      ipAddress,
      userAgent,
    );

    return { success: true, message: 'Session revoked' };
  }

  @Delete('me')
  @ApiOperation({ summary: 'Revoke all other sessions', description: 'Revokes all sessions except the current one' })
  @ApiResponse({ status: 200, description: 'All other sessions revoked', type: SuccessResponseDto })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async revokeAllSessions(@Session() session: AuthenticatedUserSession, @Req() req: any): Promise<SuccessResponseDto> {
    const userId = session?.user?.id;
    const currentSessionId = session?.session?.id;

    if (!userId) {
      throw new ForbiddenException('Not authenticated');
    }

    const headers = fromNodeHeaders(req.headers);
    const result = await this.sessionsService.revokeAllSessions(userId, currentSessionId, headers);

    const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers?.['x-real-ip'] || 'unknown';
    const userAgent = req.headers?.['user-agent'] || 'unknown';

    await this.auditService.logUserAction(
      userId,
      'session.revoked.all',
      { revokedCount: result.count },
      currentSessionId,
      ipAddress,
      userAgent,
    );

    return { success: true, message: 'All sessions revoked' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session by ID', description: 'Retrieves a specific session by ID' })
  @ApiParam({ name: 'id', description: 'Session ID', example: 'session_123abc' })
  @ApiResponse({ status: 200, description: 'Session retrieved', type: SessionDto })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getSession(@Param('id') sessionId: string, @Session() session: AuthenticatedUserSession): Promise<SessionDto> {
    const userId = session?.user?.id;
    if (!userId) {
      throw new ForbiddenException('Not authenticated');
    }
    return this.sessionsService.getSessionById(sessionId, userId);
  }
}
