import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_METADATA_KEY } from '../decorators';
import { PrismaService } from '../../common/prisma.service';
import { owner, adminRole, manager, member, viewer } from '../auth.config';

// Role map for default roles - exported for use in other services
export const defaultRoles = {
  owner,
  admin: adminRole,
  manager,
  member,
  viewer,
};

/**
 * Guard to check if the current user has required permissions in an organization
 *
 * Usage:
 * @RequireOrgPermission('member', 'delete')
 * @RequireOrgPermission({ member: ['delete'], team: ['create'] })
 *
 * @example
 * ```
 * @Post(':id/transfer')
 * @RequireOrgPermission('organization', 'delete')
 * async initiateTransfer(...) { }
 * ```
 */
@Injectable()
export class OrgPermissionGuard implements CanActivate, OnModuleDestroy {
  private readonly logger = new Logger(OrgPermissionGuard.name);
  private readonly roleCache = new Map<string, Record<string, string[]>>();
  private readonly roleCacheTimeouts = new Map<string, NodeJS.Timeout>();
  private static readonly ROLE_CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<{
      resource?: string;
      action?: string;
      permissions?: Record<string, string[]>;
    }>(PERMISSIONS_METADATA_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const session = request.session;

    if (!session?.user?.id) {
      throw new ForbiddenException('Authentication required');
    }

    const userId = session.user.id;
    const isSystemAdmin = session.user?.role === 'admin';

    const organizationId =
      request.params?.id ||
      request.params?.orgId ||
      request.params?.organizationId;

    // Security: Never trust organizationId from request body - only route params

    if (!organizationId) {
      throw new ForbiddenException('Organization ID required');
    }

    const member = await this.prisma.member.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      select: {
        role: true,
      },
    });

    // System admins can access any organization even without being a member
    // They get owner-level permissions for permission checks
    let userRole: string;

    if (!member) {
      if (isSystemAdmin) {
        // System admins bypass all permission checks - log for audit
        this.logger.warn(
          `System admin accessing organization ${organizationId} without membership`,
          { userId, organizationId, path: request.path, method: request.method }
        );
        try {
          await this.prisma.auditLog.create({
            data: {
              userId,
              organizationId,
              action: 'SYSTEM_ADMIN_BYPASS',
              resourceType: 'organization',
              resourceId: organizationId,
              ipAddress: this.extractRequestIp(request),
              userAgent: this.extractUserAgent(request),
              details: {
                path: request.path,
                method: request.method,
                timestamp: new Date().toISOString(),
                reason: 'System admin bypassed organization membership requirement',
              },
            },
          });
        } catch (error) {
          this.logger.error(
            'Failed to persist system admin bypass audit log',
            error instanceof Error ? error.stack : String(error),
          );
        }
        return true;
      } else {
        throw new ForbiddenException(
          'You are not a member of this organization',
        );
      }
    } else {
      userRole = member.role;
    }

    let rolePermissions: Record<string, string[]> | null = null;

    if (
      !['owner', 'admin', 'member', 'manager', 'viewer'].includes(userRole)
    ) {
      rolePermissions = await this.getCustomRolePermissions(
        organizationId,
        userRole,
      );
    }

    const permissionsToCheck = this.normalizePermissions(requiredPermissions);

    for (const [resource, actions] of Object.entries(permissionsToCheck)) {
      for (const action of actions) {
        const hasPermission = this.checkPermission(
          userRole,
          resource,
          action,
          rolePermissions,
        );

        if (!hasPermission) {
          this.logger.warn(
            `Permission denied: user=${userId}, org=${organizationId}, role=${userRole}, required=${resource}:${action}`,
          );
          throw new ForbiddenException('Insufficient permissions for this operation');
        }
      }
    }

    request.orgPermissions = {
      organizationId,
      userId,
      role: userRole,
      permissions: rolePermissions || null,
    };

    return true;
  }

  private async getCustomRolePermissions(
    organizationId: string,
    roleName: string,
  ): Promise<Record<string, string[]> | null> {
    const cacheKey = `${organizationId}:${roleName}`;

    if (this.roleCache.has(cacheKey)) {
      const cachedPermissions = this.roleCache.get(cacheKey);
      if (cachedPermissions) {
        return cachedPermissions;
      }
    }

    try {
      const orgRole = await this.prisma.organizationRole.findUnique({
        where: {
          organizationId_role: {
            organizationId,
            role: roleName,
          },
        },
        select: {
          permission: true,
        },
      });

      if (!orgRole) {
        return null;
      }

      // permission is stored as JSON string or object
      let permissions: Record<string, string[]>;

      if (typeof orgRole.permission === 'object' && orgRole.permission !== null) {
        permissions = orgRole.permission as unknown as Record<string, string[]>;
      } else if (typeof orgRole.permission === 'string') {
        try {
          permissions = JSON.parse(orgRole.permission) as Record<string, string[]>;
        } catch (error) {
          if (error instanceof SyntaxError) {
            const permStr = orgRole.permission as string;
            const excerpt = permStr.length > 200
              ? `${permStr.slice(0, 200)}...`
              : permStr;
            this.logger.error(
              `Malformed custom role permission JSON for role "${roleName}" in organization "${organizationId}": ${error.message}`,
              `permission=${excerpt}`,
            );
            throw new BadRequestException('Malformed custom role permissions JSON');
          }
          throw error;
        }
      } else {
        // Fallback for unexpected types
        permissions = {};
      }

      this.setRoleCache(cacheKey, permissions);

      return permissions;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.warn(`Failed to fetch custom role: ${error}`);
      return null;
    }
  }

  private checkPermission(
    role: string,
    resource: string,
    action: string,
    customPermissions: Record<string, string[]> | null,
  ): boolean {
    if (customPermissions) {
      const resourcePermissions = customPermissions[resource] || [];
      return resourcePermissions.includes(action);
    }

    const roleDef = defaultRoles[role as keyof typeof defaultRoles];
    if (!roleDef) {
      return false;
    }

    const result = roleDef.authorize({
      [resource]: [action],
    });

    return result.success;
  }

  private normalizePermissions(
    requirement: {
      resource?: string;
      action?: string;
      permissions?: Record<string, string[]>;
    },
  ): Record<string, string[]> {
    if (requirement.permissions) {
      return requirement.permissions;
    }

    if (requirement.resource && requirement.action) {
      return {
        [requirement.resource]: [requirement.action],
      };
    }

    throw new BadRequestException('Invalid permission requirement');
  }

  private setRoleCache(
    cacheKey: string,
    permissions: Record<string, string[]>,
  ): void {
    this.roleCache.set(cacheKey, permissions);

    const existingTimeout = this.roleCacheTimeouts.get(cacheKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      this.roleCache.delete(cacheKey);
      this.roleCacheTimeouts.delete(cacheKey);
    }, OrgPermissionGuard.ROLE_CACHE_TTL_MS);

    this.roleCacheTimeouts.set(cacheKey, timeout);
  }

  private extractRequestIp(request: any): string | undefined {
    const forwardedFor = request.headers?.['x-forwarded-for'];
    if (typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0]?.trim();
    }
    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      return forwardedFor[0];
    }
    return request.ip;
  }

  private extractUserAgent(request: any): string | undefined {
    const userAgent = request.headers?.['user-agent'];
    if (typeof userAgent === 'string') {
      return userAgent;
    }
    if (Array.isArray(userAgent) && userAgent.length > 0) {
      return userAgent[0];
    }
    return undefined;
  }

  onModuleDestroy(): void {
    for (const timeout of this.roleCacheTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.roleCacheTimeouts.clear();
    this.roleCache.clear();
  }

  invalidateRoleCache(organizationId: string, roleName?: string): void {
    if (roleName) {
      const cacheKey = `${organizationId}:${roleName}`;
      const timeout = this.roleCacheTimeouts.get(cacheKey);
      if (timeout) {
        clearTimeout(timeout);
        this.roleCacheTimeouts.delete(cacheKey);
      }
      this.roleCache.delete(cacheKey);
    } else {
      for (const key of Array.from(this.roleCache.keys())) {
        if (key.startsWith(`${organizationId}:`)) {
          const timeout = this.roleCacheTimeouts.get(key);
          if (timeout) {
            clearTimeout(timeout);
            this.roleCacheTimeouts.delete(key);
          }
          this.roleCache.delete(key);
        }
      }
    }
  }
}

declare global {
  namespace Express {
    interface Request {
      orgPermissions?: {
        organizationId: string;
        userId: string;
        role: string;
        permissions: Record<string, string[]> | null;
      };
    }
  }
}
