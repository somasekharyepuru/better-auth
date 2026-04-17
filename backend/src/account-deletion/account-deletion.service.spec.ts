import { AccountDeletionService } from './account-deletion.service';
import { PrismaService } from '../common/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Mock email queue service
jest.mock('../email-queue/email-queue.service', () => ({
  emailQueueService: {
    addEmailJob: jest.fn().mockResolvedValue({ id: 'email-job-1' }),
  },
}));

describe('AccountDeletionService', () => {
  let service: AccountDeletionService;
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    service = new AccountDeletionService(prisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDeletionRequest', () => {
    const mockUserId = 'user-123';

    it('should create deletion request successfully', async () => {
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        name: 'Test User',
      };

      const mockRequest = {
        id: 'request-1',
        userId: mockUserId,
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        requestedAt: new Date(),
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.deletionRequest.findFirst as any).mockResolvedValue(null);
      (prisma.deletionRequest.create as any).mockResolvedValue(mockRequest);

      const result = await service.createDeletionRequest(mockUserId);

      expect(result).toHaveProperty('id', 'request-1');
      expect(result).toHaveProperty('confirmationToken');
      expect(result.confirmationToken).toMatch(/^[a-f0-9]{64}$/);
      expect(prisma.deletionRequest.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          token: expect.any(String),
          expiresAt: expect.any(Date),
          status: 'pending',
        },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(service.createDeletionRequest('user-123')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when active request exists', async () => {
      const mockUser = { id: mockUserId, email: 'test@example.com' };
      const existingRequest = { id: 'existing-1', status: 'pending' };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.deletionRequest.findFirst as any).mockResolvedValue(existingRequest);

      await expect(service.createDeletionRequest(mockUserId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmDeletionRequest', () => {
    const mockUserId = 'user-123';

    it('should confirm deletion request successfully', async () => {
      const mockRequest = {
        id: 'request-1',
        userId: mockUserId,
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        requestedAt: new Date(),
      };

      (prisma.deletionRequest.findFirst as any).mockResolvedValue(mockRequest);
      (prisma.deletionRequest.update as any).mockResolvedValue({
        ...mockRequest,
        status: 'confirmed',
        confirmedAt: new Date(),
      });

      const result = await service.confirmDeletionRequest('valid-token', mockUserId);

      expect(result.confirmed).toBe(true);
      expect(result.message).toContain('Account deletion confirmed');
    });

    it('should throw NotFoundException when no pending request exists', async () => {
      (prisma.deletionRequest.findFirst as any).mockResolvedValue(null);

      await expect(service.confirmDeletionRequest('token', mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('should mark expired request and throw BadRequestException', async () => {
      const mockRequest = {
        id: 'request-1',
        userId: mockUserId,
        status: 'pending',
        expiresAt: new Date(Date.now() - 1000),
        requestedAt: new Date(),
      };

      (prisma.deletionRequest.findFirst as any).mockResolvedValue(mockRequest);
      (prisma.deletionRequest.update as any).mockResolvedValue({
        ...mockRequest,
        status: 'expired',
      });

      await expect(service.confirmDeletionRequest('token', mockUserId)).rejects.toThrow(BadRequestException);
      expect(prisma.deletionRequest.update).toHaveBeenCalledWith({
        where: { id: 'request-1' },
        data: { status: 'expired' },
      });
    });
  });

  describe('cancelDeletionRequest', () => {
    const mockUserId = 'user-123';

    it('should cancel deletion request successfully', async () => {
      const mockRequest = {
        id: 'request-1',
        userId: mockUserId,
        status: 'pending',
      };

      (prisma.deletionRequest.findFirst as any).mockResolvedValue(mockRequest);
      (prisma.deletionRequest.update as any).mockResolvedValue({
        ...mockRequest,
        status: 'cancelled',
      });

      const result = await service.cancelDeletionRequest(mockUserId);

      expect(result.message).toBe('Deletion request cancelled');
      expect(prisma.deletionRequest.update).toHaveBeenCalledWith({
        where: { id: 'request-1' },
        data: { status: 'cancelled' },
      });
    });

    it('should throw NotFoundException when no active request exists', async () => {
      (prisma.deletionRequest.findFirst as any).mockResolvedValue(null);

      await expect(service.cancelDeletionRequest(mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDeletionStatus', () => {
    it('should return hasActiveRequest false when no request exists', async () => {
      (prisma.deletionRequest.findFirst as any).mockResolvedValue(null);

      const result = await service.getDeletionStatus('user-123');

      expect(result).toEqual({ hasActiveRequest: false });
    });

    it('should return active request details', async () => {
      const mockRequest = {
        id: 'request-1',
        status: 'confirmed',
        requestedAt: new Date('2024-01-01'),
        confirmedAt: new Date('2024-01-02'),
        expiresAt: new Date('2024-02-01'),
      };

      (prisma.deletionRequest.findFirst as any).mockResolvedValue(mockRequest);

      const result = await service.getDeletionStatus('user-123');

      expect(result.hasActiveRequest).toBe(true);
      expect(result.status).toBe('confirmed');
      expect(result.canCancel).toBe(true);
    });

    it('should return canCancel false for completed requests', async () => {
      const mockRequest = {
        id: 'request-1',
        status: 'deleted',
        requestedAt: new Date(),
      };

      (prisma.deletionRequest.findFirst as any).mockResolvedValue(mockRequest);

      const result = await service.getDeletionStatus('user-123');

      expect(result.canCancel).toBe(false);
    });
  });

  describe('executeDeletion', () => {
    it('should delete user and update audit logs', async () => {
      const mockRequest = {
        id: 'request-1',
        userId: 'user-123',
        status: 'confirmed',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        user: { id: 'user-123', email: 'test@example.com' },
      };

      const mockAuditLogs = [
        { id: 'audit-1', userId: 'user-123', details: null },
        { id: 'audit-2', userId: 'user-123', details: { action: 'login' } },
      ];

      (prisma.deletionRequest.findFirst as any).mockResolvedValue(mockRequest);
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = mockDeep<PrismaClient>();
        (tx.auditLog.findMany as any).mockResolvedValue(mockAuditLogs);
        (tx.user.delete as any).mockResolvedValue({ count: 1 });
        (tx.auditLog.update as any).mockResolvedValue({});
        await callback(tx);
      });
      (prisma.deletionRequest.update as any).mockResolvedValue({
        status: 'deleted',
        deletedAt: new Date(),
      });

      const result = await service.executeDeletion('token');

      expect(result.deleted).toBe(true);
      expect(result.userId).toBe('user-123');
    });

    it('should throw NotFoundException when no confirmed request found', async () => {
      (prisma.deletionRequest.findFirst as any).mockResolvedValue(null);

      await expect(service.executeDeletion('token')).rejects.toThrow(NotFoundException);
    });

    it('should mark expired and throw BadRequestException', async () => {
      const mockRequest = {
        id: 'request-1',
        userId: 'user-123',
        status: 'confirmed',
        expiresAt: new Date(Date.now() - 1000),
        user: { id: 'user-123', email: 'test@example.com' },
      };

      (prisma.deletionRequest.findFirst as any).mockResolvedValue(mockRequest);
      (prisma.deletionRequest.update as any).mockResolvedValue({
        ...mockRequest,
        status: 'expired',
      });

      await expect(service.executeDeletion('token')).rejects.toThrow(BadRequestException);
    });
  });

  describe('processExpiredDeletions', () => {
    it('should process all expired deletion requests', async () => {
      const mockRequests = [
        {
          id: 'request-1',
          userId: 'user-1',
          status: 'confirmed',
          expiresAt: new Date(Date.now() - 1000),
          user: { id: 'user-1', email: 'user1@example.com' },
        },
        {
          id: 'request-2',
          userId: 'user-2',
          status: 'confirmed',
          expiresAt: new Date(Date.now() - 2000),
          user: { id: 'user-2', email: 'user2@example.com' },
        },
      ];

      (prisma.deletionRequest.findMany as any).mockResolvedValue(mockRequests);
      (prisma.deletionRequest.findFirst as any)
        .mockResolvedValueOnce(mockRequests[0])
        .mockResolvedValueOnce(mockRequests[1]);
      (prisma.auditLog.findMany as any).mockResolvedValue([]);
      (prisma.user.delete as any).mockResolvedValue({ count: 1 });
      (prisma.deletionRequest.update as any).mockResolvedValue({});

      const result = await service.processExpiredDeletions();

      expect(result.processed).toBe(2);
    });

    it('should handle deletion failures gracefully', async () => {
      const mockRequests = [
        {
          id: 'request-1',
          userId: 'user-1',
          status: 'confirmed',
          expiresAt: new Date(Date.now() - 1000),
          user: { id: 'user-1', email: 'user1@example.com' },
        },
      ];

      (prisma.deletionRequest.findMany as any).mockResolvedValue(mockRequests);
      (prisma.deletionRequest.findFirst as any).mockRejectedValue(new Error('Database error'));

      const result = await service.processExpiredDeletions();

      expect(result.processed).toBe(1);
    });

    it('should return 0 when no expired requests', async () => {
      (prisma.deletionRequest.findMany as any).mockResolvedValue([]);

      const result = await service.processExpiredDeletions();

      expect(result.processed).toBe(0);
    });
  });
});
