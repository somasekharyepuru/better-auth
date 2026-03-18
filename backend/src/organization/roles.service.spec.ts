import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { PrismaService } from '../common/prisma.service';
import { OrgPermissionGuard } from '../auth/guards/org-permission.guard';

// Mock the auth.config before importing RolesService
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
    authorize: jest.fn((perms: any) => {
      const hasAccess = Object.entries(perms).every(([resource, actions]: [string, any]) => {
        if (resource === 'organization') return (actions as string[]).every((a: string) => a === 'update');
        if (resource === 'member') return (actions as string[]).every((a: string) => ['read', 'update'].includes(a));
        if (resource === 'invitation') return (actions as string[]).every((a: string) => ['read', 'cancel'].includes(a));
        if (resource === 'team') return (actions as string[]).every((a: string) => ['read', 'update'].includes(a));
        return false;
      });
      return { success: hasAccess };
    }),
  },
  member: {
    authorize: jest.fn().mockReturnValue({ success: false }),
  },
  viewer: {
    authorize: jest.fn().mockReturnValue({ success: false }),
  },
}));

describe('RolesService', () => {
  let service: RolesService;
  let prisma: any;
  let permissionGuard: any;

  beforeEach(async () => {
    prisma = {
      organizationRole: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      member: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    permissionGuard = {
      invalidateRoleCache: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: PrismaService, useValue: prisma },
        { provide: OrgPermissionGuard, useValue: permissionGuard },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRoles', () => {
    it('should return roles with parsed permissions', async () => {
      const mockRoles = [
        {
          id: 'role1',
          organizationId: 'org1',
          role: 'custom-role',
          permission: JSON.stringify({ organization: ['update'] }),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.organizationRole.findMany.mockResolvedValue(mockRoles);

      const result = await service.getRoles('org1');

      expect(result).toEqual([
        {
          ...mockRoles[0],
          permission: { organization: ['update'] },
        },
      ]);
      expect(prisma.organizationRole.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org1' },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should return empty array when no roles exist', async () => {
      prisma.organizationRole.findMany.mockResolvedValue([]);

      const result = await service.getRoles('org1');

      expect(result).toEqual([]);
    });
  });

  describe('getRole', () => {
    it('should return a single role with parsed permissions', async () => {
      const mockRole = {
        id: 'role1',
        organizationId: 'org1',
        role: 'custom-role',
        permission: JSON.stringify({ member: ['read'] }),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.organizationRole.findFirst.mockResolvedValue(mockRole);

      const result = await service.getRole('org1', 'role1');

      expect(result).toEqual({
        ...mockRole,
        permission: { member: ['read'] },
      });
      expect(prisma.organizationRole.findFirst).toHaveBeenCalledWith({
        where: { id: 'role1', organizationId: 'org1' },
      });
    });

    it('should throw NotFoundException when role not found', async () => {
      prisma.organizationRole.findFirst.mockResolvedValue(null);

      await expect(service.getRole('org1', 'role1')).rejects.toThrow(
        new NotFoundException('Role not found')
      );
    });
  });

  describe('createRole', () => {
    const mockPermissions = { member: ['read', 'update'] };

    it('should create a custom role successfully', async () => {
      const newRole = {
        id: 'role1',
        organizationId: 'org1',
        role: 'custom-role',
        permission: JSON.stringify(mockPermissions),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.organizationRole.findUnique.mockResolvedValue(null);
      prisma.organizationRole.create.mockResolvedValue(newRole);

      const result = await service.createRole('org1', 'custom-role', mockPermissions);

      expect(result).toEqual(newRole);
      expect(prisma.organizationRole.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org1',
          role: 'custom-role',
          permission: JSON.stringify(mockPermissions),
        },
      });
    });

    it('should throw ForbiddenException when creating reserved role', async () => {
      await expect(
        service.createRole('org1', 'owner', mockPermissions)
      ).rejects.toThrow(new ForbiddenException('Cannot create reserved role names'));

      await expect(
        service.createRole('org1', 'admin', mockPermissions)
      ).rejects.toThrow(new ForbiddenException('Cannot create reserved role names'));

      await expect(
        service.createRole('org1', 'member', mockPermissions)
      ).rejects.toThrow(new ForbiddenException('Cannot create reserved role names'));

      await expect(
        service.createRole('org1', 'manager', mockPermissions)
      ).rejects.toThrow(new ForbiddenException('Cannot create reserved role names'));

      await expect(
        service.createRole('org1', 'viewer', mockPermissions)
      ).rejects.toThrow(new ForbiddenException('Cannot create reserved role names'));
    });

    it('should throw BadRequestException for invalid permissions', async () => {
      const invalidPermissions = { invalidResource: ['invalidAction'] };

      await expect(
        service.createRole('org1', 'custom-role', invalidPermissions)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when role already exists', async () => {
      const existingRole = {
        id: 'existing',
        organizationId: 'org1',
        role: 'custom-role',
        permission: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.organizationRole.findUnique.mockResolvedValue(existingRole);

      await expect(
        service.createRole('org1', 'custom-role', mockPermissions)
      ).rejects.toThrow(new ForbiddenException('Role already exists'));
    });

    it('should validate permission ceiling for default role requester', async () => {
      const limitedPermissions = { organization: ['delete'] };

      prisma.organizationRole.findUnique.mockResolvedValue(null);

      const newRole = {
        id: 'role1',
        organizationId: 'org1',
        role: 'custom-role',
        permission: JSON.stringify(limitedPermissions),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.organizationRole.create.mockResolvedValue(newRole);

      await expect(
        service.createRole('org1', 'custom-role', limitedPermissions, 'member')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should validate permission ceiling for custom role requester', async () => {
      const customRoleWithLimitedPerms = {
        id: 'custom',
        organizationId: 'org1',
        role: 'limited-custom',
        permission: JSON.stringify({ member: ['read'] }),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.organizationRole.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(customRoleWithLimitedPerms);

      await expect(
        service.createRole('org1', 'new-custom', { member: ['update', 'delete'] }, 'limited-custom')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateRole', () => {
    const mockPermissions = { organization: ['update'], member: ['read'] };

    it('should update role permissions successfully', async () => {
      const existingRole = {
        id: 'role1',
        organizationId: 'org1',
        role: 'custom-role',
        permission: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedRole = {
        ...existingRole,
        permission: JSON.stringify(mockPermissions),
        updatedAt: new Date(),
      };

      prisma.organizationRole.findFirst.mockResolvedValue(existingRole);
      prisma.organizationRole.update.mockResolvedValue(updatedRole);

      const result = await service.updateRole('org1', 'role1', mockPermissions);

      expect(result).toEqual(updatedRole);
      expect(prisma.organizationRole.update).toHaveBeenCalledWith({
        where: { id: 'role1' },
        data: {
          permission: JSON.stringify(mockPermissions),
          updatedAt: expect.any(Date),
        },
      });
      expect(permissionGuard.invalidateRoleCache).toHaveBeenCalledWith('org1', 'custom-role');
    });

    it('should throw NotFoundException when role not found', async () => {
      prisma.organizationRole.findFirst.mockResolvedValue(null);

      await expect(
        service.updateRole('org1', 'role1', mockPermissions)
      ).rejects.toThrow(new NotFoundException('Role not found'));
    });

    it('should throw ForbiddenException when modifying reserved role', async () => {
      const reservedRole = {
        id: 'role1',
        organizationId: 'org1',
        role: 'owner',
        permission: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.organizationRole.findFirst.mockResolvedValue(reservedRole);

      await expect(
        service.updateRole('org1', 'role1', mockPermissions)
      ).rejects.toThrow(new ForbiddenException('Cannot modify reserved roles'));
    });

    it('should throw BadRequestException for invalid permissions', async () => {
      const existingRole = {
        id: 'role1',
        organizationId: 'org1',
        role: 'custom-role',
        permission: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.organizationRole.findFirst.mockResolvedValue(existingRole);

      await expect(
        service.updateRole('org1', 'role1', { invalid: ['action'] })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteRole', () => {
    it('should delete role successfully', async () => {
      const existingRole = {
        id: 'role1',
        organizationId: 'org1',
        role: 'custom-role',
        permission: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.organizationRole.findFirst.mockResolvedValue(existingRole);
      prisma.member.count.mockResolvedValue(0);
      prisma.organizationRole.delete.mockResolvedValue(existingRole);

      const result = await service.deleteRole('org1', 'role1');

      expect(result).toEqual(existingRole);
      expect(prisma.organizationRole.delete).toHaveBeenCalledWith({
        where: { id: 'role1' },
      });
      expect(permissionGuard.invalidateRoleCache).toHaveBeenCalledWith('org1', 'custom-role');
    });

    it('should throw NotFoundException when role not found', async () => {
      prisma.organizationRole.findFirst.mockResolvedValue(null);

      await expect(service.deleteRole('org1', 'role1')).rejects.toThrow(
        new NotFoundException('Role not found')
      );
    });

    it('should throw ForbiddenException when deleting reserved role', async () => {
      const reservedRole = {
        id: 'role1',
        organizationId: 'org1',
        role: 'admin',
        permission: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.organizationRole.findFirst.mockResolvedValue(reservedRole);

      await expect(service.deleteRole('org1', 'role1')).rejects.toThrow(
        new ForbiddenException('Cannot delete reserved roles')
      );
    });

    it('should throw ForbiddenException when role has assigned members', async () => {
      const roleWithMembers = {
        id: 'role1',
        organizationId: 'org1',
        role: 'custom-role',
        permission: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.organizationRole.findFirst.mockResolvedValue(roleWithMembers);
      prisma.member.count.mockResolvedValue(5);

      await expect(service.deleteRole('org1', 'role1')).rejects.toThrow(
        new ForbiddenException('Cannot delete role with assigned members')
      );
    });
  });

  describe('getMembersByRole', () => {
    it('should return members grouped by role', async () => {
      const mockMembers = [
        {
          role: 'owner',
          user: { id: 'user1', email: 'owner@test.com', name: 'Owner User' },
        },
        {
          role: 'member',
          user: { id: 'user2', email: 'member1@test.com', name: 'Member One' },
        },
        {
          role: 'member',
          user: { id: 'user3', email: 'member2@test.com', name: 'Member Two' },
        },
      ];

      prisma.member.findMany.mockResolvedValue(mockMembers);

      const result = await service.getMembersByRole('org1');

      expect(result).toEqual({
        owner: [{ id: 'user1', email: 'owner@test.com', name: 'Owner User' }],
        member: [
          { id: 'user2', email: 'member1@test.com', name: 'Member One' },
          { id: 'user3', email: 'member2@test.com', name: 'Member Two' },
        ],
      });
      expect(prisma.member.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org1' },
        select: {
          role: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should return empty object when no members exist', async () => {
      prisma.member.findMany.mockResolvedValue([]);

      const result = await service.getMembersByRole('org1');

      expect(result).toEqual({});
    });
  });

  describe('validateRoleForOrganization', () => {
    it('should return true for reserved roles', async () => {
      const result = await service.validateRoleForOrganization('org1', 'owner');
      expect(result).toBe(true);

      const result2 = await service.validateRoleForOrganization('org1', 'admin');
      expect(result2).toBe(true);

      const result3 = await service.validateRoleForOrganization('org1', 'member');
      expect(result3).toBe(true);

      const result4 = await service.validateRoleForOrganization('org1', 'manager');
      expect(result4).toBe(true);

      const result5 = await service.validateRoleForOrganization('org1', 'viewer');
      expect(result5).toBe(true);
    });

    it('should return true for existing custom roles', async () => {
      const customRole = {
        id: 'role1',
        organizationId: 'org1',
        role: 'custom-developer',
        permission: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.organizationRole.findUnique.mockResolvedValue(customRole);

      const result = await service.validateRoleForOrganization('org1', 'custom-developer');

      expect(result).toBe(true);
    });

    it('should throw BadRequestException for invalid role name format', async () => {
      await expect(
        service.validateRoleForOrganization('org1', 'invalid@role!')
      ).rejects.toThrow(new BadRequestException('Invalid role name format: "invalid@role!"'));
    });

    it('should throw BadRequestException for non-existent custom role', async () => {
      prisma.organizationRole.findUnique.mockResolvedValue(null);

      await expect(
        service.validateRoleForOrganization('org1', 'non-existent-role')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getValidRolesForOrganization', () => {
    it('should return reserved roles plus custom roles', async () => {
      const customRoles = [
        { role: 'developer' },
        { role: 'designer' },
      ];

      prisma.organizationRole.findMany.mockResolvedValue(customRoles);

      const result = await service.getValidRolesForOrganization('org1');

      expect(result).toEqual([
        'owner',
        'admin',
        'member',
        'manager',
        'viewer',
        'developer',
        'designer',
      ]);
    });

    it('should return only reserved roles when no custom roles exist', async () => {
      prisma.organizationRole.findMany.mockResolvedValue([]);

      const result = await service.getValidRolesForOrganization('org1');

      expect(result).toEqual(['owner', 'admin', 'member', 'manager', 'viewer']);
    });
  });
});
