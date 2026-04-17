import { ForbiddenException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

// Mock the sessions service module before importing the controller
jest.mock('./sessions.service', () => ({
  SessionsService: jest.fn().mockImplementation(() => ({
    getUserSessions: jest.fn().mockResolvedValue([]),
    getSessionById: jest.fn().mockResolvedValue(null),
    revokeSession: jest.fn().mockResolvedValue({ success: true }),
    revokeAllSessions: jest.fn().mockResolvedValue({ count: 0 }),
  })),
}));

// Mock better-auth fromNodeHeaders
jest.mock('better-auth/node', () => ({
  fromNodeHeaders: jest.fn((headers) => headers),
}));

import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

describe('SessionsController', () => {
  let controller: SessionsController;
  let mockSessionsService: jest.Mocked<Partial<SessionsService>>;
  let mockAuditService: jest.Mocked<Pick<AuditService, 'logUserAction'>>;

  const mockSession = {
    id: 'session-1',
    userId: 'user-1',
    token: 'abc123',
    expiresAt: new Date(Date.now() + 86400000),
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
  };

  beforeEach(() => {
    mockSessionsService = {
      getUserSessions: jest.fn().mockResolvedValue([mockSession]),
      getSessionById: jest.fn().mockResolvedValue(mockSession),
      revokeSession: jest.fn().mockResolvedValue({ success: true }),
      revokeAllSessions: jest.fn().mockResolvedValue({ count: 3 }),
    };

    mockAuditService = {
      logUserAction: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Pick<AuditService, 'logUserAction'>>;

    controller = new SessionsController(
      mockSessionsService as SessionsService,
      mockAuditService as unknown as AuditService,
    );

    jest.clearAllMocks();
  });

  const createMockRequest = (overrides: any = {}) => ({
    user: { id: 'user-1' },
    session: { id: 'session-1' },
    headers: {
      'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      'user-agent': 'Mozilla/5.0',
    },
    ...overrides,
  });

  describe('getMySessions', () => {
    it('should return user sessions when authenticated', async () => {
      const req = createMockRequest();

      const result = await controller.getMySessions(req, req);

      expect(result).toEqual([mockSession]);
      expect(mockSessionsService.getUserSessions).toHaveBeenCalledWith('user-1', req.headers);
    });

    it('should throw ForbiddenException when not authenticated', async () => {
      const req = createMockRequest({ user: null });

      await expect(controller.getMySessions(req, req)).rejects.toThrow(
        new ForbiddenException('Not authenticated')
      );
    });

    it('should throw ForbiddenException when user is undefined', async () => {
      const req = createMockRequest({ user: undefined });

      await expect(controller.getMySessions(req, req)).rejects.toThrow(
        new ForbiddenException('Not authenticated')
      );
    });
  });

  describe('getCurrentSession', () => {
    it('should return current session when authenticated', async () => {
      const req = createMockRequest();

      const result = await controller.getCurrentSession(req);

      expect(result).toEqual(mockSession);
      expect(mockSessionsService.getSessionById).toHaveBeenCalledWith('session-1', 'user-1');
    });

    it('should throw ForbiddenException when session is missing', async () => {
      const req = createMockRequest({ session: null });

      await expect(controller.getCurrentSession(req)).rejects.toThrow(
        new ForbiddenException('Not authenticated')
      );
    });

    it('should throw ForbiddenException when session.id is missing', async () => {
      const req = createMockRequest({ session: {} });

      await expect(controller.getCurrentSession(req)).rejects.toThrow(
        new ForbiddenException('Not authenticated')
      );
    });
  });

  describe('revokeSession', () => {
    it('should revoke session for authenticated user', async () => {
      const req = createMockRequest();
      const sessionId = 'session-2';

      const result = await controller.revokeSession(req, req, sessionId);

      expect(result).toEqual({ success: true, message: 'Session revoked' });
      expect(mockSessionsService.revokeSession).toHaveBeenCalledWith('user-1', sessionId, req.headers);
      expect(mockAuditService.logUserAction).toHaveBeenCalledWith(
        'user-1',
        'session.revoked',
        { sessionId },
        'session-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );
    });

    it('should throw ForbiddenException when not authenticated', async () => {
      const req = createMockRequest({ user: null });

      await expect(controller.revokeSession(req, req, 'session-2')).rejects.toThrow(
        new ForbiddenException('Not authenticated')
      );
    });

    it('should throw ForbiddenException when trying to revoke current session', async () => {
      const req = createMockRequest();

      await expect(controller.revokeSession(req, req, 'session-1')).rejects.toThrow(
        new ForbiddenException('Cannot revoke current session. Use logout instead.')
      );
    });

    it('should handle requests without x-forwarded-for header', async () => {
      const req = createMockRequest({
        headers: {
          'x-real-ip': '10.0.0.2',
          'user-agent': 'TestAgent',
        },
      });

      await controller.revokeSession(req, req, 'session-2');

      expect(mockAuditService.logUserAction).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        expect.any(String),
        '10.0.0.2',
        'TestAgent'
      );
    });

    it('should handle requests with minimal headers', async () => {
      const req = createMockRequest({
        headers: {},
      });

      await controller.revokeSession(req, req, 'session-2');

      expect(mockAuditService.logUserAction).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        expect.any(String),
        'unknown',
        'unknown'
      );
    });
  });

  describe('revokeAllSessions', () => {
    it('should revoke all other sessions for authenticated user', async () => {
      const req = createMockRequest();

      const result = await controller.revokeAllSessions(req, req);

      expect(result).toEqual({ success: true, message: 'All sessions revoked' });
      expect(mockSessionsService.revokeAllSessions).toHaveBeenCalledWith('user-1', 'session-1', req.headers);
      expect(mockAuditService.logUserAction).toHaveBeenCalledWith(
        'user-1',
        'session.revoked.all',
        { revokedCount: 3 },
        'session-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );
    });

    it('should throw ForbiddenException when not authenticated', async () => {
      const req = createMockRequest({ user: null });

      await expect(controller.revokeAllSessions(req, req)).rejects.toThrow(
        new ForbiddenException('Not authenticated')
      );
    });

    it('should handle requests without x-forwarded-for header', async () => {
      const req = createMockRequest({
        headers: {
          'x-real-ip': '10.0.0.2',
          'user-agent': 'TestAgent',
        },
      });

      await controller.revokeAllSessions(req, req);

      expect(mockAuditService.logUserAction).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        expect.any(String),
        '10.0.0.2',
        'TestAgent'
      );
    });
  });

  describe('getSession', () => {
    it('should return session by id', async () => {
      const req = createMockRequest({ user: { id: 'user-1' } });
      const result = await controller.getSession('session-1', req);

      expect(result).toEqual(mockSession);
      expect(mockSessionsService.getSessionById).toHaveBeenCalledWith('session-1', 'user-1');
    });

    it('should throw ForbiddenException when not authenticated', async () => {
      const req = createMockRequest({ user: null });

      await expect(controller.getSession('session-1', req)).rejects.toThrow(
        new ForbiddenException('Not authenticated')
      );
    });
  });
});
