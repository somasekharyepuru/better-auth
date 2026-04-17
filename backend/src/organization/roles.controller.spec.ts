import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { AuditService } from '../audit/audit.service';
import { OrgPermissionGuard } from '../auth/guards/org-permission.guard';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../common/prisma.service';

// Mock the auth.config before importing RolesController
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

describe('RolesController', () => {
  let controller: RolesController;
  let rolesService: any;
  let auditService: any;

  const mockSession = {
    user: { id: 'user1', email: 'test@test.com' },
    id: 'session1',
  };

  const mockRequest = {
    session: mockSession,
    ip: '127.0.0.1',
    headers: { 'user-agent': 'test-agent' },
    orgPermissions: { role: 'admin' },
  } as unknown as Request;

  beforeEach(async () => {
    rolesService = {
      getRoles: jest.fn(),
      getMembersByRole: jest.fn(),
      getValidRolesForOrganization: jest.fn(),
      validateRoleForOrganization: jest.fn(),
      createRole: jest.fn(),
      getRole: jest.fn(),
      updateRole: jest.fn(),
      deleteRole: jest.fn(),
    };

    auditService = {
      logUserAction: jest.fn(),
    };

    const mockPrisma = {
      member: {
        findUnique: jest.fn(),
      },
      organizationRole: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        { provide: RolesService, useValue: rolesService },
        { provide: AuditService, useValue: auditService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: Reflector, useValue: {} },
      ],
    })
      .overrideGuard(OrgPermissionGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<RolesController>(RolesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRoles', () => {
    it('should return all roles for an organization', async () => {
      const mockRoles = [
        {
          id: 'role1',
          organizationId: 'org1',
          role: 'custom-role',
          permission: { member: ['read'] },
        },
      ];

      rolesService.getRoles.mockResolvedValue(mockRoles);

      const result = await controller.getRoles('org1');

      expect(result).toEqual(mockRoles);
      expect(rolesService.getRoles).toHaveBeenCalledWith('org1');
    });
  });

  describe('getMembersByRole', () => {
    it('should return members grouped by role', async () => {
      const mockMembers = {
        owner: [{ id: 'user1', email: 'owner@test.com', name: 'Owner' }],
        member: [
          { id: 'user2', email: 'member@test.com', name: 'Member' },
        ],
      };

      rolesService.getMembersByRole.mockResolvedValue(mockMembers);

      const result = await controller.getMembersByRole('org1');

      expect(result).toEqual(mockMembers);
      expect(rolesService.getMembersByRole).toHaveBeenCalledWith('org1');
    });
  });

  describe('getValidRoles', () => {
    it('should return all valid roles for an organization', async () => {
      const mockValidRoles = ['owner', 'admin', 'member', 'manager', 'viewer', 'custom-dev'];

      rolesService.getValidRolesForOrganization.mockResolvedValue(mockValidRoles);

      const result = await controller.getValidRoles('org1');

      expect(result).toEqual(mockValidRoles);
      expect(rolesService.getValidRolesForOrganization).toHaveBeenCalledWith('org1');
    });
  });

  describe('validateRole', () => {
    it('should validate a role for an organization', async () => {
      rolesService.validateRoleForOrganization.mockResolvedValue(true);

      const result = await controller.validateRole('org1', { role: 'custom-role' });

      expect(result).toBe(true);
      expect(rolesService.validateRoleForOrganization).toHaveBeenCalledWith('org1', 'custom-role');
    });
  });

  describe('createRole', () => {
    it('should create a new role and log audit', async () => {
      const newRoleData = {
        role: 'developer',
        permissions: { member: ['read', 'update'] },
      };

      const createdRole = {
        id: 'role1',
        organizationId: 'org1',
        role: 'developer',
        permission: JSON.stringify(newRoleData.permissions),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      rolesService.createRole.mockResolvedValue(createdRole);
      auditService.logUserAction.mockResolvedValue(undefined);

      const result = await controller.createRole('org1', newRoleData, mockRequest);

      expect(result).toEqual(createdRole);
      expect(rolesService.createRole).toHaveBeenCalledWith(
        'org1',
        'developer',
        newRoleData.permissions,
        'admin'
      );
      expect(auditService.logUserAction).toHaveBeenCalledWith(
        'user1',
        'organization.role.created',
        {
          organizationId: 'org1',
          roleName: 'developer',
          permissionCount: 2,
        },
        'session1',
        '127.0.0.1',
        'test-agent'
      );
    });

    it('should handle creation without requester role', async () => {
      const newRoleData = {
        role: 'developer',
        permissions: { member: ['read'] },
      };

      const createdRole = {
        id: 'role1',
        organizationId: 'org1',
        role: 'developer',
        permission: JSON.stringify(newRoleData.permissions),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const requestWithoutOrgPerms = { ...mockRequest, orgPermissions: undefined } as any;

      rolesService.createRole.mockResolvedValue(createdRole);
      auditService.logUserAction.mockResolvedValue(undefined);

      await controller.createRole('org1', newRoleData, requestWithoutOrgPerms);

      expect(rolesService.createRole).toHaveBeenCalledWith(
        'org1',
        'developer',
        newRoleData.permissions,
        undefined
      );
    });

    it('should handle audit logging without session', async () => {
      const newRoleData = {
        role: 'developer',
        permissions: { member: ['read'] },
      };

      const createdRole = {
        id: 'role1',
        organizationId: 'org1',
        role: 'developer',
        permission: JSON.stringify(newRoleData.permissions),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const requestWithoutSession = {
        ...mockRequest,
        session: undefined,
      } as any;

      rolesService.createRole.mockResolvedValue(createdRole);
      auditService.logUserAction.mockResolvedValue(undefined);

      await controller.createRole('org1', newRoleData, requestWithoutSession);

      expect(auditService.logUserAction).toHaveBeenCalledWith(
        'system',
        expect.any(String),
        expect.any(Object),
        undefined,
        '127.0.0.1',
        'test-agent'
      );
    });
  });

  describe('getRole', () => {
    it('should return a single role', async () => {
      const mockRole = {
        id: 'role1',
        organizationId: 'org1',
        role: 'custom-role',
        permission: { organization: ['update'] },
      };

      rolesService.getRole.mockResolvedValue(mockRole);

      const result = await controller.getRole('org1', 'role1');

      expect(result).toEqual(mockRole);
      expect(rolesService.getRole).toHaveBeenCalledWith('org1', 'role1');
    });
  });

  describe('updateRole', () => {
    it('should update role permissions and log audit', async () => {
      const updateData = {
        permissions: { member: ['read', 'update', 'delete'] },
      };

      const updatedRole = {
        id: 'role1',
        organizationId: 'org1',
        role: 'custom-role',
        permission: JSON.stringify(updateData.permissions),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      rolesService.updateRole.mockResolvedValue(updatedRole);
      auditService.logUserAction.mockResolvedValue(undefined);

      const result = await controller.updateRole('org1', 'role1', updateData, mockRequest);

      expect(result).toEqual(updatedRole);
      expect(rolesService.updateRole).toHaveBeenCalledWith(
        'org1',
        'role1',
        updateData.permissions,
        'admin'
      );
      expect(auditService.logUserAction).toHaveBeenCalledWith(
        'user1',
        'organization.role.updated',
        {
          organizationId: 'org1',
          roleId: 'role1',
          permissionCount: 3,
        },
        'session1',
        '127.0.0.1',
        'test-agent'
      );
    });

    it('should handle update without requester role', async () => {
      const updateData = {
        permissions: { member: ['read'] },
      };

      const updatedRole = {
        id: 'role1',
        organizationId: 'org1',
        role: 'custom-role',
        permission: JSON.stringify(updateData.permissions),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const requestWithoutOrgPerms = { ...mockRequest, orgPermissions: undefined } as any;

      rolesService.updateRole.mockResolvedValue(updatedRole);
      auditService.logUserAction.mockResolvedValue(undefined);

      await controller.updateRole('org1', 'role1', updateData, requestWithoutOrgPerms);

      expect(rolesService.updateRole).toHaveBeenCalledWith(
        'org1',
        'role1',
        updateData.permissions,
        undefined
      );
    });
  });

  describe('deleteRole', () => {
    it('should delete a role and log audit', async () => {
      const deletedRole = {
        id: 'role1',
        organizationId: 'org1',
        role: 'custom-role',
        permission: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      rolesService.deleteRole.mockResolvedValue(deletedRole);
      auditService.logUserAction.mockResolvedValue(undefined);

      const result = await controller.deleteRole('org1', 'role1', mockRequest);

      expect(result).toEqual(deletedRole);
      expect(rolesService.deleteRole).toHaveBeenCalledWith('org1', 'role1');
      expect(auditService.logUserAction).toHaveBeenCalledWith(
        'user1',
        'organization.role.deleted',
        {
          organizationId: 'org1',
          roleId: 'role1',
        },
        'session1',
        '127.0.0.1',
        'test-agent'
      );
    });
  });
});
