import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { auth } from '../auth/auth.config';
import { createChildLogger } from '../common/logger.service';

export interface SessionWithDevice {
  id: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  device: string | null;
  isCurrent: boolean;
}

@Injectable()
export class SessionsService {
  private logger = createChildLogger('sessions');

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user sessions - Uses Better Auth listSessions
   * Note: Better Auth's listSessions works with the current user's session cookies
   * For user-specific session listing, we use the headers to pass auth context
   */
  async getUserSessions(userId: string, headers: Headers): Promise<SessionWithDevice[]> {
    try {
      const result = await auth.api.listSessions({
        headers,
      });

      if (!result?.length) {
        return [];
      }

      return result.map((session: any) => ({
        id: session.id,
        token: session.token ? session.token.substring(0, 8) + '...' : '***',
        expiresAt: new Date(session.expiresAt),
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        ipAddress: session.ipAddress || null,
        userAgent: session.userAgent || null,
        device: session.device || this.parseDeviceName(session.userAgent),
        isCurrent: false,
      }));
    } catch (error: any) {
      this.logger.error('Failed to list sessions via Better Auth', { error, userId });
      return [];
    }
  }

  /**
   * Get session by ID - Keep Prisma for admin detail view
   * Verifies the requesting user owns this session
   */
  async getSessionById(sessionId: string, requestingUserId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== requestingUserId) {
      throw new ForbiddenException('You can only view your own sessions');
    }

    return {
      id: session.id,
      token: session.token.substring(0, 8) + '...',
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      device: session.device || this.parseDeviceName(session.userAgent),
      user: session.user,
    };
  }

  /**
   * Revoke a specific session - Uses Better Auth revokeSession
   */
  async revokeSession(userId: string, sessionId: string, headers: Headers): Promise<{ id: string }> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true, token: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You can only revoke your own sessions');
    }

    try {
      await auth.api.revokeSession({
        body: { token: session.token },
        headers,
      });

      this.logger.info('Session revoked via Better Auth', { sessionId, userId });
      return { id: sessionId };
    } catch (error: any) {
      this.logger.error('Failed to revoke session via Better Auth', { error, sessionId });
      throw new Error(error.message || 'Failed to revoke session');
    }
  }

  /**
   * Revoke all sessions except current - Uses Better Auth revokeOtherSessions
   */
  async revokeAllOtherSessions(
    userId: string,
    currentSessionId: string | undefined,
    headers: Headers,
  ): Promise<{ count: number }> {
    const revokeCount = await this.prisma.session.count({
      where: {
        userId,
        ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
      },
    });

    try {
      await auth.api.revokeOtherSessions({ headers });
      this.logger.info('Other sessions revoked via Better Auth', { userId, currentSessionId, revokeCount });
      return { count: revokeCount };
    } catch (error: any) {
      this.logger.error('Failed to revoke other sessions via Better Auth', { error, userId, currentSessionId });
      throw new Error(error.message || 'Failed to revoke other sessions');
    }
  }

  /**
   * Revoke all sessions (including current) - Uses Better Auth revokeSessions
   */
  async revokeAllSessions(userId: string, headers: Headers): Promise<{ count: number }> {
    const revokeCount = await this.prisma.session.count({
      where: { userId },
    });

    try {
      await auth.api.revokeSessions({ headers });
      this.logger.info('All sessions revoked via Better Auth', { userId, revokeCount });
      return { count: revokeCount };
    } catch (error: any) {
      this.logger.error('Failed to revoke all sessions via Better Auth', { error, userId });
      throw new Error(error.message || 'Failed to revoke all sessions');
    }
  }

  /**
   * Update session device name - Keep Prisma (not in Better Auth)
   */
  async updateSessionDevice(
    sessionId: string,
    deviceName: string
  ): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { device: deviceName },
    });
  }

  private parseDeviceName(userAgent: string | null): string {
    if (!userAgent) {
      return 'Unknown Device';
    }

    const ua = userAgent.toLowerCase();

    if (ua.includes('iphone') || ua.includes('ipad')) {
      return 'iOS Device';
    }
    if (ua.includes('android')) {
      return 'Android Device';
    }
    if (ua.includes('mobile')) {
      return 'Mobile Device';
    }

    if (ua.includes('edg/')) {
      return 'Microsoft Edge';
    }
    if (ua.includes('chrome/') && !ua.includes('edg/')) {
      return 'Google Chrome';
    }
    if (ua.includes('safari/') && !ua.includes('chrome/')) {
      return 'Safari';
    }
    if (ua.includes('firefox/')) {
      return 'Firefox';
    }

    if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
      return 'Bot/Crawler';
    }

    return 'Desktop Browser';
  }
}
