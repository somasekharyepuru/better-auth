import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient before importing the controller
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    auditLog: {
      count: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Mock the audit service module
jest.mock('./audit.service', () => ({
  AuditService: jest.fn().mockImplementation(() => ({
    queryLogs: jest.fn().mockResolvedValue([]),
  })),
}));

// Mock better-auth session decorator
jest.mock('@thallesp/nestjs-better-auth', () => ({
  Session: jest.fn(() => (target: any, propertyKey: any, descriptor: any) => descriptor),
  UserSession: jest.fn(),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  startOfDay: jest.fn((date: Date) => new Date(date.setHours(0, 0, 0, 0))),
  subDays: jest.fn((date: Date, days: number) => new Date(date.getTime() - days * 86400000)),
}));

import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

describe('AuditController', () => {
  let controller: AuditController;
  let mockAuditService: any;
  let prismaInstance: any;

  const mockAuditLog = {
    id: 'log-1',
    userId: 'user-1',
    action: 'user.login',
    success: true,
    createdAt: new Date(),
  };

  beforeEach(() => {
    // Get the mocked PrismaClient instance
    const { PrismaClient } = require('@prisma/client');
    prismaInstance = new PrismaClient();

    // Reset all mocks
    prismaInstance.auditLog.count.mockResolvedValue(0);
    prismaInstance.auditLog.findUnique.mockResolvedValue(null);

    // Get the mocked AuditService
    const { AuditService } = require('./audit.service');
    mockAuditService = new AuditService();

    controller = new AuditController(mockAuditService, prismaInstance);
    jest.clearAllMocks();
  });

  const createAdminSession = () => ({
    user: { id: 'admin-1', role: 'admin' },
    session: { id: 'session-1' } as any,
  });

  const createOwnerSession = () => ({
    user: { id: 'owner-1', role: 'owner' },
    session: { id: 'session-1' } as any,
  });

  const createMemberSession = () => ({
    user: { id: 'user-1', role: 'member' },
    session: { id: 'session-1' } as any,
  });

  const createNoRoleSession = () => ({
    user: { id: 'user-1' },
    session: { id: 'session-1' } as any,
  });

  const createUnauthenticatedSession = () => ({} as any);

  describe('checkRole', () => {
    it('should allow access to admin users', async () => {
      const session = createAdminSession() as any;

      // Should not throw
      await expect(controller.getStats(session)).resolves.toBeDefined();
    });

    it('should allow access to owner users', async () => {
      const session = createOwnerSession() as any;

      // Should not throw when checking role
      await expect(controller.getLogs(session)).resolves.toBeDefined();
    });

    it('should throw ForbiddenException for member users', async () => {
      const session = createMemberSession() as any;

      await expect(controller.getStats(session)).rejects.toThrow(
        new ForbiddenException('Requires admin or owner role')
      );
    });

    it('should throw ForbiddenException for users without role', async () => {
      const session = createNoRoleSession() as any;

      await expect(controller.getStats(session)).rejects.toThrow(
        new ForbiddenException('Requires admin or owner role')
      );
    });

    it('should throw ForbiddenException for unauthenticated users', async () => {
      const session = createUnauthenticatedSession() as any;

      await expect(controller.getStats(session)).rejects.toThrow(
        new ForbiddenException('Requires admin or owner role')
      );
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      prismaInstance.auditLog.count
        .mockResolvedValueOnce(100)  // total
        .mockResolvedValueOnce(90)   // success
        .mockResolvedValueOnce(10)   // failed
        .mockResolvedValueOnce(20)   // today
        .mockResolvedValueOnce(50);  // thisWeek
    });

    it('should return audit statistics for admin users', async () => {
      const session = createAdminSession() as any;

      const result = await controller.getStats(session);

      expect(result).toEqual({
        total: 100,
        success: 90,
        failed: 10,
        today: 20,
        thisWeek: 50,
      });
    });
  });

  describe('getLogs', () => {
    it('should query logs with default parameters', async () => {
      const session = createAdminSession() as any;
      mockAuditService.queryLogs.mockResolvedValue([]);

      await controller.getLogs(session);

      expect(mockAuditService.queryLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100,
          offset: 0,
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should query logs with custom limit and offset', async () => {
      const session = createAdminSession() as any;

      await controller.getLogs(session,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, '50', '10');

      expect(mockAuditService.queryLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
          offset: 10,
        })
      );
    });

    it('should cap limit at 1000', async () => {
      const session = createAdminSession() as any;

      await controller.getLogs(session,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, '2000', '0');

      expect(mockAuditService.queryLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 1000,
        })
      );
    });

    it('should parse userIds from comma-separated string', async () => {
      const session = createAdminSession() as any;

      await controller.getLogs(session, undefined, 'user1,user2,user3');

      expect(mockAuditService.queryLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          userIds: ['user1', 'user2', 'user3'],
        })
      );
    });

    it('should parse actions from comma-separated string', async () => {
      const session = createAdminSession() as any;

      await controller.getLogs(session, undefined, undefined, undefined, 'login,logout');

      expect(mockAuditService.queryLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          actions: ['login', 'logout'],
        })
      );
    });

    it('should parse resourceTypes from comma-separated string', async () => {
      const session = createAdminSession() as any;

      await controller.getLogs(session, undefined, undefined, undefined, undefined, undefined, 'user,organization');

      expect(mockAuditService.queryLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceTypes: ['user', 'organization'],
        })
      );
    });

    it('should parse success boolean from string', async () => {
      const session = createAdminSession() as any;

      // success is at position 11 (after 10 query params: userId, userIds, action, actions,
      // resourceType, resourceTypes, resourceId, organizationId, sessionId, success)
      await controller.getLogs(session,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, 'true');

      expect(mockAuditService.queryLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should handle custom sortBy and sortOrder', async () => {
      const session = createAdminSession() as any;

      // sortBy is at position 14, sortOrder at 15
      await controller.getLogs(session,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, 'action', 'asc');

      expect(mockAuditService.queryLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { action: 'asc' },
        })
      );
    });

    it('should default sortOrder to desc when invalid', async () => {
      const session = createAdminSession() as any;

      // sortBy is at position 14, sortOrder at 15
      await controller.getLogs(session,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, 'action', 'invalid');

      expect(mockAuditService.queryLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { action: 'desc' },
        })
      );
    });
  });

  describe('getUserLogs', () => {
    it('should get logs for a specific user', async () => {
      const session = createAdminSession() as any;
      mockAuditService.queryLogs.mockResolvedValue([mockAuditLog]);

      const result = await controller.getUserLogs(session, 'user-1');

      expect(result).toEqual([mockAuditLog]);
      expect(mockAuditService.queryLogs).toHaveBeenCalledWith({
        userId: 'user-1',
        limit: 100,
        offset: 0,
      });
    });
  });

  describe('getOrgLogs', () => {
    it('should get logs for a specific organization', async () => {
      const session = createAdminSession() as any;
      mockAuditService.queryLogs.mockResolvedValue([mockAuditLog]);

      const result = await controller.getOrgLogs(session, 'org-1');

      expect(result).toEqual([mockAuditLog]);
      expect(mockAuditService.queryLogs).toHaveBeenCalledWith({
        organizationId: 'org-1',
        limit: 100,
        offset: 0,
      });
    });
  });

  describe('getActionLogs', () => {
    it('should get logs for a specific action', async () => {
      const session = createAdminSession() as any;
      mockAuditService.queryLogs.mockResolvedValue([mockAuditLog]);

      const result = await controller.getActionLogs(session, 'user.login');

      expect(result).toEqual([mockAuditLog]);
      expect(mockAuditService.queryLogs).toHaveBeenCalledWith({
        action: 'user.login',
        limit: 100,
        offset: 0,
      });
    });
  });

  describe('getLog', () => {
    it('should get a specific log by id', async () => {
      const session = createAdminSession() as any;
      prismaInstance.auditLog.findUnique.mockResolvedValue(mockAuditLog);

      const result = await controller.getLog(session, 'log-1');

      expect(result).toEqual(mockAuditLog);
      expect(prismaInstance.auditLog.findUnique).toHaveBeenCalledWith({
        where: { id: 'log-1' },
      });
    });

    it('should throw NotFoundException when log not found', async () => {
      const session = createAdminSession() as any;
      prismaInstance.auditLog.findUnique.mockResolvedValue(null);

      await expect(controller.getLog(session, 'nonexistent')).rejects.toThrow(
        new NotFoundException('Audit log not found')
      );
    });
  });

  describe('getMyTimeline', () => {
    it('should get timeline for authenticated user', async () => {
      const session = createAdminSession() as any;
      mockAuditService.queryLogs.mockResolvedValue([mockAuditLog]);

      const result = await controller.getMyTimeline(session);

      expect(result).toEqual([mockAuditLog]);
      expect(mockAuditService.queryLogs).toHaveBeenCalledWith({
        userId: 'admin-1',
        action: undefined,
        actionPrefix: undefined,
        search: undefined,
        startDate: undefined,
        endDate: undefined,
        limit: 20,
        offset: 0,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should throw ForbiddenException when user not authenticated', async () => {
      const session = createUnauthenticatedSession() as any;

      await expect(controller.getMyTimeline(session)).rejects.toThrow(
        new ForbiddenException('Not authenticated')
      );
    });

    it('should filter by action when provided', async () => {
      const session = createAdminSession() as any;

      await controller.getMyTimeline(session, 'user.login');

      expect(mockAuditService.queryLogs).toHaveBeenCalledWith({
        userId: 'admin-1',
        action: 'user.login',
        actionPrefix: undefined,
        search: undefined,
        startDate: undefined,
        endDate: undefined,
        limit: 20,
        offset: 0,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by actionPrefix when provided', async () => {
      const session = createAdminSession() as any;

      await controller.getMyTimeline(session, undefined, 'user.2fa');

      expect(mockAuditService.queryLogs).toHaveBeenCalledWith({
        userId: 'admin-1',
        action: undefined,
        actionPrefix: 'user.2fa',
        search: undefined,
        startDate: undefined,
        endDate: undefined,
        limit: 20,
        offset: 0,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should support search parameter', async () => {
      const session = createAdminSession() as any;

      await controller.getMyTimeline(session, undefined, undefined, '192.168');

      expect(mockAuditService.queryLogs).toHaveBeenCalledWith({
        userId: 'admin-1',
        action: undefined,
        actionPrefix: undefined,
        search: '192.168',
        startDate: undefined,
        endDate: undefined,
        limit: 20,
        offset: 0,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should support sortOrder parameter', async () => {
      const session = createAdminSession() as any;

      await controller.getMyTimeline(session, undefined, undefined, undefined, undefined, undefined, 'asc');

      expect(mockAuditService.queryLogs).toHaveBeenCalledWith({
        userId: 'admin-1',
        action: undefined,
        actionPrefix: undefined,
        search: undefined,
        startDate: undefined,
        endDate: undefined,
        limit: 20,
        offset: 0,
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should cap limit at 200', async () => {
      const session = createAdminSession() as any;

      await controller.getMyTimeline(session, undefined, undefined, undefined, undefined, undefined, undefined, '500');

      expect(mockAuditService.queryLogs).toHaveBeenCalledWith({
        userId: 'admin-1',
        action: undefined,
        actionPrefix: undefined,
        search: undefined,
        startDate: undefined,
        endDate: undefined,
        limit: 200,
        offset: 0,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should support date range filtering', async () => {
      const session = createAdminSession() as any;
      const startDate = '2025-01-01T00:00:00.000Z';
      const endDate = '2025-01-31T23:59:59.999Z';

      await controller.getMyTimeline(session, undefined, undefined, undefined, startDate, endDate);

      expect(mockAuditService.queryLogs).toHaveBeenCalledWith({
        userId: 'admin-1',
        action: undefined,
        actionPrefix: undefined,
        search: undefined,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        limit: 20,
        offset: 0,
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
