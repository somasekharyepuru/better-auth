import { BadRequestException, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrgPermissionGuard } from './org-permission.guard';
import { PrismaService } from '../../common/prisma.service';
import { PERMISSIONS_METADATA_KEY } from '../decorators';

jest.mock('../auth.config', () => ({
  betterAuth: jest.fn(),
  prismaAdapter: jest.fn(),
  emailOTP: jest.fn(),
  admin: jest.fn(),
  twoFactor: jest.fn(),
  organization: jest.fn(),
  haveIBeenPwned: jest.fn(),
  owner: {
    authorize: jest.fn((perms) => {
      const hasAccess = Object.entries(perms).every(([resource, actions]) => {
        if (resource === 'organization') return (actions as string[]).every((a) => ['delete', 'update', 'read'].includes(a));
        if (resource === 'member') return true;
        if (resource === 'team') return true;
        if (resource === 'invitation') return true;
        if (resource === 'ac') return true;
        return false;
      });
      return { success: hasAccess };
    }),
  },
  adminRole: {
    authorize: jest.fn((perms) => {
      const hasAccess = Object.entries(perms).every(([resource, actions]) => {
        if (resource === 'organization') return (actions as string[]).every((a) => ['update', 'read'].includes(a));
        if (resource === 'member') return true;
        if (resource === 'team') return true;
        if (resource === 'invitation') return true;
        if (resource === 'ac') return true;
        return false;
      });
      return { success: hasAccess };
    }),
  },
  manager: {
    authorize: jest.fn((perms) => {
      const hasAccess = Object.entries(perms).every(([resource, actions]) => {
        if (resource === 'organization') return (actions as string[]).every((a) => a === 'update');
        if (resource === 'member') return (actions as string[]).every((a) => ['read', 'update'].includes(a));
        if (resource === 'invitation') return (actions as string[]).every((a) => ['read', 'cancel'].includes(a));
        if (resource === 'team') return (actions as string[]).every((a) => ['read', 'update'].includes(a));
        return false;
      });
      return { success: hasAccess };
    }),
  },
  member: {
    authorize: jest.fn((perms) => {
      const hasAccess = Object.entries(perms).every(([resource, actions]) => {
        if (resource === 'organization') return (actions as string[]).every((a) => a === 'read');
        return false;
      });
      return { success: hasAccess };
    }),
  },
  viewer: {
    authorize: jest.fn((perms) => {
      const hasAccess = Object.entries(perms).every(([resource, actions]) => {
        if (resource === 'organization') return (actions as string[]).every((a) => a === 'read');
        return false;
      });
      return { success: hasAccess };
    }),
  },
}));

describe('OrgPermissionGuard', () => {
  let guard: OrgPermissionGuard;
  let reflector: Reflector;
  let prisma: any;

  const createMockContext = (
    session: any,
    params: any = {},
    metadata?: any,
  ): ExecutionContext => {
    const context = {
      getHandler: jest.fn().mockReturnValue({}),
      getClass: jest.fn().mockReturnValue({}),
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn().mockReturnValue({
        session,
        params,
        body: {},
        headers: {},
      }),
    } as unknown as ExecutionContext;

    return context;
  };

  const setupReflectorMock = (isPublic: boolean, metadata: any) => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(isPublic) // First call is for isPublic
      .mockReturnValueOnce(metadata); // Second call is for permissions
  };

  beforeEach(() => {
    reflector = new Reflector();
    prisma = {
      member: {
        findUnique: jest.fn(),
      },
      organizationRole: {
        findUnique: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    guard = new OrgPermissionGuard(reflector, prisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Public routes', () => {
    it('should allow access when route is marked as public', async () => {
      const context = createMockContext(null);
      setupReflectorMock(true, undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should not check permissions for public routes', async () => {
      const context = createMockContext(null);
      setupReflectorMock(true, undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prisma.member.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('No permission requirements', () => {
    it('should allow access when no permissions are required', async () => {
      const context = createMockContext({ user: { id: 'user1' } });
      setupReflectorMock(false, undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('Authentication check', () => {
    it('should throw ForbiddenException when no session exists', async () => {
      const context = createMockContext(null, { id: 'org1' });
      setupReflectorMock(false, {
        resource: 'member',
        action: 'read',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Authentication required')
      );
    });

    it('should throw ForbiddenException when session exists but user.id is missing', async () => {
      const context = createMockContext({ user: {} }, { id: 'org1' });
      setupReflectorMock(false, {
        resource: 'member',
        action: 'read',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Authentication required')
      );
    });
  });

  describe('Organization ID extraction', () => {
    it('should extract organizationId from params.id', async () => {
      prisma.member.findUnique.mockResolvedValue({ role: 'owner' });

      const context = createMockContext({ user: { id: 'user1' } }, { id: 'org1' });
      setupReflectorMock(false, {
        resource: 'organization',
        action: 'read',
      });

      await guard.canActivate(context);

      expect(prisma.member.findUnique).toHaveBeenCalledWith({
        where: {
          userId_organizationId: {
            userId: 'user1',
            organizationId: 'org1',
          },
        },
        select: { role: true },
      });
    });

    it('should extract organizationId from params.orgId', async () => {
      prisma.member.findUnique.mockResolvedValue({ role: 'owner' });

      const context = createMockContext({ user: { id: 'user1' } }, { orgId: 'org2' });
      setupReflectorMock(false, {
        resource: 'organization',
        action: 'read',
      });

      await guard.canActivate(context);

      expect(prisma.member.findUnique).toHaveBeenCalledWith({
        where: {
          userId_organizationId: {
            userId: 'user1',
            organizationId: 'org2',
          },
        },
        select: { role: true },
      });
    });

    it('should extract organizationId from params.organizationId', async () => {
      prisma.member.findUnique.mockResolvedValue({ role: 'owner' });

      const context = createMockContext(
        { user: { id: 'user1' } },
        { organizationId: 'org3' }
      );
      setupReflectorMock(false, {
        resource: 'organization',
        action: 'read',
      });

      await guard.canActivate(context);

      expect(prisma.member.findUnique).toHaveBeenCalledWith({
        where: {
          userId_organizationId: {
            userId: 'user1',
            organizationId: 'org3',
          },
        },
        select: { role: true },
      });
    });

    it('should NOT extract organizationId from body (security: only route params allowed)', async () => {
      // Security: Organization ID is never extracted from request body
      // Only route params (id, orgId, organizationId) are trusted
      const context = createMockContext(
        { user: { id: 'user1' } },
        {}
      );
      (context.switchToHttp().getRequest() as any).body = { organizationId: 'org4' };
      setupReflectorMock(false, {
        resource: 'organization',
        action: 'read',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Organization ID required')
      );
    });

    it('should throw ForbiddenException when organizationId cannot be found', async () => {
      const context = createMockContext({ user: { id: 'user1' } }, {});
      setupReflectorMock(false, {
        resource: 'member',
        action: 'read',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Organization ID required')
      );
    });
  });

  describe('System admin bypass', () => {
    it('should allow system admin to access any organization', async () => {
      prisma.member.findUnique.mockResolvedValue(null);

      const context = createMockContext(
        { user: { id: 'admin1', role: 'admin' } },
        { id: 'org1' }
      );
      setupReflectorMock(false, {
        resource: 'organization',
        action: 'delete',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('Member existence check', () => {
    it('should throw ForbiddenException when user is not a member and not system admin', async () => {
      prisma.member.findUnique.mockResolvedValue(null);

      const context = createMockContext({ user: { id: 'user1' } }, { id: 'org1' });
      setupReflectorMock(false, {
        resource: 'member',
        action: 'read',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('You are not a member of this organization')
      );
    });
  });

  describe('Default role permissions', () => {
    it('should allow owner to delete organization', async () => {
      prisma.member.findUnique.mockResolvedValue({ role: 'owner' });

      const context = createMockContext({ user: { id: 'user1' } }, { id: 'org1' });
      setupReflectorMock(false, {
        resource: 'organization',
        action: 'delete',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny admin to delete organization', async () => {
      prisma.member.findUnique.mockResolvedValue({ role: 'admin' });

      const context = createMockContext({ user: { id: 'user1' } }, { id: 'org1' });
      setupReflectorMock(false, {
        resource: 'organization',
        action: 'delete',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Insufficient permissions for this operation')
      );
    });

    it('should allow manager to update organization', async () => {
      prisma.member.findUnique.mockResolvedValue({ role: 'manager' });

      const context = createMockContext({ user: { id: 'user1' } }, { id: 'org1' });
      setupReflectorMock(false, {
        resource: 'organization',
        action: 'update',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny manager to delete organization', async () => {
      prisma.member.findUnique.mockResolvedValue({ role: 'manager' });

      const context = createMockContext({ user: { id: 'user1' } }, { id: 'org1' });
      setupReflectorMock(false, {
        resource: 'organization',
        action: 'delete',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should deny member to update organization', async () => {
      prisma.member.findUnique.mockResolvedValue({ role: 'member' });

      const context = createMockContext({ user: { id: 'user1' } }, { id: 'org1' });
      setupReflectorMock(false, {
        resource: 'organization',
        action: 'update',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should allow viewer to read organization', async () => {
      prisma.member.findUnique.mockResolvedValue({ role: 'viewer' });

      const context = createMockContext({ user: { id: 'user1' } }, { id: 'org1' });
      setupReflectorMock(false, {
        resource: 'organization',
        action: 'read',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('Custom role permissions', () => {
    it('should fetch and validate custom role permissions', async () => {
      const customPermissions = { member: ['read', 'update'], team: ['read'] };
      prisma.member.findUnique.mockResolvedValue({ role: 'custom-role' });
      prisma.organizationRole.findUnique.mockResolvedValue({
        permission: JSON.stringify(customPermissions),
      });

      const context = createMockContext({ user: { id: 'user1' } }, { id: 'org1' });
      setupReflectorMock(false, {
        resource: 'member',
        action: 'update',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny custom role without required permission', async () => {
      const customPermissions = { member: ['read'] };
      prisma.member.findUnique.mockResolvedValue({ role: 'custom-role' });
      prisma.organizationRole.findUnique.mockResolvedValue({
        permission: JSON.stringify(customPermissions),
      });

      const context = createMockContext({ user: { id: 'user1' } }, { id: 'org1' });
      setupReflectorMock(false, {
        resource: 'member',
        action: 'delete',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should handle custom role not found - returns null and permission check fails', async () => {
      prisma.member.findUnique.mockResolvedValue({ role: 'custom-role' });
      prisma.organizationRole.findUnique.mockResolvedValue(null);

      const context = createMockContext({ user: { id: 'user1' } }, { id: 'org1' });
      setupReflectorMock(false, {
        resource: 'member',
        action: 'read',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should cache custom role permissions', async () => {
      const customPermissions = { member: ['read'] };
      prisma.member.findUnique.mockResolvedValue({ role: 'custom-role' });
      prisma.organizationRole.findUnique
        .mockResolvedValueOnce({
          permission: JSON.stringify(customPermissions),
        })
        .mockResolvedValueOnce({
          permission: JSON.stringify(customPermissions),
        });

      const context1 = createMockContext({ user: { id: 'user1' } }, { id: 'org1' });
      setupReflectorMock(false, {
        resource: 'member',
        action: 'read',
      });

      const context2 = createMockContext({ user: { id: 'user1' } }, { id: 'org1' });
      setupReflectorMock(false, {
        resource: 'member',
        action: 'read',
      });

      await guard.canActivate(context1);
      await guard.canActivate(context2);

      expect(prisma.organizationRole.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multiple permissions check', () => {
    it('should check all permissions in object format', async () => {
      prisma.member.findUnique.mockResolvedValue({ role: 'owner' });

      const context = createMockContext({ user: { id: 'user1' } }, { id: 'org1' });
      setupReflectorMock(false, {
        permissions: {
          member: ['read', 'delete'],
          team: ['create'],
        },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny if any permission is missing', async () => {
      prisma.member.findUnique.mockResolvedValue({ role: 'manager' });

      const context = createMockContext({ user: { id: 'user1' } }, { id: 'org1' });
      setupReflectorMock(false, {
        permissions: {
          member: ['delete'],
          team: ['create'],
        },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Set orgPermissions on request', () => {
    it('should set orgPermissions with custom permissions', async () => {
      const customPermissions = { member: ['read'] };
      prisma.member.findUnique.mockResolvedValue({ role: 'custom-role' });
      prisma.organizationRole.findUnique.mockResolvedValue({
        permission: JSON.stringify(customPermissions),
      });

      const context = createMockContext({ user: { id: 'user1' } }, { id: 'org1' });
      setupReflectorMock(false, {
        resource: 'member',
        action: 'read',
      });
      const request = context.switchToHttp().getRequest();

      await guard.canActivate(context);

      expect(request.orgPermissions).toEqual({
        organizationId: 'org1',
        userId: 'user1',
        role: 'custom-role',
        permissions: customPermissions,
      });
    });

    it('should set orgPermissions with null permissions for default roles', async () => {
      prisma.member.findUnique.mockResolvedValue({ role: 'owner' });

      const context = createMockContext({ user: { id: 'user1' } }, { id: 'org1' });
      setupReflectorMock(false, {
        resource: 'organization',
        action: 'read',
      });
      const request = context.switchToHttp().getRequest();

      await guard.canActivate(context);

      expect(request.orgPermissions).toEqual({
        organizationId: 'org1',
        userId: 'user1',
        role: 'owner',
        permissions: null,
      });
    });
  });

  describe('Cache invalidation', () => {
    it('should invalidate specific role cache', async () => {
      const customPermissions = { member: ['read'] };
      prisma.member.findUnique.mockResolvedValue({ role: 'custom-role' });
      prisma.organizationRole.findUnique.mockResolvedValue({
        permission: JSON.stringify(customPermissions),
      });

      const context = createMockContext({ user: { id: 'user1' } }, { id: 'org1' });
      setupReflectorMock(false, {
        resource: 'member',
        action: 'read',
      });

      await guard.canActivate(context);

      guard.invalidateRoleCache('org1', 'custom-role');

      const context2 = createMockContext({ user: { id: 'user1' } }, { id: 'org1' });
      setupReflectorMock(false, {
        resource: 'member',
        action: 'read',
      });
      prisma.organizationRole.findUnique.mockClear().mockResolvedValue({
        permission: JSON.stringify(customPermissions),
      });

      await guard.canActivate(context2);

      expect(prisma.organizationRole.findUnique).toHaveBeenCalled();
    });

    it('should invalidate all roles for organization', async () => {
      const customPermissions = { member: ['read'] };
      prisma.member.findUnique.mockResolvedValue({ role: 'custom-role' });
      prisma.organizationRole.findUnique.mockResolvedValue({
        permission: JSON.stringify(customPermissions),
      });

      const context = createMockContext({ user: { id: 'user1' } }, { id: 'org1' });
      setupReflectorMock(false, {
        resource: 'member',
        action: 'read',
      });

      await guard.canActivate(context);

      // Just verify the method runs without error
      expect(() => guard.invalidateRoleCache('org1')).not.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should handle JSON parse errors gracefully', async () => {
      prisma.member.findUnique.mockResolvedValue({ role: 'custom-role' });
      prisma.organizationRole.findUnique.mockResolvedValue({
        permission: 'invalid-json{',
      });

      const context = createMockContext({ user: { id: 'user1' } }, { id: 'org1' });
      setupReflectorMock(false, {
        resource: 'member',
        action: 'read',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
    });
  });
});
