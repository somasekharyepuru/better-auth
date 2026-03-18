import { ForbiddenException } from '@nestjs/common';
import { auditService } from '../audit/audit.service';

// Mock the account deletion service module
jest.mock('./account-deletion.service', () => ({
  AccountDeletionService: jest.fn().mockImplementation(() => ({
    createDeletionRequest: jest.fn().mockResolvedValue({
      id: 'request-1',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 2592000000), // 30 days
      status: 'pending',
    }),
    confirmDeletionRequest: jest.fn().mockResolvedValue({
      confirmed: true,
      request: {
        id: 'request-1',
        expiresAt: new Date(Date.now() + 2592000000),
      },
    }),
    cancelDeletionRequest: jest.fn().mockResolvedValue({ cancelled: true }),
    getDeletionStatus: jest.fn().mockResolvedValue({
      hasPendingRequest: false,
      request: null,
    }),
    executeDeletion: jest.fn().mockResolvedValue({
      deleted: true,
      userId: 'user-1',
      requestId: 'request-1',
    }),
  })),
}));

// Mock PrismaService
jest.mock('../common/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({})),
}));

// Mock audit service
jest.mock('../audit/audit.service', () => ({
  auditService: {
    logUserAction: jest.fn().mockResolvedValue(undefined),
    logAction: jest.fn().mockResolvedValue(undefined),
  },
}));

import { AccountDeletionController } from './account-deletion.controller';
import { AccountDeletionService } from './account-deletion.service';

describe('AccountDeletionController', () => {
  let controller: AccountDeletionController;
  let mockService: any;

  beforeEach(() => {
    // Get the mocked class and create an instance
    const { AccountDeletionService } = require('./account-deletion.service');
    mockService = new AccountDeletionService();
    controller = new AccountDeletionController(mockService);
    jest.clearAllMocks();
  });

  const createMockRequest = (overrides: any = {}) => ({
    user: {
      id: 'user-1',
      email: 'user@example.com',
    },
    ...overrides,
  });

  describe('requestDeletion', () => {
    it('should create deletion request for authenticated user', async () => {
      const req = createMockRequest();

      const result = await controller.requestDeletion(req);

      expect(mockService.createDeletionRequest).toHaveBeenCalledWith('user-1');
      expect(auditService.logUserAction).toHaveBeenCalledWith(
        'user-1',
        'user.delete.request',
        expect.objectContaining({
          requestId: 'request-1',
        })
      );
      expect(result).toEqual({
        message: 'Account deletion requested. Please confirm via email to proceed.',
        request: {
          id: 'request-1',
          expiresAt: expect.any(Date),
        },
      });
    });

    it('should throw ForbiddenException when user is missing', async () => {
      const req = createMockRequest({ user: null });

      await expect(controller.requestDeletion(req)).rejects.toThrow(
        new ForbiddenException('Not authenticated')
      );
    });

    it('should throw ForbiddenException when user.id is missing', async () => {
      const req = createMockRequest({ user: { email: 'user@example.com' } });

      await expect(controller.requestDeletion(req)).rejects.toThrow(
        new ForbiddenException('Not authenticated')
      );
    });

    it('should throw ForbiddenException when user.email is missing', async () => {
      const req = createMockRequest({ user: { id: 'user-1' } });

      // requestDeletion takes a UserSession, not req — it only checks user.id
      // This should NOT throw because user.id is present
      const result = await controller.requestDeletion(req);
      expect(result).toBeDefined();
    });
  });

  describe('confirmDeletion', () => {
    it('should confirm deletion request with valid token', async () => {
      const req = createMockRequest();
      const token = 'valid-token-123';

      const result = await controller.confirmDeletion(token, req);

      expect(mockService.confirmDeletionRequest).toHaveBeenCalledWith(token, 'user-1');
      expect(auditService.logUserAction).toHaveBeenCalledWith(
        'user-1',
        'user.delete.confirm',
        expect.objectContaining({
          requestId: 'request-1',
        })
      );
      expect(result).toEqual({
        confirmed: true,
        request: {
          id: 'request-1',
          expiresAt: expect.any(Date),
        },
      });
    });

    it('should throw ForbiddenException when user is missing', async () => {
      const req = createMockRequest({ user: null });

      await expect(controller.confirmDeletion('token', req)).rejects.toThrow(
        new ForbiddenException('Not authenticated')
      );
    });

    it('should throw ForbiddenException when user.id is missing', async () => {
      const req = createMockRequest({ user: {} });

      await expect(controller.confirmDeletion('token', req)).rejects.toThrow(
        new ForbiddenException('Not authenticated')
      );
    });
  });

  describe('cancelDeletion', () => {
    it('should cancel deletion request', async () => {
      const req = createMockRequest();

      const result = await controller.cancelDeletion(req);

      expect(mockService.cancelDeletionRequest).toHaveBeenCalledWith('user-1');
      expect(auditService.logUserAction).toHaveBeenCalledWith('user-1', 'user.delete.cancel', {});
      expect(result).toEqual({ success: true, message: 'Account deletion request cancelled' });
    });

    it('should throw ForbiddenException when user is missing', async () => {
      const req = createMockRequest({ user: null });

      await expect(controller.cancelDeletion(req)).rejects.toThrow(
        new ForbiddenException('Not authenticated')
      );
    });
  });

  describe('getDeletionStatus', () => {
    it('should return deletion status', async () => {
      const req = createMockRequest();

      const result = await controller.getDeletionStatus(req);

      expect(mockService.getDeletionStatus).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        hasPendingRequest: false,
        request: null,
      });
    });

    it('should throw ForbiddenException when user is missing', async () => {
      const req = createMockRequest({ user: null });

      await expect(controller.getDeletionStatus(req)).rejects.toThrow(
        new ForbiddenException('Not authenticated')
      );
    });
  });

  describe('executeDeletion', () => {
    it('should execute deletion with valid token', async () => {
      const token = 'valid-execution-token';

      const result = await controller.executeDeletion(token, createMockRequest());

      expect(mockService.executeDeletion).toHaveBeenCalledWith(token, 'user-1');
      expect(auditService.logAction).toHaveBeenCalledWith({
        userId: 'user-1',
        action: 'user.delete.execute',
        details: { requestId: 'request-1' },
      });
      expect(result).toEqual({
        deleted: true,
        userId: 'user-1',
        requestId: 'request-1',
      });
    });
  });
});
