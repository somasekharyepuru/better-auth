import { AuditService } from './audit.service';
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';

// Mock the PrismaClient
jest.mock('@prisma/client');
jest.mock('../common/logger.service', () => ({
  createChildLogger: () => ({
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }),
}));

describe('AuditService', () => {
  let service: AuditService;
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    service = new AuditService();
    (service as any).prisma = prisma;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create service instance', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(EventEmitter);
    });
  });

  describe('logAction', () => {
    it('should log action successfully', async () => {
      const mockLogEntry = {
        id: 'log-1',
        userId: 'user-123',
        action: 'user.login',
        resourceType: 'user',
        resourceId: 'user-123',
        success: true,
        timestamp: new Date(),
      };

      (prisma.auditLog.create as any).mockResolvedValue(mockLogEntry);

      const emitSpy = jest.spyOn(service, 'emit');

      await service.logAction({
        userId: 'user-123',
        action: 'user.login',
        resourceType: 'user',
        resourceId: 'user-123',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          action: 'user.login',
          resourceType: 'user',
          resourceId: 'user-123',
          success: true,
        }),
      });
      expect(emitSpy).toHaveBeenCalledWith('audit:log', mockLogEntry);
    });

    it('should not log when shutting down', async () => {
      (service as any).isShuttingDown = true;

      await service.logAction({
        userId: 'user-123',
        action: 'user.login',
      });

      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database error');
      (prisma.auditLog.create as any).mockRejectedValue(error);

      const emitSpy = jest.spyOn(service, 'emit');

      await service.logAction({
        userId: 'user-123',
        action: 'user.login',
      });

      expect(emitSpy).toHaveBeenCalledWith('audit:error', expect.any(Object));
    });

    it('should log failed action with error message', async () => {
      const mockLogEntry = {
        id: 'log-1',
        userId: 'user-123',
        action: 'user.login',
        success: false,
        errorMessage: 'Invalid credentials',
      };

      (prisma.auditLog.create as any).mockResolvedValue(mockLogEntry);

      await service.logAction({
        userId: 'user-123',
        action: 'user.login',
        success: false,
        errorMessage: 'Invalid credentials',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          success: false,
          errorMessage: 'Invalid credentials',
        }),
      });
    });
  });

  describe('logUserAction', () => {
    it('should log user action with correct resource type', async () => {
      (prisma.auditLog.create as any).mockResolvedValue({});

      await service.logUserAction('user-123', 'user.profile.update', { field: 'name' });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          action: 'user.profile.update',
          resourceType: 'user',
          resourceId: 'user-123',
          details: { field: 'name' },
        }),
      });
    });
  });

  describe('logOrganizationAction', () => {
    it('should log organization action', async () => {
      (prisma.auditLog.create as any).mockResolvedValue({});

      await service.logOrganizationAction('org-123', 'user-123', 'org.member.add', { memberId: 'user-456' });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          action: 'org.member.add',
          resourceType: 'organization',
          resourceId: 'org-123',
          organizationId: 'org-123',
          details: { memberId: 'user-456' },
        }),
      });
    });
  });

  describe('logAdminAction', () => {
    it('should log admin action', async () => {
      (prisma.auditLog.create as any).mockResolvedValue({});

      await service.logAdminAction('admin-123', 'admin.user.delete', { targetUserId: 'user-456' });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'admin-123',
          action: 'admin.user.delete',
          resourceType: 'admin',
          details: { targetUserId: 'user-456' },
        }),
      });
    });
  });

  describe('logFailedAction', () => {
    it('should log failed action', async () => {
      (prisma.auditLog.create as any).mockResolvedValue({});

      await service.logFailedAction('user-123', 'user.login', 'Invalid password');

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          action: 'user.login',
          success: false,
          errorMessage: 'Invalid password',
        }),
      });
    });
  });

  describe('queryLogs', () => {
    const mockLogs = [
      {
        id: 'log-1',
        userId: 'user-1',
        action: 'user.login',
        resourceType: 'user',
        timestamp: new Date('2024-01-01'),
      },
      ];

    it('should query logs with default parameters', async () => {
      (prisma.auditLog.findMany as any).mockResolvedValue(mockLogs);
      (prisma.auditLog.count as any).mockResolvedValue(1);

      const result = await service.queryLogs({});

      expect(result.logs).toEqual(mockLogs);
      expect(result.total).toBe(1);
      expect(result.limit).toBe(100);
      expect(result.offset).toBe(0);
    });

    it('should filter by userId', async () => {
      (prisma.auditLog.findMany as any).mockResolvedValue(mockLogs);
      (prisma.auditLog.count as any).mockResolvedValue(1);

      await service.queryLogs({ userId: 'user-123' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: 'user-123',
        }),
        take: 100,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by multiple userIds', async () => {
      (prisma.auditLog.findMany as any).mockResolvedValue(mockLogs);
      (prisma.auditLog.count as any).mockResolvedValue(1);

      await service.queryLogs({ userIds: ['user-1', 'user-2'] });

      expect(prisma.auditLog.findMany).toHaveBeenCalled();
    });

    it('should filter by action', async () => {
      (prisma.auditLog.findMany as any).mockResolvedValue(mockLogs);
      (prisma.auditLog.count as any).mockResolvedValue(1);

      await service.queryLogs({ action: 'user.login' });

      expect(prisma.auditLog.findMany).toHaveBeenCalled();
    });

    it('should filter by multiple actions', async () => {
      (prisma.auditLog.findMany as any).mockResolvedValue(mockLogs);
      (prisma.auditLog.count as any).mockResolvedValue(1);

      await service.queryLogs({ actions: ['user.login', 'user.logout'] });

      expect(prisma.auditLog.findMany).toHaveBeenCalled();
    });

    it('should filter by resourceType', async () => {
      (prisma.auditLog.findMany as any).mockResolvedValue(mockLogs);
      (prisma.auditLog.count as any).mockResolvedValue(1);

      await service.queryLogs({ resourceType: 'organization' });

      expect(prisma.auditLog.findMany).toHaveBeenCalled();
    });

    it('should filter by success status', async () => {
      (prisma.auditLog.findMany as any).mockResolvedValue(mockLogs);
      (prisma.auditLog.count as any).mockResolvedValue(1);

      await service.queryLogs({ success: false });

      expect(prisma.auditLog.findMany).toHaveBeenCalled();
    });

    it('should filter by date range', async () => {
      (prisma.auditLog.findMany as any).mockResolvedValue(mockLogs);
      (prisma.auditLog.count as any).mockResolvedValue(1);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await service.queryLogs({ startDate, endDate });

      expect(prisma.auditLog.findMany).toHaveBeenCalled();
    });

    it('should support pagination', async () => {
      (prisma.auditLog.findMany as any).mockResolvedValue(mockLogs);
      (prisma.auditLog.count as any).mockResolvedValue(100);

      const result = await service.queryLogs({ limit: 10, offset: 20 });

      expect(result.limit).toBe(10);
      expect(result.offset).toBe(20);
    });

    it('should support custom orderBy', async () => {
      (prisma.auditLog.findMany as any).mockResolvedValue(mockLogs);
      (prisma.auditLog.count as any).mockResolvedValue(1);

      await service.queryLogs({ orderBy: { action: 'asc' } });

      expect(prisma.auditLog.findMany).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect Prisma and set shutting down flag', async () => {
      (prisma.$disconnect as any).mockResolvedValue();

      await service.onModuleDestroy();

      expect((service as any).isShuttingDown).toBe(true);
      expect(prisma.$disconnect).toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    it('should disconnect Prisma and set shutting down flag', async () => {
      (prisma.$disconnect as any).mockResolvedValue();

      await service.shutdown();

      expect((service as any).isShuttingDown).toBe(true);
      expect(prisma.$disconnect).toHaveBeenCalled();
    });
  });
});
