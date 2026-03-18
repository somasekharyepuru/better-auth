// Mock auth.config before importing
jest.mock('../auth/auth.config', () => ({
  betterAuth: jest.fn(),
  prismaAdapter: jest.fn(),
  emailOTP: jest.fn(),
  admin: jest.fn(),
  twoFactor: jest.fn(),
  organization: jest.fn(),
  haveIBeenPwned: jest.fn(),
  owner: {
    authorize: jest.fn().mockReturnValue({ success: true }),
  },
  adminRole: {
    authorize: jest.fn().mockReturnValue({ success: true }),
  },
  manager: {
    authorize: jest.fn().mockReturnValue({ success: true }),
  },
  member: {
    authorize: jest.fn().mockReturnValue({ success: false }),
  },
  viewer: {
    authorize: jest.fn().mockReturnValue({ success: false }),
  },
}));

// Mock OrganizationService before importing
jest.mock('./organization.service', () => ({
  OrganizationService: jest.fn().mockImplementation(() => ({
    initiateTransfer: jest.fn().mockResolvedValue({
      transferId: 'transfer-1',
      expiresAt: new Date(Date.now() + 86400000),
    }),
    getPendingTransfer: jest.fn().mockResolvedValue({
      id: 'transfer-1',
      newOwnerId: 'user-2',
    }),
    cancelTransfer: jest.fn().mockResolvedValue({ success: true }),
    getTransferByToken: jest.fn().mockResolvedValue({
      id: 'transfer-1',
      organizationId: 'org-1',
      organizationName: 'Test Org',
    }),
    confirmTransfer: jest.fn().mockResolvedValue({
      organizationId: 'org-1',
      organizationName: 'Test Org',
    }),
    declineTransfer: jest.fn().mockResolvedValue({
      organizationId: 'org-1',
      organizationName: 'Test Org',
    }),
    resendInvitation: jest.fn().mockResolvedValue({
      organizationId: 'org-1',
      email: 'invitee@example.com',
    }),
    updateTeam: jest.fn().mockResolvedValue({
      id: 'team-1',
      organizationId: 'org-1',
      name: 'Updated Team',
    }),
    deleteTeam: jest.fn().mockResolvedValue({
      id: 'team-1',
      organizationId: 'org-1',
      name: 'Deleted Team',
    }),
    listTeamsWithMembers: jest.fn().mockResolvedValue([]),
  })),
}));

// Mock audit service
jest.mock('../audit/audit.service', () => ({
  auditService: {
    logOrganizationAction: jest.fn().mockResolvedValue(undefined),
    logAction: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock better-auth fromNodeHeaders
jest.mock('better-auth/node', () => ({
  fromNodeHeaders: jest.fn((headers) => headers),
}));

import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { auditService } from '../audit/audit.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  let mockOrganizationService: any;

  const createMockSession = (overrides: any = {}) => ({
    user: { id: 'user-1' },
    session: { id: 'session-1' },
    ...overrides,
  });

  const createMockRequest = (overrides: any = {}) => ({
    headers: {
      'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      'user-agent': 'Mozilla/5.0',
    },
    ...overrides,
  });

  beforeEach(() => {
    const { OrganizationService } = require('./organization.service');
    mockOrganizationService = new OrganizationService();
    controller = new OrganizationController(mockOrganizationService);
    jest.clearAllMocks();
  });

  describe('initiateTransfer', () => {
    it('should initiate ownership transfer and log action', async () => {
      const session = createMockSession() as any;
      const req = createMockRequest();
      const body = { newOwnerId: 'user-2' };

      mockOrganizationService.initiateTransfer.mockResolvedValue({
        transferId: 'transfer-1',
        expiresAt: new Date(Date.now() + 86400000),
      });

      const result = await controller.initiateTransfer('org-1', body, session, req);

      expect(mockOrganizationService.initiateTransfer).toHaveBeenCalledWith(
        'org-1',
        'user-1',
        'user-2'
      );
      expect(auditService.logOrganizationAction).toHaveBeenCalledWith(
        'org-1',
        'user-1',
        'org.transfer.initiated',
        expect.objectContaining({
          newOwnerId: 'user-2',
          transferId: 'transfer-1',
        }),
        'session-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );
      expect(result).toHaveProperty('transferId');
      expect(result).toHaveProperty('expiresAt');
    });

    it('should throw ForbiddenException when not authenticated', async () => {
      const session = {} as any;
      const req = createMockRequest();
      const body = { newOwnerId: 'user-2' };

      await expect(controller.initiateTransfer('org-1', body, session, req)).rejects.toThrow(
        new ForbiddenException('Authentication required')
      );
    });

    it('should enforce rate limiting (max 2 requests per hour)', async () => {
      const session = createMockSession() as any;
      const req = createMockRequest();
      const body = { newOwnerId: 'user-2' };

      mockOrganizationService.initiateTransfer.mockResolvedValue({
        transferId: 'transfer-1',
        expiresAt: new Date(Date.now() + 86400000),
      });

      // First two requests should succeed
      await controller.initiateTransfer('org-1', body, session, req);
      await controller.initiateTransfer('org-1', body, session, req);

      // Third request within limit window should throw throttled exception
      await expect(controller.initiateTransfer('org-1', body, session, req)).rejects.toThrow(
        expect.objectContaining({ statusCode: 429, message: expect.stringContaining('Throttler') })
      );
    });
  });

  describe('getPendingTransfer', () => {
    it('should return pending transfer', async () => {
      const session = createMockSession() as any;

      mockOrganizationService.getPendingTransfer.mockResolvedValue({
        id: 'transfer-1',
        newOwnerId: 'user-2',
      });

      const result = await controller.getPendingTransfer('org-1', session);

      expect(mockOrganizationService.getPendingTransfer).toHaveBeenCalledWith('org-1');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('newOwnerId');
    });

    it('should throw ForbiddenException when not authenticated', async () => {
      const session = {} as any;

      await expect(controller.getPendingTransfer('org-1', session)).rejects.toThrow(
        new ForbiddenException('Authentication required')
      );
    });
  });

  describe('cancelTransfer', () => {
    it('should cancel transfer and log action', async () => {
      const session = createMockSession() as any;
      const req = createMockRequest();

      mockOrganizationService.cancelTransfer.mockResolvedValue({ success: true });

      const result = await controller.cancelTransfer('transfer-1', session, req);

      expect(mockOrganizationService.cancelTransfer).toHaveBeenCalledWith('transfer-1', 'user-1');
      expect(auditService.logAction).toHaveBeenCalledWith({
        userId: 'user-1',
        action: 'org.transfer.cancelled',
        resourceType: 'organization',
        resourceId: 'transfer-1',
        sessionId: 'session-1',
        details: { transferId: 'transfer-1' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });
      expect(result).toHaveProperty('success');
    });

    it('should throw ForbiddenException when not authenticated', async () => {
      const session = {} as any;
      const req = createMockRequest();

      await expect(controller.cancelTransfer('transfer-1', session, req)).rejects.toThrow(
        new ForbiddenException('Authentication required')
      );
    });
  });

  describe('getTransferInfo', () => {
    it('should return transfer info by token', async () => {
      const session = createMockSession() as any;
      mockOrganizationService.getTransferByToken.mockResolvedValue({
        id: 'transfer-1',
        organizationId: 'org-1',
        organizationName: 'Test Org',
        newOwner: { id: 'user-2', name: 'New Owner' },
      });

      const result = await controller.getTransferInfo('valid-token', session);

      expect(mockOrganizationService.getTransferByToken).toHaveBeenCalledWith('valid-token');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('organizationId');
    });

    it('should throw NotFoundException when transfer not found', async () => {
      const session = createMockSession() as any;
      mockOrganizationService.getTransferByToken.mockResolvedValue(null);

      await expect(controller.getTransferInfo('invalid-token', session)).rejects.toThrow(
        new NotFoundException('Transfer not found')
      );
    });

    it('should throw ForbiddenException when not authenticated', async () => {
      const session = {} as any;

      await expect(controller.getTransferInfo('valid-token', session)).rejects.toThrow(
        new ForbiddenException('Authentication required')
      );
    });
  });

  describe('confirmTransfer', () => {
    it('should confirm transfer and log action', async () => {
      const session = createMockSession() as any;
      const req = createMockRequest();

      mockOrganizationService.confirmTransfer.mockResolvedValue({
        organizationId: 'org-1',
        organizationName: 'Test Org',
      });

      const result = await controller.confirmTransfer('valid-token', session, req);

      expect(mockOrganizationService.confirmTransfer).toHaveBeenCalledWith('valid-token', 'user-1');
      expect(auditService.logOrganizationAction).toHaveBeenCalledWith(
        'org-1',
        'user-1',
        'org.transfer.confirmed',
        expect.objectContaining({
          organizationName: 'Test Org',
        }),
        'session-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );
      expect(result).toHaveProperty('organizationId');
    });

    it('should throw ForbiddenException when not authenticated', async () => {
      const session = {} as any;
      const req = createMockRequest();

      await expect(controller.confirmTransfer('valid-token', session, req)).rejects.toThrow(
        new ForbiddenException('Authentication required')
      );
    });
  });

  describe('declineTransfer', () => {
    it('should decline transfer and log action', async () => {
      const session = createMockSession() as any;
      const req = createMockRequest();

      mockOrganizationService.declineTransfer.mockResolvedValue({
        organizationId: 'org-1',
        organizationName: 'Test Org',
      });

      const result = await controller.declineTransfer('valid-token', session, req);

      expect(mockOrganizationService.declineTransfer).toHaveBeenCalledWith('valid-token', 'user-1');
      expect(auditService.logAction).toHaveBeenCalledWith({
        userId: 'user-1',
        action: 'org.transfer.declined',
        resourceType: 'organization',
        resourceId: 'org-1',
        sessionId: 'session-1',
        details: expect.objectContaining({
          organizationName: 'Test Org',
        }),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });
      expect(result).toHaveProperty('organizationId');
    });

    it('should throw ForbiddenException when not authenticated', async () => {
      const session = {} as any;
      const req = createMockRequest();

      await expect(controller.declineTransfer('valid-token', session, req)).rejects.toThrow(
        new ForbiddenException('Authentication required')
      );
    });
  });

  describe('resendInvitation', () => {
    it('should resend invitation and log action', async () => {
      const session = createMockSession() as any;
      const req = createMockRequest();

      mockOrganizationService.resendInvitation.mockResolvedValue({
        organizationId: 'org-1',
        email: 'invitee@example.com',
      });

      const result = await controller.resendInvitation('invite-1', session, req);

      expect(mockOrganizationService.resendInvitation).toHaveBeenCalledWith('invite-1', 'user-1');
      expect(auditService.logOrganizationAction).toHaveBeenCalledWith(
        'org-1',
        'user-1',
        'org.member.invite.resent',
        expect.objectContaining({
          invitationId: 'invite-1',
          email: 'invitee@example.com',
        }),
        'session-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );
      expect(result).toHaveProperty('organizationId');
    });

    it('should throw ForbiddenException when not authenticated', async () => {
      const session = {} as any;
      const req = createMockRequest();

      await expect(controller.resendInvitation('invite-1', session, req)).rejects.toThrow(
        new ForbiddenException('Authentication required')
      );
    });
  });

  describe('updateTeam', () => {
    it('should update team and log action', async () => {
      const session = createMockSession() as any;
      const req = createMockRequest();
      const body = { name: 'Updated Team Name', description: 'New description' };

      mockOrganizationService.updateTeam.mockResolvedValue({
        id: 'team-1',
        organizationId: 'org-1',
        name: 'Updated Team Name',
      });

      const result = await controller.updateTeam('org-1', 'team-1', body, session, req);

      expect(mockOrganizationService.updateTeam).toHaveBeenCalledWith('team-1', body, req.headers);
      expect(auditService.logOrganizationAction).toHaveBeenCalledWith(
        'org-1',
        'user-1',
        'org.team.updated',
        expect.objectContaining({
          teamId: 'team-1',
          name: 'Updated Team Name',
        }),
        'session-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('organizationId');
    });

  });

  describe('deleteTeam', () => {
    it('should delete team and log action', async () => {
      const session = createMockSession() as any;
      const req = createMockRequest();

      mockOrganizationService.deleteTeam.mockResolvedValue({
        id: 'team-1',
        organizationId: 'org-1',
        name: 'Deleted Team',
      });

      const result = await controller.deleteTeam('org-1', 'team-1', session, req);

      expect(mockOrganizationService.deleteTeam).toHaveBeenCalledWith('team-1', req.headers);
      expect(auditService.logOrganizationAction).toHaveBeenCalledWith(
        'org-1',
        'user-1',
        'org.team.deleted',
        expect.objectContaining({
          teamId: 'team-1',
          teamName: 'Deleted Team',
        }),
        'session-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );
      expect(result).toEqual({ success: true, message: 'Team deleted' });
    });

  });

  describe('listTeamsWithMembers', () => {
    it('should list teams with members', async () => {
      const session = createMockSession() as any;

      mockOrganizationService.listTeamsWithMembers.mockResolvedValue([
        {
          id: 'team-1',
          name: 'Engineering',
          members: [{ id: 'user-1', name: 'User 1' }],
        },
      ]);

      const result = await controller.listTeamsWithMembers('org-1', session);

      expect(mockOrganizationService.listTeamsWithMembers).toHaveBeenCalledWith('org-1', 'user-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('members');
    });

    it('should throw ForbiddenException when not authenticated', async () => {
      const session = {} as any;

      await expect(controller.listTeamsWithMembers('org-1', session)).rejects.toThrow(
        new ForbiddenException('Authentication required')
      );
    });
  });
});
