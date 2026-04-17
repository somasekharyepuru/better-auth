// Mock AdminService before importing
jest.mock('./admin.service', () => ({
  AdminService: jest.fn().mockImplementation(() => ({
    getDashboardStats: jest.fn().mockResolvedValue({ users: 100, orgs: 50 }),
    getUserStats: jest.fn().mockResolvedValue({ total: 100, active: 80 }),
    getOrganizationStats: jest.fn().mockResolvedValue({ total: 50, active: 40 }),
    createUser: jest.fn().mockResolvedValue({ user: { id: 'user-1', email: 'test@example.com', role: 'member' } }),
    listAllOrganizations: jest.fn().mockResolvedValue([]),
    getOrganizationDetails: jest.fn().mockResolvedValue({ id: 'org-1', name: 'Test Org' }),
    banOrganization: jest.fn().mockResolvedValue({ id: 'org-1', isBanned: true }),
    unbanOrganization: jest.fn().mockResolvedValue({ id: 'org-1', isBanned: false }),
    deleteOrganization: jest.fn().mockResolvedValue({ id: 'org-1', name: 'Test Org' }),
    banUser: jest.fn().mockResolvedValue({ success: true }),
    unbanUser: jest.fn().mockResolvedValue({ success: true }),
    changeUserRole: jest.fn().mockResolvedValue({ success: true }),
    resetUserPassword: jest.fn().mockResolvedValue({ success: true }),
    revokeUserSessions: jest.fn().mockResolvedValue({ success: true }),
    deleteUser: jest.fn().mockResolvedValue({ success: true }),
    getOrganizationBanStatus: jest.fn().mockResolvedValue({ isBanned: false }),
  })),
}));

// Mock audit service
jest.mock('../audit/audit.service', () => ({
  auditService: {
    logAdminAction: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock better-auth fromNodeHeaders
jest.mock('better-auth/node', () => ({
  fromNodeHeaders: jest.fn((headers) => headers),
}));

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { auditService } from '../audit/audit.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('AdminController', () => {
  let controller: AdminController;
  let mockAdminService: any;

  const createAdminSession = (overrides: any = {}) => ({
    user: { id: 'admin-1', role: 'admin' },
    session: { id: 'session-1' },
    ...overrides,
  });

  const createOwnerSession = () => ({
    user: { id: 'owner-1', role: 'owner' },
    session: { id: 'session-1' },
  });

  const createMemberSession = () => ({
    user: { id: 'user-1', role: 'member' },
    session: { id: 'session-1' },
  });

  const createNoRoleSession = () => ({
    user: { id: 'user-1' },
    session: { id: 'session-1' },
  });

  const createUnauthenticatedSession = () => ({} as any);

  const createMockRequest = (overrides: any = {}) => ({
    headers: {
      'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      'user-agent': 'Mozilla/5.0',
    },
    ...overrides,
  });

  beforeEach(() => {
    const { AdminService } = require('./admin.service');
    mockAdminService = new AdminService();
    controller = new AdminController(mockAdminService);
    jest.clearAllMocks();
  });

  describe('AdminGuard protection', () => {
    it('should have AdminGuard applied at class level', () => {
      const guards = Reflect.getMetadata('__guards__', AdminController);
      expect(guards).toBeDefined();
      // Import AdminGuard at the top of the file
      const { AdminGuard } = require('./admin.guard');
      expect(guards).toContainEqual(AdminGuard);
    });

    it('should allow access to admin users for getDashboardStats', async () => {
      const session = createAdminSession() as any;

      await expect(controller.getDashboardStats()).resolves.toBeDefined();
    });

    it('should allow access to owner users for getUserStats', async () => {
      const session = createOwnerSession() as any;

      await expect(controller.getUserStats()).resolves.toBeDefined();
    });
  });


  describe('getDashboardStats', () => {
    it('should return dashboard stats', async () => {
      const session = createAdminSession() as any;
      mockAdminService.getDashboardStats.mockResolvedValue({ users: 100, orgs: 50 });

      const result = await controller.getDashboardStats();

      expect(result).toEqual({ users: 100, orgs: 50 });
      expect(mockAdminService.getDashboardStats).toHaveBeenCalled();
    });
  });

  describe('getUserStats', () => {
    it('should return user stats', async () => {
      const session = createAdminSession() as any;
      mockAdminService.getUserStats.mockResolvedValue({ total: 100, active: 80 });

      const result = await controller.getUserStats();

      expect(result).toEqual({ total: 100, active: 80 });
      expect(mockAdminService.getUserStats).toHaveBeenCalled();
    });
  });

  describe('getOrganizationStats', () => {
    it('should return organization stats', async () => {
      const session = createAdminSession() as any;
      mockAdminService.getOrganizationStats.mockResolvedValue({ total: 50, active: 40 });

      const result = await controller.getOrganizationStats();

      expect(result).toEqual({ total: 50, active: 40 });
      expect(mockAdminService.getOrganizationStats).toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    it('should create user and log action', async () => {
      const session = createAdminSession() as any;
      const req = createMockRequest();
      const body = { email: 'test@example.com', name: 'Test User', role: 'member', forcePasswordChange: true };

      mockAdminService.createUser.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', role: 'member' }
      });

      const result = await controller.createUser(session, body, req);

      expect(mockAdminService.createUser).toHaveBeenCalledWith(body, req.headers);
      expect(auditService.logAdminAction).toHaveBeenCalledWith(
        'admin-1',
        'admin.user.created',
        expect.objectContaining({
          targetUserId: 'user-1',
          email: 'test@example.com',
          role: 'member',
          forcePasswordChange: true,
        }),
        'session-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );
      expect(result).toHaveProperty('user');
    });

    it('should extract IP from x-real-ip when x-forwarded-for not present', async () => {
      const session = createAdminSession() as any;
      const req = createMockRequest({
        headers: { 'x-real-ip': '10.0.0.2', 'user-agent': 'TestAgent' },
      });
      const body = { email: 'test@example.com', name: 'Test User' };

      await controller.createUser(session, body, req);

      expect(auditService.logAdminAction).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        expect.any(String),
        '10.0.0.2',
        'TestAgent'
      );
    });
  });

  describe('listAllOrganizations', () => {
    it('should list all organizations with default pagination', async () => {
      const session = createAdminSession() as any;
      mockAdminService.listAllOrganizations.mockResolvedValue([]);

      await controller.listAllOrganizations(session);

      expect(mockAdminService.listAllOrganizations).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
        search: undefined,
        banned: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      });
    });

    it('should parse query parameters correctly', async () => {
      const session = createAdminSession() as any;

      await controller.listAllOrganizations(
        session,
        '2',      // page
        '25',     // limit
        'test',   // search
        'false',  // banned
        '2024-01-01', // dateFrom
        '2024-12-31', // dateTo
        'name',   // sortBy
        'asc'     // sortOrder
      );

      expect(mockAdminService.listAllOrganizations).toHaveBeenCalledWith({
        page: 2,
        limit: 25,
        search: 'test',
        banned: 'false',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        sortBy: 'name',
        sortOrder: 'asc',
      });
    });
  });

  describe('getOrganization', () => {
    it('should return organization details', async () => {
      const session = createAdminSession() as any;
      mockAdminService.getOrganizationDetails.mockResolvedValue({
        id: 'org-1',
        name: 'Test Org',
      });

      const result = await controller.getOrganization(session, 'org-1');

      expect(result).toEqual({ id: 'org-1', name: 'Test Org' });
      expect(mockAdminService.getOrganizationDetails).toHaveBeenCalledWith('org-1');
    });

    it('should throw NotFoundException when org not found', async () => {
      const session = createAdminSession() as any;
      mockAdminService.getOrganizationDetails.mockResolvedValue(null);

      await expect(controller.getOrganization(session, 'nonexistent')).rejects.toThrow(
        new NotFoundException('Organization not found')
      );
    });
  });

  describe('banOrganization', () => {
    it('should ban organization and log action', async () => {
      const session = createAdminSession() as any;
      const req = createMockRequest();
      mockAdminService.banOrganization.mockResolvedValue({ id: 'org-1', isBanned: true });

      const result = await controller.banOrganization(session, 'org-1', { reason: 'Violations' }, req);

      expect(mockAdminService.banOrganization).toHaveBeenCalledWith('org-1', 'Violations');
      expect(auditService.logAdminAction).toHaveBeenCalledWith(
        'admin-1',
        'admin.organization.banned',
        expect.objectContaining({
          organizationId: 'org-1',
          reason: 'Violations',
        }),
        'session-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );
      expect(result).toHaveProperty('id');
    });

    it('should handle missing reason', async () => {
      const session = createAdminSession() as any;
      const req = createMockRequest();
      mockAdminService.banOrganization.mockResolvedValue({ id: 'org-1', isBanned: true });

      await controller.banOrganization(session, 'org-1', {}, req);

      expect(auditService.logAdminAction).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          reason: 'Banned by administrator',
        }),
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
    });

    it('should wrap errors in BadRequestException', async () => {
      const session = createAdminSession() as any;
      const req = createMockRequest();
      mockAdminService.banOrganization.mockRejectedValue(new Error('Organization not found'));

      await expect(controller.banOrganization(session, 'org-1', {}, req)).rejects.toThrow(
        new BadRequestException('Organization not found')
      );
    });
  });

  describe('unbanOrganization', () => {
    it('should unban organization and log action', async () => {
      const session = createAdminSession() as any;
      const req = createMockRequest();
      mockAdminService.unbanOrganization.mockResolvedValue({ id: 'org-1', isBanned: false });

      const result = await controller.unbanOrganization(session, 'org-1', req);

      expect(mockAdminService.unbanOrganization).toHaveBeenCalledWith('org-1');
      expect(auditService.logAdminAction).toHaveBeenCalledWith(
        'admin-1',
        'admin.organization.unbanned',
        expect.objectContaining({ organizationId: 'org-1' }),
        'session-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );
      expect(result).toHaveProperty('id');
    });

    it('should wrap errors in BadRequestException', async () => {
      const session = createAdminSession() as any;
      const req = createMockRequest();
      mockAdminService.unbanOrganization.mockRejectedValue(new Error('Failed to unban'));

      await expect(controller.unbanOrganization(session, 'org-1', req)).rejects.toThrow(
        new BadRequestException('Failed to unban')
      );
    });
  });

  describe('deleteOrganization', () => {
    it('should delete organization and log action', async () => {
      const session = createAdminSession() as any;
      const req = createMockRequest();
      mockAdminService.deleteOrganization.mockResolvedValue({ id: 'org-1', name: 'Test Org' });

      const result = await controller.deleteOrganization(session, 'org-1', req);

      expect(mockAdminService.deleteOrganization).toHaveBeenCalledWith('org-1');
      expect(auditService.logAdminAction).toHaveBeenCalledWith(
        'admin-1',
        'admin.organization.deleted',
        expect.objectContaining({
          organizationId: 'org-1',
          organizationName: 'Test Org',
        }),
        'session-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );
      expect(result).toEqual({ success: true, message: 'Organization deleted' });
    });

    it('should wrap errors in BadRequestException', async () => {
      const session = createAdminSession() as any;
      const req = createMockRequest();
      mockAdminService.deleteOrganization.mockRejectedValue(new Error('Cannot delete'));

      await expect(controller.deleteOrganization(session, 'org-1', req)).rejects.toThrow(
        new BadRequestException('Cannot delete')
      );
    });
  });

  describe('banUser', () => {
    it('should ban user and log action', async () => {
      const session = createAdminSession() as any;
      const req = createMockRequest();
      mockAdminService.banUser.mockResolvedValue({ success: true });

      const result = await controller.banUser(session, 'user-2', { reason: 'Abuse' }, req);

      expect(mockAdminService.banUser).toHaveBeenCalledWith('user-2', 'Abuse', req.headers);
      expect(auditService.logAdminAction).toHaveBeenCalledWith(
        'admin-1',
        'admin.user.ban',
        expect.objectContaining({
          targetUserId: 'user-2',
          reason: 'Abuse',
        }),
        'session-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );
      expect(result).toHaveProperty('success');
    });

    it('should throw ForbiddenException when trying to ban self', async () => {
      const session = createAdminSession() as any;
      const req = createMockRequest();

      await expect(controller.banUser(session, 'admin-1', {}, req)).rejects.toThrow(
        new ForbiddenException('You cannot ban yourself')
      );
    });

    it('should wrap errors in BadRequestException', async () => {
      const session = createAdminSession() as any;
      const req = createMockRequest();
      mockAdminService.banUser.mockRejectedValue(new Error('Ban failed'));

      await expect(controller.banUser(session, 'user-2', {}, req)).rejects.toThrow(
        new BadRequestException('Ban failed')
      );
    });
  });

  describe('unbanUser', () => {
    it('should unban user and log action', async () => {
      const session = createAdminSession() as any;
      const req = createMockRequest();
      mockAdminService.unbanUser.mockResolvedValue({ success: true });

      const result = await controller.unbanUser(session, 'user-2', req);

      expect(mockAdminService.unbanUser).toHaveBeenCalledWith('user-2', req.headers);
      expect(auditService.logAdminAction).toHaveBeenCalledWith(
        'admin-1',
        'admin.user.unban',
        expect.objectContaining({ targetUserId: 'user-2' }),
        'session-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );
      expect(result).toHaveProperty('success');
    });

    it('should throw ForbiddenException when trying to unban self', async () => {
      const session = createAdminSession() as any;
      const req = createMockRequest();

      await expect(controller.unbanUser(session, 'admin-1', req)).rejects.toThrow(
        new ForbiddenException('You cannot unban yourself')
      );
    });
  });

  describe('changeUserRole', () => {
    it('should change user role and log action', async () => {
      const session = createAdminSession() as any;
      const req = createMockRequest();
      mockAdminService.changeUserRole.mockResolvedValue({ success: true });

      const result = await controller.changeUserRole(session, 'user-2', { role: 'admin' }, req);

      expect(mockAdminService.changeUserRole).toHaveBeenCalledWith('user-2', 'admin', req.headers);
      expect(auditService.logAdminAction).toHaveBeenCalledWith(
        'admin-1',
        'admin.user.role.changed',
        expect.objectContaining({
          targetUserId: 'user-2',
          newRole: 'admin',
        }),
        'session-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );
      expect(result).toHaveProperty('success');
    });

    it('should throw ForbiddenException when trying to change own role', async () => {
      const session = createAdminSession() as any;
      const req = createMockRequest();

      await expect(controller.changeUserRole(session, 'admin-1', { role: 'member' }, req)).rejects.toThrow(
        new ForbiddenException('You cannot change the role of yourself')
      );
    });
  });

  describe('resetUserPassword', () => {
    it('should reset user password and log action', async () => {
      const session = createAdminSession() as any;
      const req = createMockRequest();
      mockAdminService.resetUserPassword.mockResolvedValue({ success: true });

      const result = await controller.resetUserPassword(session, 'user-2', req);

      expect(mockAdminService.resetUserPassword).toHaveBeenCalledWith('user-2', req.headers);
      expect(auditService.logAdminAction).toHaveBeenCalledWith(
        'admin-1',
        'admin.user.password.reset',
        expect.objectContaining({ targetUserId: 'user-2' }),
        'session-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );
      expect(result).toHaveProperty('success');
    });
  });

  describe('revokeUserSessions', () => {
    it('should revoke user sessions and log action', async () => {
      const session = createAdminSession() as any;
      const req = createMockRequest();
      mockAdminService.revokeUserSessions.mockResolvedValue({ success: true });

      const result = await controller.revokeUserSessions(session, 'user-2', req);

      expect(mockAdminService.revokeUserSessions).toHaveBeenCalledWith('user-2', req.headers);
      expect(auditService.logAdminAction).toHaveBeenCalledWith(
        'admin-1',
        'admin.session.revoke.all',
        expect.objectContaining({ targetUserId: 'user-2' }),
        'session-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );
      expect(result).toHaveProperty('success');
    });

    it('should throw ForbiddenException when trying to revoke own sessions', async () => {
      const session = createAdminSession() as any;
      const req = createMockRequest();

      await expect(controller.revokeUserSessions(session, 'admin-1', req)).rejects.toThrow(
        new ForbiddenException('You cannot revoke sessions of yourself')
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user and log action', async () => {
      const session = createAdminSession() as any;
      const req = createMockRequest();
      mockAdminService.deleteUser.mockResolvedValue({ success: true });

      const result = await controller.deleteUser(session, 'user-2', req);

      expect(mockAdminService.deleteUser).toHaveBeenCalledWith('user-2', req.headers);
      expect(auditService.logAdminAction).toHaveBeenCalledWith(
        'admin-1',
        'admin.user.deleted',
        expect.objectContaining({ targetUserId: 'user-2' }),
        'session-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );
      expect(result).toEqual({ success: true, message: 'User deleted' });
    });

    it('should throw ForbiddenException when trying to delete self', async () => {
      const session = createAdminSession() as any;
      const req = createMockRequest();

      await expect(controller.deleteUser(session, 'admin-1', req)).rejects.toThrow(
        new ForbiddenException('You cannot delete yourself')
      );
    });
  });

  describe('getOrganizationBanStatus', () => {
    it('should return organization ban status', async () => {
      const session = createAdminSession() as any;
      mockAdminService.getOrganizationBanStatus.mockResolvedValue({ isBanned: false, reason: null });

      const result = await controller.getOrganizationBanStatus(session, 'org-1');

      expect(result).toEqual({ isBanned: false, reason: null });
      expect(mockAdminService.getOrganizationBanStatus).toHaveBeenCalledWith('org-1');
    });

    it('should throw NotFoundException when org not found', async () => {
      const session = createAdminSession() as any;
      mockAdminService.getOrganizationBanStatus.mockResolvedValue(null);

      await expect(controller.getOrganizationBanStatus(session, 'nonexistent')).rejects.toThrow(
        new NotFoundException('Organization not found')
      );
    });
  });
});
