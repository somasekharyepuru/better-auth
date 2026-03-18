import { AdminService } from './admin.service';
import { PrismaService } from '../common/prisma.service';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Mock email queue service
jest.mock('../email-queue/email-queue.service', () => ({
  emailQueueService: {
    addEmailJob: jest.fn().mockResolvedValue({ id: 'email-job-1' }),
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

// Mock Better Auth - mock at the module level
jest.mock('../auth/auth.config', () => ({
  auth: {
    api: {
      createUser: jest.fn(),
      banUser: jest.fn(),
      unbanUser: jest.fn(),
      setRole: jest.fn(),
      setUserPassword: jest.fn(),
      revokeUserSessions: jest.fn(),
      removeUser: jest.fn(),
    },
  },
}));

describe('AdminService', () => {
  let service: AdminService;
  let prisma: PrismaClient;
  let mockAuth: any;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    service = new AdminService(prisma as any);

    // Import the mocked auth module
    mockAuth = require('../auth/auth.config').auth;
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      (prisma.user.count as any).mockImplementation((args?: any) => {
        if (!args?.where) return Promise.resolve(100);
        if (args.where.role === 'admin') return Promise.resolve(5);
        if (args.where.banned === true) return Promise.resolve(2);
        if (args.where.createdAt?.gte) return Promise.resolve(10);
        return Promise.resolve(0);
      });

      const result = await service.getDashboardStats();

      expect(result).toEqual({
        totalUsers: 100,
        adminUsers: 5,
        bannedUsers: 2,
        newThisWeek: 10,
      });
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      (prisma.user.count as any).mockImplementation((args?: any) => {
        if (!args?.where) return Promise.resolve(100);
        if (args.where.role === 'admin') return Promise.resolve(5);
        if (args.where.banned === true) return Promise.resolve(2);
        if (args.where.emailVerified === true) return Promise.resolve(80);
        if (args.where.emailVerified === false) return Promise.resolve(20);
        if (args.where.banned === false) return Promise.resolve(98);
        if (args.where.createdAt?.gte) return Promise.resolve(15);
        return Promise.resolve(0);
      });

      const result = await service.getUserStats();

      expect(result).toEqual({
        totalUsers: 100,
        adminUsers: 5,
        bannedUsers: 2,
        verifiedUsers: 80,
        unverifiedUsers: 20,
        activeUsers: 98,
        newThisMonth: 15,
      });
    });
  });

  describe('listAllOrganizations', () => {
    const mockOrganizations = [
      {
        id: 'org-1',
        name: 'Test Org 1',
        slug: 'test-org-1',
        banned: false,
        createdAt: new Date('2024-01-01'),
        _count: { members: 5 },
      },
      {
        id: 'org-2',
        name: 'Test Org 2',
        slug: 'test-org-2',
        banned: true,
        createdAt: new Date('2024-01-02'),
        _count: { members: 3 },
      },
    ];

    it('should list all organizations with default parameters', async () => {
      (prisma.organization.findMany as any).mockResolvedValue(mockOrganizations);
      (prisma.organization.count as any).mockResolvedValue(2);

      const result = await service.listAllOrganizations({});

      expect(result.organizations).toHaveLength(2);
      expect(result.organizations[0]).toHaveProperty('memberCount', 5);
      expect(result.organizations[0]._count).toBeUndefined();
      expect(result.pagination).toEqual({
        page: 1,
        limit: 50,
        total: 2,
        totalPages: 1,
      });
    });

    it('should filter by search term', async () => {
      (prisma.organization.findMany as any).mockResolvedValue([mockOrganizations[0]]);
      (prisma.organization.count as any).mockResolvedValue(1);

      const result = await service.listAllOrganizations({ search: 'test' });

      expect(result.organizations).toHaveLength(1);
      expect(prisma.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.any(Object) }),
            ]),
          }),
        })
      );
    });

    it('should filter by banned status', async () => {
      (prisma.organization.findMany as any).mockResolvedValue([mockOrganizations[1]]);
      (prisma.organization.count as any).mockResolvedValue(1);

      await service.listAllOrganizations({ banned: 'true' });

      expect(prisma.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ banned: true }),
        })
      );
    });

    it('should filter by date range', async () => {
      (prisma.organization.findMany as any).mockResolvedValue(mockOrganizations);
      (prisma.organization.count as any).mockResolvedValue(2);

      await service.listAllOrganizations({
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      });

      expect(prisma.organization.findMany).toHaveBeenCalled();
    });

    it('should sort by member count', async () => {
      (prisma.organization.findMany as any).mockResolvedValue(mockOrganizations);
      (prisma.organization.count as any).mockResolvedValue(2);

      await service.listAllOrganizations({ sortBy: 'memberCount', sortOrder: 'desc' });

      expect(prisma.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { members: { _count: 'desc' } },
        })
      );
    });

    it('should support pagination', async () => {
      (prisma.organization.findMany as any).mockResolvedValue([mockOrganizations[0]]);
      (prisma.organization.count as any).mockResolvedValue(25);

      const result = await service.listAllOrganizations({ page: 2, limit: 10 });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });
  });

  describe('getOrganizationStats', () => {
    it('should return organization statistics', async () => {
      const mockOrgsWithMembers = [
        { _count: { members: 5 } },
        { _count: { members: 3 } },
      ];
      const mockAllOrgs = [
        { _count: { members: 5 } },
        { _count: { members: 3 } },
        { _count: { members: 0 } },
      ];

      (prisma.organization.count as any).mockImplementation((args?: any) => {
        if (!args?.where) return Promise.resolve(10);
        if (args.where.banned === true) return Promise.resolve(1);
        if (args.where.createdAt?.gte) return Promise.resolve(2);
        return Promise.resolve(0);
      });
      (prisma.organization.findMany as any).mockImplementation((args?: any) => {
        if (args.where?.banned === false) return Promise.resolve(mockOrgsWithMembers);
        return Promise.resolve(mockAllOrgs);
      });

      const result = await service.getOrganizationStats();

      expect(result).toEqual({
        totalOrganizations: 10,
        activeOrganizations: 9,
        bannedOrganizations: 1,
        newThisMonth: 2,
        totalMembers: 8,
        emptyOrganizations: 1,
      });
    });
  });

  describe('getOrganizationDetails', () => {
    it('should return organization details with members', async () => {
      const mockOrg = {
        id: 'org-1',
        name: 'Test Org',
        slug: 'test-org',
        members: [
          {
            user: { id: 'user-1', name: 'John Doe', email: 'john@example.com', image: null },
          },
        ],
        teams: [{ id: 'team-1', name: 'Team 1' }],
        invitations: [{ id: 'inv-1', email: 'invite@example.com', status: 'pending' }],
        _count: { members: 1, teams: 1, invitations: 1 },
      };

      (prisma.organization.findUnique as any).mockResolvedValue(mockOrg);

      const result = await service.getOrganizationDetails('org-1');

      expect(result).toHaveProperty('stats');
      expect(result?.stats).toEqual({
        memberCount: 1,
        teamCount: 1,
        pendingInvites: 1,
      });
    });

    it('should return null for non-existent organization', async () => {
      (prisma.organization.findUnique as any).mockResolvedValue(null);

      const result = await service.getOrganizationDetails('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('banOrganization', () => {
    it('should ban an organization successfully', async () => {
      const mockOrg = {
        id: 'org-1',
        name: 'Test Org',
        banned: false,
      };

      (prisma.organization.findUnique as any).mockResolvedValue(mockOrg);
      (prisma.organization.update as any).mockResolvedValue({
        ...mockOrg,
        banned: true,
        banReason: 'Violation of terms',
        bannedAt: new Date(),
      });

      const result = await service.banOrganization('org-1', 'Violation of terms');

      expect(result.success).toBe(true);
      expect(result.message).toContain('has been banned');
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: {
          banned: true,
          banReason: 'Violation of terms',
          bannedAt: expect.any(Date),
        },
      });
    });

    it('should throw error when organization not found', async () => {
      (prisma.organization.findUnique as any).mockResolvedValue(null);

      await expect(service.banOrganization('nonexistent')).rejects.toThrow('Organization not found');
    });

    it('should throw error when organization already banned', async () => {
      const mockOrg = {
        id: 'org-1',
        name: 'Test Org',
        banned: true,
      };

      (prisma.organization.findUnique as any).mockResolvedValue(mockOrg);

      await expect(service.banOrganization('org-1')).rejects.toThrow('Organization is already banned');
    });
  });

  describe('unbanOrganization', () => {
    it('should unban an organization successfully', async () => {
      const mockOrg = {
        id: 'org-1',
        name: 'Test Org',
        banned: true,
        banReason: 'Violation',
        bannedAt: new Date(),
      };

      (prisma.organization.findUnique as any).mockResolvedValue(mockOrg);
      (prisma.organization.update as any).mockResolvedValue({
        ...mockOrg,
        banned: false,
        banReason: null,
        bannedAt: null,
      });

      const result = await service.unbanOrganization('org-1');

      expect(result.success).toBe(true);
      expect(result.message).toContain('has been unbanned');
    });

    it('should throw error when organization not found', async () => {
      (prisma.organization.findUnique as any).mockResolvedValue(null);

      await expect(service.unbanOrganization('nonexistent')).rejects.toThrow('Organization not found');
    });

    it('should throw error when organization not banned', async () => {
      const mockOrg = {
        id: 'org-1',
        name: 'Test Org',
        banned: false,
      };

      (prisma.organization.findUnique as any).mockResolvedValue(mockOrg);

      await expect(service.unbanOrganization('org-1')).rejects.toThrow('Organization is not banned');
    });
  });

  describe('getOrganizationBanStatus', () => {
    it('should return ban status for organization', async () => {
      const mockOrg = {
        id: 'org-1',
        name: 'Test Org',
        banned: true,
        banReason: 'Violation',
        bannedAt: new Date('2024-01-01'),
      };

      (prisma.organization.findUnique as any).mockResolvedValue(mockOrg);

      const result = await service.getOrganizationBanStatus('org-1');

      expect(result).toEqual(mockOrg);
    });

    it('should return null for non-existent organization', async () => {
      (prisma.organization.findUnique as any).mockResolvedValue(null);

      const result = await service.getOrganizationBanStatus('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('deleteOrganization', () => {
    it('should delete organization and related records', async () => {
      const mockOrg = {
        id: 'org-1',
        name: 'Test Org',
      };

      (prisma.organization.findUnique as any).mockResolvedValue(mockOrg);
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = mockDeep<PrismaClient>();
        await callback(tx);
      });

      const result = await service.deleteOrganization('org-1');

      expect(result).toEqual(mockOrg);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw error when organization not found', async () => {
      (prisma.organization.findUnique as any).mockResolvedValue(null);

      await expect(service.deleteOrganization('nonexistent')).rejects.toThrow('Organization not found');
    });
  });

  describe('banUser', () => {
    it('should ban user successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const headers = new Headers();

      mockAuth.api.banUser.mockResolvedValue({ user: mockUser });

      const result = await service.banUser('user-1', 'Violation', headers);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(mockAuth.api.banUser).toHaveBeenCalledWith({
        body: { userId: 'user-1', banReason: 'Violation' },
        headers,
      });
    });

    it('should throw BadRequestException when headers missing', async () => {
      await expect(service.banUser('user-1', 'Violation')).rejects.toThrow(BadRequestException);
    });

    it('should throw error when Better Auth fails', async () => {
      const headers = new Headers();
      mockAuth.api.banUser.mockResolvedValue({ user: null });

      await expect(service.banUser('user-1', 'Violation', headers)).rejects.toThrow();
    });
  });

  describe('unbanUser', () => {
    it('should unban user successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const headers = new Headers();

      mockAuth.api.unbanUser.mockResolvedValue({ user: mockUser });

      const result = await service.unbanUser('user-1', headers);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it('should throw BadRequestException when headers missing', async () => {
      await expect(service.unbanUser('user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('changeUserRole', () => {
    it('should change user role successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', role: 'admin' };
      const headers = new Headers();

      mockAuth.api.setRole.mockResolvedValue({ user: mockUser });

      const result = await service.changeUserRole('user-1', 'admin', headers);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(mockAuth.api.setRole).toHaveBeenCalledWith({
        body: { userId: 'user-1', role: 'admin' },
        headers,
      });
    });

    it('should throw error for invalid role', async () => {
      const headers = new Headers();

      await expect(service.changeUserRole('user-1', 'invalid', headers)).rejects.toThrow('Invalid role');
    });

    it('should throw BadRequestException when headers missing', async () => {
      await expect(service.changeUserRole('user-1', 'admin')).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetUserPassword', () => {
    it('should reset user password successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const headers = new Headers();

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      mockAuth.api.setUserPassword.mockResolvedValue({});
      mockAuth.api.revokeUserSessions.mockResolvedValue({});

      const result = await service.resetUserPassword('user-1', headers);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Password has been reset');
    });

    it('should throw error when user not found', async () => {
      const headers = new Headers();
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(service.resetUserPassword('user-1', headers)).rejects.toThrow('User not found');
    });

    it('should throw BadRequestException when headers missing', async () => {
      await expect(service.resetUserPassword('user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('revokeUserSessions', () => {
    it('should revoke user sessions successfully', async () => {
      const headers = new Headers();
      mockAuth.api.revokeUserSessions.mockResolvedValue({ success: true });

      const result = await service.revokeUserSessions('user-1', headers);

      expect(result.success).toBe(true);
      expect(result.revokedCount).toBe(1);
    });

    it('should throw BadRequestException when headers missing', async () => {
      await expect(service.revokeUserSessions('user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
      const headers = new Headers();

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      mockAuth.api.removeUser.mockResolvedValue({});

      const result = await service.deleteUser('user-1', headers);

      expect(result).toEqual(mockUser);
      expect(mockAuth.api.removeUser).toHaveBeenCalledWith({
        body: { userId: 'user-1' },
        headers,
      });
    });

    it('should throw error when user not found', async () => {
      const headers = new Headers();
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(service.deleteUser('user-1', headers)).rejects.toThrow('User not found');
    });

    it('should throw BadRequestException when headers missing', async () => {
      await expect(service.deleteUser('user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      };
      const headers = new Headers();

      mockAuth.api.createUser.mockResolvedValue({ user: mockUser });

      const result = await service.createUser(
        { email: 'test@example.com', name: 'Test User' },
        headers
      );

      expect(result.user).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      });
      expect(result.forcePasswordChange).toBe(true);
      expect(mockAuth.api.createUser).toHaveBeenCalled();
    });

    it('should throw ConflictException when user already exists', async () => {
      const headers = new Headers();
      const error = new Error('User already exists');
      (error as any).code = 'USER_ALREADY_EXISTS';

      mockAuth.api.createUser.mockRejectedValue(error);

      await expect(
        service.createUser({ email: 'test@example.com', name: 'Test User' }, headers)
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when creation fails', async () => {
      const headers = new Headers();
      mockAuth.api.createUser.mockResolvedValue({ user: null });

      await expect(
        service.createUser({ email: 'test@example.com', name: 'Test User' }, headers)
      ).rejects.toThrow(BadRequestException);
    });

    it('should create user with admin role', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
      };
      const headers = new Headers();

      mockAuth.api.createUser.mockResolvedValue({ user: mockUser });

      const result = await service.createUser(
        { email: 'admin@example.com', name: 'Admin User', role: 'admin' },
        headers
      );

      expect(result.user.role).toBe('admin');
    });

    it('should handle generic error during user creation', async () => {
      const headers = new Headers();
      const error = new Error('Some other error');

      mockAuth.api.createUser.mockRejectedValue(error);

      await expect(
        service.createUser({ email: 'test@example.com', name: 'Test User' }, headers)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('unbanUser edge cases', () => {
    it('should throw error when Better Auth fails', async () => {
      const headers = new Headers();
      mockAuth.api.unbanUser.mockResolvedValue({ user: null });

      await expect(service.unbanUser('user-1', headers)).rejects.toThrow();
    });
  });

  describe('changeUserRole edge cases', () => {
    it('should throw error when Better Auth fails', async () => {
      const headers = new Headers();
      mockAuth.api.setRole.mockResolvedValue({ user: null });

      await expect(service.changeUserRole('user-1', 'admin', headers)).rejects.toThrow();
    });
  });

  describe('resetUserPassword edge cases', () => {
    it('should handle Better Auth failure gracefully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const headers = new Headers();

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      mockAuth.api.setUserPassword.mockRejectedValue(new Error('Auth failed'));

      await expect(service.resetUserPassword('user-1', headers)).rejects.toThrow();
    });
  });

  describe('revokeUserSessions edge cases', () => {
    it('should handle Better Auth failure', async () => {
      const headers = new Headers();
      mockAuth.api.revokeUserSessions.mockRejectedValue(new Error('Failed'));

      await expect(service.revokeUserSessions('user-1', headers)).rejects.toThrow();
    });
  });

  describe('deleteUser edge cases', () => {
    it('should handle Better Auth failure', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test' };
      const headers = new Headers();

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      mockAuth.api.removeUser.mockRejectedValue(new Error('Failed'));

      await expect(service.deleteUser('user-1', headers)).rejects.toThrow();
    });
  });

  describe('listAllOrganizations edge cases', () => {
    it('should handle sortBy name', async () => {
      (prisma.organization.findMany as any).mockResolvedValue([]);
      (prisma.organization.count as any).mockResolvedValue(0);

      await service.listAllOrganizations({ sortBy: 'name', sortOrder: 'asc' });

      expect(prisma.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });

    it('should handle sortBy createdAt', async () => {
      (prisma.organization.findMany as any).mockResolvedValue([]);
      (prisma.organization.count as any).mockResolvedValue(0);

      await service.listAllOrganizations({ sortBy: 'createdAt', sortOrder: 'desc' });

      expect(prisma.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should handle banned=false filter', async () => {
      (prisma.organization.findMany as any).mockResolvedValue([]);
      (prisma.organization.count as any).mockResolvedValue(0);

      await service.listAllOrganizations({ banned: 'false' });

      expect(prisma.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ banned: false }),
        })
      );
    });

    it('should handle only dateFrom filter', async () => {
      (prisma.organization.findMany as any).mockResolvedValue([]);
      (prisma.organization.count as any).mockResolvedValue(0);

      await service.listAllOrganizations({ dateFrom: '2024-01-01' });

      expect(prisma.organization.findMany).toHaveBeenCalled();
    });

    it('should handle only dateTo filter', async () => {
      (prisma.organization.findMany as any).mockResolvedValue([]);
      (prisma.organization.count as any).mockResolvedValue(0);

      await service.listAllOrganizations({ dateTo: '2024-01-31' });

      expect(prisma.organization.findMany).toHaveBeenCalled();
    });
  });
});
