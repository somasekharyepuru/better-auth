// Mock PrismaService before importing
jest.mock('../common/prisma.service', () => {
  const mockSession = {
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  };
  return {
    PrismaService: jest.fn().mockImplementation(() => ({
      session: mockSession,
    })),
  };
});

// Mock Better Auth
jest.mock('../auth/auth.config', () => ({
  auth: {
    api: {
      listSessions: jest.fn(),
      revokeSession: jest.fn(),
      revokeOtherSessions: jest.fn(),
      revokeSessions: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock('../common/logger.service', () => ({
  createChildLogger: () => ({
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }),
}));

import { SessionsService } from './sessions.service';
import { auth } from '../auth/auth.config';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('SessionsService', () => {
  let service: SessionsService;
  let prismaService: any;
  let mockAuth: any;

  const mockSession = {
    id: 'session-1',
    token: 'abcdef1234567890',
    userId: 'user-1',
    expiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0',
    device: null,
  };

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    image: null,
  };

  beforeEach(() => {
    const { PrismaService } = require('../common/prisma.service');
    prismaService = new PrismaService();
    mockAuth = require('../auth/auth.config').auth;

    service = new SessionsService(prismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserSessions', () => {
    it('should return empty array when no sessions found', async () => {
      mockAuth.api.listSessions.mockResolvedValue([]);

      const result = await service.getUserSessions('user-1', new Headers());

      expect(result).toEqual([]);
      expect(mockAuth.api.listSessions).toHaveBeenCalledWith({
        headers: expect.any(Headers),
      });
    });

    it('should return sessions with device info', async () => {
      mockAuth.api.listSessions.mockResolvedValue([mockSession]);

      const result = await service.getUserSessions('user-1', new Headers());

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'session-1',
        token: 'abcdef12...',
        expiresAt: expect.any(Date),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0',
        device: 'Google Chrome',
        isCurrent: false,
      });
    });

    it('should handle errors gracefully and return empty array', async () => {
      mockAuth.api.listSessions.mockRejectedValue(new Error('Auth error'));

      const result = await service.getUserSessions('user-1', new Headers());

      expect(result).toEqual([]);
    });

    it('should mask token with first 8 chars', async () => {
      mockAuth.api.listSessions.mockResolvedValue([mockSession]);

      const result = await service.getUserSessions('user-1', new Headers());

      expect(result[0].token).toBe('abcdef12...');
    });

    it('should use existing device name if available', async () => {
      const sessionWithDevice = { ...mockSession, device: 'My Custom Device' };
      mockAuth.api.listSessions.mockResolvedValue([sessionWithDevice]);

      const result = await service.getUserSessions('user-1', new Headers());

      expect(result[0].device).toBe('My Custom Device');
    });

    it('should handle null ipAddress and userAgent', async () => {
      const sessionWithNulls = {
        ...mockSession,
        ipAddress: null,
        userAgent: null,
      };
      mockAuth.api.listSessions.mockResolvedValue([sessionWithNulls]);

      const result = await service.getUserSessions('user-1', new Headers());

      expect(result[0].ipAddress).toBeNull();
      expect(result[0].userAgent).toBeNull();
      expect(result[0].device).toBe('Unknown Device');
    });

    it('should handle missing token', async () => {
      const sessionNoToken = { ...mockSession, token: null };
      mockAuth.api.listSessions.mockResolvedValue([sessionNoToken]);

      const result = await service.getUserSessions('user-1', new Headers());

      expect(result[0].token).toBe('***');
    });
  });

  describe('getSessionById', () => {
    it('should return session with user info', async () => {
      prismaService.session.findUnique.mockResolvedValue({
        ...mockSession,
        user: mockUser,
      });

      const result = await service.getSessionById('session-1', 'user-1');

      expect(result).toMatchObject({
        id: 'session-1',
        token: 'abcdef12...',
        expiresAt: mockSession.expiresAt,
        user: mockUser,
      });
      expect(prismaService.session.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-1' },
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
    });

    it('should throw NotFoundException when session not found', async () => {
      prismaService.session.findUnique.mockResolvedValue(null);

      await expect(service.getSessionById('nonexistent', 'user-1')).rejects.toThrow(
        new NotFoundException('Session not found')
      );
    });

    it('should parse device name from user agent', async () => {
      prismaService.session.findUnique.mockResolvedValue({
        ...mockSession,
        device: null,
        user: mockUser,
      });

      const result = await service.getSessionById('session-1', 'user-1');

      expect(result.device).toBe('Google Chrome');
    });
  });

  describe('revokeSession', () => {
    it('should revoke session successfully', async () => {
      prismaService.session.findUnique.mockResolvedValue({
        id: 'session-2',
        userId: 'user-1',
        token: 'token123',
      });
      mockAuth.api.revokeSession.mockResolvedValue({});

      const result = await service.revokeSession('user-1', 'session-2', new Headers());

      expect(result).toEqual({ id: 'session-2' });
      expect(mockAuth.api.revokeSession).toHaveBeenCalledWith({
        body: { token: 'token123' },
        headers: expect.any(Headers),
      });
    });

    it('should throw NotFoundException when session not found', async () => {
      prismaService.session.findUnique.mockResolvedValue(null);

      await expect(service.revokeSession('user-1', 'nonexistent', new Headers())).rejects.toThrow(
        new NotFoundException('Session not found')
      );
    });

    it('should throw ForbiddenException when user does not own session', async () => {
      prismaService.session.findUnique.mockResolvedValue({
        id: 'session-1',
        userId: 'other-user',
        token: 'token123',
      });

      await expect(service.revokeSession('user-1', 'session-1', new Headers())).rejects.toThrow(
        new ForbiddenException('You can only revoke your own sessions')
      );
    });

    it('should handle Better Auth API errors', async () => {
      prismaService.session.findUnique.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        token: 'token123',
      });
      mockAuth.api.revokeSession.mockRejectedValue(new Error('Revocation failed'));

      await expect(service.revokeSession('user-1', 'session-1', new Headers())).rejects.toThrow(
        'Revocation failed'
      );
    });
  });

  describe('revokeAllSessions', () => {
    it('should revoke all other sessions when excludeSessionId provided', async () => {
      mockAuth.api.revokeOtherSessions.mockResolvedValue({});

      const result = await service.revokeAllSessions('user-1', 'current-session', new Headers());

      expect(result).toEqual({ count: 1 });
      expect(mockAuth.api.revokeOtherSessions).toHaveBeenCalledWith({
        headers: expect.any(Headers),
      });
    });

    it('should revoke all sessions when excludeSessionId not provided', async () => {
      mockAuth.api.revokeSessions.mockResolvedValue({});

      const result = await service.revokeAllSessions('user-1', undefined, new Headers());

      expect(result).toEqual({ count: 1 });
      expect(mockAuth.api.revokeSessions).toHaveBeenCalledWith({
        headers: expect.any(Headers),
      });
    });

    it('should throw ForbiddenException when headers not provided', async () => {
      await expect(service.revokeAllSessions('user-1', 'session-1')).rejects.toThrow(
        new ForbiddenException('Headers required for authentication')
      );
    });

    it('should handle Better Auth API errors', async () => {
      mockAuth.api.revokeOtherSessions.mockRejectedValue(new Error('Revocation failed'));

      await expect(
        service.revokeAllSessions('user-1', 'current-session', new Headers())
      ).rejects.toThrow('Revocation failed');
    });
  });

  describe('updateSessionDevice', () => {
    it('should update session device name', async () => {
      prismaService.session.update.mockResolvedValue(mockSession);

      await service.updateSessionDevice('session-1', 'My iPhone');

      expect(prismaService.session.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: { device: 'My iPhone' },
      });
    });
  });

  describe('parseDeviceName (private method tested via other methods)', () => {
    it('should detect iOS devices', async () => {
      prismaService.session.findUnique.mockResolvedValue({
        ...mockSession,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)',
        device: null,
        user: mockUser,
      });

      const result = await service.getSessionById('session-1', 'user-1');
      expect(result.device).toBe('iOS Device');
    });

    it('should detect Android devices', async () => {
      prismaService.session.findUnique.mockResolvedValue({
        ...mockSession,
        userAgent: 'Mozilla/5.0 (Linux; Android 13)',
        device: null,
        user: mockUser,
      });

      const result = await service.getSessionById('session-1', 'user-1');
      expect(result.device).toBe('Android Device');
    });

    it('should detect Chrome browser', async () => {
      prismaService.session.findUnique.mockResolvedValue({
        ...mockSession,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0',
        device: null,
        user: mockUser,
      });

      const result = await service.getSessionById('session-1', 'user-1');
      expect(result.device).toBe('Google Chrome');
    });

    it('should detect Edge browser', async () => {
      prismaService.session.findUnique.mockResolvedValue({
        ...mockSession,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0) Edg/120.0.0.0',
        device: null,
        user: mockUser,
      });

      const result = await service.getSessionById('session-1', 'user-1');
      expect(result.device).toBe('Microsoft Edge');
    });

    it('should detect Safari browser', async () => {
      prismaService.session.findUnique.mockResolvedValue({
        ...mockSession,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/605.1.15',
        device: null,
        user: mockUser,
      });

      const result = await service.getSessionById('session-1', 'user-1');
      expect(result.device).toBe('Safari');
    });

    it('should detect Firefox browser', async () => {
      prismaService.session.findUnique.mockResolvedValue({
        ...mockSession,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; rv:121.0) Gecko/20100101 Firefox/121.0',
        device: null,
        user: mockUser,
      });

      const result = await service.getSessionById('session-1', 'user-1');
      expect(result.device).toBe('Firefox');
    });

    it('should detect bot/crawler', async () => {
      prismaService.session.findUnique.mockResolvedValue({
        ...mockSession,
        userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)',
        device: null,
        user: mockUser,
      });

      const result = await service.getSessionById('session-1', 'user-1');
      expect(result.device).toBe('Bot/Crawler');
    });

    it('should return Unknown Device for null user agent', async () => {
      prismaService.session.findUnique.mockResolvedValue({
        ...mockSession,
        userAgent: null,
        device: null,
        user: mockUser,
      });

      const result = await service.getSessionById('session-1', 'user-1');
      expect(result.device).toBe('Unknown Device');
    });

    it('should return Desktop Browser as fallback', async () => {
      prismaService.session.findUnique.mockResolvedValue({
        ...mockSession,
        userAgent: 'SomeCustomBrowser/1.0',
        device: null,
        user: mockUser,
      });

      const result = await service.getSessionById('session-1', 'user-1');
      expect(result.device).toBe('Desktop Browser');
    });
  });
});
