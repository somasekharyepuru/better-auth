// Mock PrismaService before importing
jest.mock('../common/prisma.service', () => {
  const mockPrisma: any = {
    member: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    ownershipTransfer: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    team: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    teamMember: {
      findMany: jest.fn(),
    },
    invitation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    rateLimit: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn((callback: any) => callback(mockPrisma)),
  };
  return {
    PrismaService: jest.fn().mockImplementation(() => mockPrisma),
  };
});

// Mock Better Auth
jest.mock('../auth/auth.config', () => ({
  betterAuth: jest.fn(),
  prismaAdapter: jest.fn(),
  emailOTP: jest.fn(),
  admin: jest.fn(),
  twoFactor: jest.fn(),
  organization: jest.fn(),
  haveIBeenPwned: jest.fn(),
  auth: {
    api: {
      updateTeam: jest.fn(),
      removeTeam: jest.fn(),
    },
  },
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

// Mock email queue service
jest.mock('../email-queue/email-queue.service', () => ({
  emailQueueService: {
    addEmailJob: jest.fn().mockResolvedValue(undefined),
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

import { OrganizationService } from './organization.service';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let prisma: any;
  let emailQueueService: any;
  let authApi: any;

  beforeEach(() => {
    const { PrismaService } = require('../common/prisma.service');
    prisma = new PrismaService();
    emailQueueService = require('../email-queue/email-queue.service').emailQueueService;
    authApi = require('../auth/auth.config').auth.api;

    service = new OrganizationService(prisma);
    jest.clearAllMocks();
  });

  describe('initiateTransfer', () => {
    it('should initiate ownership transfer successfully', async () => {
      const currentMember = { id: 'member-1', organizationId: 'org-1', userId: 'user-1', role: 'owner' };
      const newMember = { id: 'member-2', userId: 'user-2', user: { id: 'user-2', name: 'New Owner', email: 'new@example.com' } };
      const organization = { id: 'org-1', name: 'Test Org' };
      const transfer = { id: 'transfer-1', expiresAt: new Date(Date.now() + 604800000) };

      prisma.member.findFirst
        .mockResolvedValueOnce(currentMember)
        .mockResolvedValueOnce(newMember);
      prisma.ownershipTransfer.findFirst.mockResolvedValue(null);
      prisma.organization.findUnique.mockResolvedValue(organization);
      prisma.ownershipTransfer.create.mockResolvedValue(transfer);

      const result = await service.initiateTransfer('org-1', 'user-1', 'user-2');

      expect(result).toHaveProperty('transferId');
      expect(result).toHaveProperty('expiresAt');
      expect(result).toHaveProperty('message');
      expect(emailQueueService.addEmailJob).toHaveBeenCalledWith(
        'new@example.com',
        expect.stringContaining('organizationName'),
        'ownership-transfer'
      );
    });

    it('should throw ForbiddenException when current user is not owner', async () => {
      prisma.member.findFirst.mockResolvedValue(null);

      await expect(service.initiateTransfer('org-1', 'user-1', 'user-2')).rejects.toThrow(
        new ForbiddenException('Only the organization owner can transfer ownership')
      );
    });

    it('should throw BadRequestException when new owner is not a member', async () => {
      prisma.member.findFirst
        .mockResolvedValueOnce({ id: 'member-1', role: 'owner' })
        .mockResolvedValueOnce(null);

      await expect(service.initiateTransfer('org-1', 'user-1', 'user-2')).rejects.toThrow(
        new BadRequestException('Invalid user for this operation')
      );
    });

    it('should throw BadRequestException when transferring to yourself', async () => {
      const member = { id: 'member-1', role: 'owner', user: { id: 'user-1', email: 'test@example.com' } };

      prisma.member.findFirst
        .mockResolvedValueOnce({ id: 'member-1', role: 'owner' })
        .mockResolvedValueOnce(member);

      await expect(service.initiateTransfer('org-1', 'user-1', 'user-1')).rejects.toThrow(
        new BadRequestException('Cannot transfer ownership to yourself')
      );
    });

    it('should throw BadRequestException when there is existing pending transfer', async () => {
      prisma.member.findFirst
        .mockResolvedValueOnce({ id: 'member-1', role: 'owner' })
        .mockResolvedValueOnce({ id: 'member-2', userId: 'user-2', user: { id: 'user-2', email: 'test@example.com' } });
      prisma.ownershipTransfer.findFirst.mockResolvedValue({ id: 'existing', status: 'pending' });

      await expect(service.initiateTransfer('org-1', 'user-1', 'user-2')).rejects.toThrow(
        new BadRequestException('There is already a pending ownership transfer for this organization')
      );
    });

    it('should throw NotFoundException when organization not found', async () => {
      prisma.member.findFirst
        .mockResolvedValueOnce({ id: 'member-1', role: 'owner' })
        .mockResolvedValueOnce({ id: 'member-2', user: { id: 'user-2' } });
      prisma.ownershipTransfer.findFirst.mockResolvedValue(null);
      prisma.organization.findUnique.mockResolvedValue(null);

      await expect(service.initiateTransfer('org-1', 'user-1', 'user-2')).rejects.toThrow(
        new NotFoundException('Organization not found')
      );
    });
  });

  describe('confirmTransfer', () => {
    it('should confirm ownership transfer successfully', async () => {
      const transfer = {
        id: 'transfer-1',
        organizationId: 'org-1',
        fromUserId: 'user-1',
        toUserId: 'user-2',
        status: 'pending',
        expiresAt: new Date(Date.now() + 86400000),
        organization: { id: 'org-1', name: 'Test Org' },
      };

      prisma.ownershipTransfer.findUnique.mockResolvedValue(transfer);
      prisma.member.updateMany.mockResolvedValue({ count: 1 });
      prisma.ownershipTransfer.update.mockResolvedValue({});

      const result = await service.confirmTransfer('valid-token', 'user-2');

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('organizationId', 'org-1');
      expect(prisma.member.updateMany).toHaveBeenCalledTimes(2);
      expect(prisma.ownershipTransfer.update).toHaveBeenCalledWith({
        where: { id: 'transfer-1' },
        data: { status: 'confirmed', confirmedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException when transfer not found', async () => {
      prisma.ownershipTransfer.findUnique.mockResolvedValue(null);

      await expect(service.confirmTransfer('invalid-token', 'user-2')).rejects.toThrow(
        new NotFoundException('Transfer request not found')
      );
    });

    it('should throw BadRequestException when transfer is not pending', async () => {
      prisma.ownershipTransfer.findUnique.mockResolvedValue({
        id: 'transfer-1',
        status: 'confirmed',
        expiresAt: new Date(Date.now() + 86400000),
      });

      await expect(service.confirmTransfer('token', 'user-2')).rejects.toThrow(
        new BadRequestException('Transfer is already confirmed')
      );
    });

    it('should throw BadRequestException when transfer has expired', async () => {
      const transfer = {
        id: 'transfer-1',
        status: 'pending',
        expiresAt: new Date(Date.now() - 86400000), // expired
      };

      prisma.ownershipTransfer.findUnique.mockResolvedValue(transfer);
      prisma.ownershipTransfer.update.mockResolvedValue({});

      await expect(service.confirmTransfer('token', 'user-2')).rejects.toThrow(
        new BadRequestException('Transfer request has expired')
      );
    });

    it('should throw ForbiddenException when user is not the designated new owner', async () => {
      const transfer = {
        id: 'transfer-1',
        toUserId: 'user-2',
        status: 'pending',
        expiresAt: new Date(Date.now() + 86400000),
      };

      prisma.ownershipTransfer.findUnique.mockResolvedValue(transfer);

      await expect(service.confirmTransfer('token', 'user-3')).rejects.toThrow(
        new ForbiddenException('Only the designated new owner can confirm this transfer')
      );
    });
  });

  describe('cancelTransfer', () => {
    it('should cancel transfer successfully', async () => {
      const transfer = {
        id: 'transfer-1',
        fromUserId: 'user-1',
        status: 'pending',
      };

      prisma.ownershipTransfer.findUnique.mockResolvedValue(transfer);
      prisma.ownershipTransfer.update.mockResolvedValue({});

      const result = await service.cancelTransfer('transfer-1', 'user-1');

      expect(result).toHaveProperty('success', true);
      expect(prisma.ownershipTransfer.update).toHaveBeenCalledWith({
        where: { id: 'transfer-1' },
        data: { status: 'cancelled' },
      });
    });

    it('should throw NotFoundException when transfer not found', async () => {
      prisma.ownershipTransfer.findUnique.mockResolvedValue(null);

      await expect(service.cancelTransfer('transfer-1', 'user-1')).rejects.toThrow(
        new NotFoundException('Transfer request not found')
      );
    });

    it('should throw ForbiddenException when requester is not the current owner', async () => {
      const transfer = {
        id: 'transfer-1',
        fromUserId: 'user-1',
        status: 'pending',
      };

      prisma.ownershipTransfer.findUnique.mockResolvedValue(transfer);

      await expect(service.cancelTransfer('transfer-1', 'user-2')).rejects.toThrow(
        new ForbiddenException('Only the current owner can cancel a transfer request')
      );
    });
  });

  describe('getPendingTransfer', () => {
    it('should return pending transfer with user info', async () => {
      const transfer = {
        id: 'transfer-1',
        organizationId: 'org-1',
        fromUserId: 'user-1',
        toUserId: 'user-2',
        status: 'pending',
        organization: { id: 'org-1', name: 'Test Org' },
      };
      const fromUser = { id: 'user-1', name: 'Owner', email: 'owner@example.com' };
      const toUser = { id: 'user-2', name: 'New Owner', email: 'new@example.com' };

      prisma.ownershipTransfer.findFirst.mockResolvedValue(transfer);
      prisma.user.findUnique
        .mockResolvedValueOnce(fromUser)
        .mockResolvedValueOnce(toUser);

      const result = await service.getPendingTransfer('org-1') as any;

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('fromUser');
      expect(result).toHaveProperty('toUser');
      expect(result.fromUser).toEqual(fromUser);
      expect(result.toUser).toEqual(toUser);
    });

    it('should return null when no pending transfer', async () => {
      prisma.ownershipTransfer.findFirst.mockResolvedValue(null);

      const result = await service.getPendingTransfer('org-1');

      expect(result).toBeNull();
    });
  });

  describe('getTransferByToken', () => {
    it('should return transfer by token', async () => {
      const transfer = {
        id: 'transfer-1',
        organizationId: 'org-1',
        fromUserId: 'user-1',
        toUserId: 'user-2',
        status: 'pending',
        expiresAt: new Date(Date.now() + 86400000),
        organization: { id: 'org-1', name: 'Test Org', slug: 'test-org' },
      };
      const fromUser = { id: 'user-1', name: 'Owner', email: 'owner@example.com' };
      const toUser = { id: 'user-2', name: 'New Owner', email: 'new@example.com' };

      prisma.ownershipTransfer.findUnique.mockResolvedValue(transfer);
      prisma.user.findUnique
        .mockResolvedValueOnce(fromUser)
        .mockResolvedValueOnce(toUser);

      const result = await service.getTransferByToken('valid-token');

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('organization');
      expect(result).toHaveProperty('fromUser');
      expect(result).toHaveProperty('toUser');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('isExpired', false);
    });

    it('should return null when transfer not found', async () => {
      prisma.ownershipTransfer.findUnique.mockResolvedValue(null);

      const result = await service.getTransferByToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should mark transfer as expired when past expiry', async () => {
      const transfer = {
        id: 'transfer-1',
        expiresAt: new Date(Date.now() - 86400000), // expired
        organization: { id: 'org-1', name: 'Test Org', slug: 'test-org' },
      };
      const fromUser = { id: 'user-1', name: 'Owner', email: 'owner@example.com' };
      const toUser = { id: 'user-2', name: 'New Owner', email: 'new@example.com' };

      prisma.ownershipTransfer.findUnique.mockResolvedValue(transfer);
      prisma.user.findUnique
        .mockResolvedValueOnce(fromUser)
        .mockResolvedValueOnce(toUser);

      const result = await service.getTransferByToken('expired-token');

      expect(result).toHaveProperty('isExpired', true);
    });
  });

  describe('declineTransfer', () => {
    it('should decline transfer successfully', async () => {
      const transfer = {
        id: 'transfer-1',
        organizationId: 'org-1',
        toUserId: 'user-2',
        status: 'pending',
        expiresAt: new Date(Date.now() + 86400000),
        organization: { id: 'org-1', name: 'Test Org' },
      };

      prisma.ownershipTransfer.findUnique.mockResolvedValue(transfer);
      prisma.ownershipTransfer.update.mockResolvedValue({
        ...transfer,
        status: 'declined',
        confirmedAt: new Date(),
      });

      const result = await service.declineTransfer('token', 'user-2');

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('organizationId', 'org-1');
      expect(prisma.ownershipTransfer.update).toHaveBeenCalledWith({
        where: { id: 'transfer-1' },
        data: { status: 'declined', confirmedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException when transfer not found', async () => {
      prisma.ownershipTransfer.findUnique.mockResolvedValue(null);

      await expect(service.declineTransfer('token', 'user-2')).rejects.toThrow(
        new NotFoundException('Transfer request not found')
      );
    });

    it('should throw BadRequestException when transfer has expired', async () => {
      const transfer = {
        id: 'transfer-1',
        toUserId: 'user-2',
        status: 'pending',
        expiresAt: new Date(Date.now() - 86400000), // expired
      };

      prisma.ownershipTransfer.findUnique.mockResolvedValue(transfer);

      await expect(service.declineTransfer('token', 'user-2')).rejects.toThrow(
        new BadRequestException('Transfer request has expired')
      );
    });

    it('should throw ForbiddenException when user is not the designated new owner', async () => {
      const transfer = {
        id: 'transfer-1',
        toUserId: 'user-2',
        status: 'pending',
        expiresAt: new Date(Date.now() + 86400000),
      };

      prisma.ownershipTransfer.findUnique.mockResolvedValue(transfer);

      await expect(service.declineTransfer('token', 'user-3')).rejects.toThrow(
        new ForbiddenException('Only the designated new owner can decline this transfer')
      );
    });
  });

  describe('resendInvitation', () => {
    it('should resend invitation email successfully', async () => {
      const invitation = {
        id: 'invite-1',
        email: 'invitee@example.com',
        status: 'pending',
        expiresAt: new Date(Date.now() + 86400000),
        organizationId: 'org-1',
        organization: { id: 'org-1', name: 'Test Org' },
      };

      const member = { id: 'member-1', userId: 'user-1', organizationId: 'org-1', role: 'owner' };

      prisma.invitation.findUnique.mockResolvedValue(invitation);
      prisma.member.findUnique.mockResolvedValue(member);

      const result = await service.resendInvitation('invite-1', 'user-1');

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('email', 'invitee@example.com');
      expect(result).toHaveProperty('organizationId', 'org-1');
      expect(emailQueueService.addEmailJob).toHaveBeenCalledWith(
        'invitee@example.com',
        expect.stringContaining('organizationName'),
        'organization-invitation'
      );
    });

    it('should throw NotFoundException when invitation not found', async () => {
      prisma.invitation.findUnique.mockResolvedValue(null);

      await expect(service.resendInvitation('invite-1', 'user-1')).rejects.toThrow(
        new NotFoundException('Invitation not found')
      );
    });

    it('should throw BadRequestException when invitation has expired', async () => {
      const invitation = {
        id: 'invite-1',
        status: 'pending',
        expiresAt: new Date(Date.now() - 86400000), // expired
      };

      prisma.invitation.findUnique.mockResolvedValue(invitation);

      await expect(service.resendInvitation('invite-1', 'user-1')).rejects.toThrow(
        new BadRequestException('Invitation has expired')
      );
    });

    it('should throw BadRequestException when email queue fails', async () => {
      const invitation = {
        id: 'invite-1',
        email: 'invitee@example.com',
        status: 'pending',
        expiresAt: new Date(Date.now() + 86400000),
        organization: { id: 'org-1', name: 'Test Org' },
      };

      const member = { id: 'member-1', userId: 'user-1', organizationId: 'org-1', role: 'owner' };

      prisma.invitation.findUnique.mockResolvedValue(invitation);
      prisma.member.findUnique.mockResolvedValue(member);
      emailQueueService.addEmailJob.mockRejectedValue(new Error('Email service down'));

      await expect(service.resendInvitation('invite-1', 'user-1')).rejects.toThrow(
        new BadRequestException('Failed to resend invitation email')
      );
    });
  });

  describe('updateTeam', () => {
    it('should update team successfully', async () => {
      const team = { id: 'team-1', organizationId: 'org-1', name: 'Old Name' };
      const updatedTeam = { id: 'team-1', organizationId: 'org-1', name: 'New Name' };

      prisma.team.findUnique.mockResolvedValue(team);
      authApi.updateTeam.mockResolvedValue(updatedTeam);

      const result = await service.updateTeam('team-1', { name: 'New Name' }, new Headers());

      expect(result).toEqual(updatedTeam);
      expect(authApi.updateTeam).toHaveBeenCalledWith({
        body: {
          teamId: 'team-1',
          data: { name: 'New Name' },
        },
        headers: expect.any(Headers),
      });
    });

    it('should throw NotFoundException when team not found', async () => {
      prisma.team.findUnique.mockResolvedValue(null);

      await expect(service.updateTeam('team-1', { name: 'New Name' }, new Headers())).rejects.toThrow(
        new NotFoundException('Team not found')
      );
    });

    it('should throw BadRequestException when Better Auth fails', async () => {
      const team = { id: 'team-1', name: 'Test Team' };

      prisma.team.findUnique.mockResolvedValue(team);
      authApi.updateTeam.mockRejectedValue(new Error('Update failed'));

      await expect(service.updateTeam('team-1', { name: 'New Name' }, new Headers())).rejects.toThrow(
        new BadRequestException('Update failed')
      );
    });
  });

  describe('deleteTeam', () => {
    it('should delete team successfully', async () => {
      const team = { id: 'team-1', organizationId: 'org-1', name: 'Deleted Team' };

      prisma.team.findFirst.mockResolvedValue(team);
      authApi.removeTeam.mockResolvedValue({});

      const result = await service.deleteTeam('org-1', 'team-1', new Headers());

      expect(result).toEqual(team);
      expect(authApi.removeTeam).toHaveBeenCalledWith({
        body: { teamId: 'team-1' },
        headers: expect.any(Headers),
      });
    });

    it('should throw NotFoundException when team not found', async () => {
      prisma.team.findFirst.mockResolvedValue(null);

      await expect(service.deleteTeam('org-1', 'team-1', new Headers())).rejects.toThrow(
        new NotFoundException('Team not found')
      );
    });

    it('should throw BadRequestException when Better Auth fails', async () => {
      const team = { id: 'team-1', name: 'Test Team', organizationId: 'org-1' };

      prisma.team.findFirst.mockResolvedValue(team);
      authApi.removeTeam.mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteTeam('org-1', 'team-1', new Headers())).rejects.toThrow(
        new BadRequestException('Delete failed')
      );
    });
  });

  describe('listTeamsWithMembers', () => {
    it('should list teams with members for authorized user', async () => {
      const member = { id: 'member-1', userId: 'user-1', role: 'admin' };
      const teams = [
        { id: 'team-1', organizationId: 'org-1', name: 'Engineering' },
        { id: 'team-2', organizationId: 'org-1', name: 'Sales' },
      ];
      const teamMembers = [
        { id: 'tm-1', teamId: 'team-1', userId: 'user-1' },
        { id: 'tm-2', teamId: 'team-2', userId: 'user-2' },
      ];

      prisma.member.findFirst.mockResolvedValue(member);
      prisma.team.findMany.mockResolvedValue(teams);
      prisma.teamMember.findMany.mockResolvedValue(teamMembers);

      const result = await service.listTeamsWithMembers('org-1', 'user-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('members');
      expect(result[0].members).toEqual([teamMembers[0]]);
    });

    it('should throw ForbiddenException when user is not a member', async () => {
      prisma.member.findFirst.mockResolvedValue(null);

      await expect(service.listTeamsWithMembers('org-1', 'user-1')).rejects.toThrow(
        new ForbiddenException('You are not a member of this organization')
      );
    });

    it('should throw ForbiddenException when user lacks permission', async () => {
      const member = { id: 'member-1', userId: 'user-1', role: 'member' };

      prisma.member.findFirst.mockResolvedValue(member);

      await expect(service.listTeamsWithMembers('org-1', 'user-1')).rejects.toThrow(
        new ForbiddenException('You do not have permission to view team members')
      );
    });

    it('should return empty array when no teams exist', async () => {
      const member = { id: 'member-1', userId: 'user-1', role: 'admin' };

      prisma.member.findFirst.mockResolvedValue(member);
      prisma.team.findMany.mockResolvedValue([]);
      prisma.teamMember.findMany.mockResolvedValue([]);

      const result = await service.listTeamsWithMembers('org-1', 'user-1');

      expect(result).toEqual([]);
    });

    it('should allow owner role to view teams', async () => {
      const member = { id: 'member-1', userId: 'user-1', role: 'owner' };
      const teams = [{ id: 'team-1', organizationId: 'org-1', name: 'Engineering' }];

      prisma.member.findFirst.mockResolvedValue(member);
      prisma.team.findMany.mockResolvedValue(teams);
      prisma.teamMember.findMany.mockResolvedValue([]);

      const result = await service.listTeamsWithMembers('org-1', 'user-1');

      expect(result).toHaveLength(1);
    });

    it('should allow manager role to view teams', async () => {
      const member = { id: 'member-1', userId: 'user-1', role: 'manager' };
      const teams = [{ id: 'team-1', organizationId: 'org-1', name: 'Engineering' }];

      prisma.member.findFirst.mockResolvedValue(member);
      prisma.team.findMany.mockResolvedValue(teams);
      prisma.teamMember.findMany.mockResolvedValue([]);

      const result = await service.listTeamsWithMembers('org-1', 'user-1');

      expect(result).toHaveLength(1);
    });
  });
});
