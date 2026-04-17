import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { OrgPermissionGuard } from '../auth/guards/org-permission.guard';
import { RESERVED_ROLES, validatePermissions, isValidRoleName } from '../auth/permissions';
import { defaultRoles } from '../auth/guards/org-permission.guard';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionGuard: OrgPermissionGuard,
  ) { }

  async getRoles(organizationId: string) {
    const roles = await this.prisma.organizationRole.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });

    // Parse permission JSON strings to objects for frontend consumption
    return roles.map(role => ({
      ...role,
      permissions: this.parsePermissions(role.permission),
      permission: this.parsePermissions(role.permission), // Keep for backward compatibility or remove if not needed
      name: role.role, // Map role name
      isBuiltIn: false,
      memberCount: 0, // Should be populated if needed, defaulting to 0 for now
    }));
  }

  private parsePermissions(permission: any): Record<string, string[]> {
    if (typeof permission === 'string') {
      try {
        return JSON.parse(permission) as Record<string, string[]>;
      } catch {
        return {};
      }
    }
    // If it's already an object (Prisma handling Json type correctly)
    return (permission as Record<string, string[]>) || {};
  }

  async getRole(organizationId: string, roleId: string) {
    const role = await this.prisma.organizationRole.findFirst({
      where: {
        id: roleId,
        organizationId,
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permissions = this.parsePermissions(role.permission);

    return {
      ...role,
      permission: permissions,
      permissions: permissions,
      name: role.role, // Map role name
      isBuiltIn: false,
      memberCount: 0, // Should be populated if needed, defaulting to 0 for now
    };
  }

  async createRole(
    organizationId: string,
    roleName: string,
    permissions: Record<string, string[]>,
    requesterRole?: string,
  ) {
    if (RESERVED_ROLES.includes(roleName as any)) {
      throw new ForbiddenException('Cannot create reserved role names');
    }

    // Validate permissions against schema
    try {
      validatePermissions(permissions);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid permissions');
    }

    // Permission ceiling check: prevent privilege escalation
    if (requesterRole) {
      await this.validatePermissionCeiling(organizationId, requesterRole, permissions);
    }

    const existing = await this.prisma.organizationRole.findUnique({
      where: {
        organizationId_role: {
          organizationId,
          role: roleName,
        },
      },
    });

    if (existing) {
      throw new ForbiddenException('Role already exists');
    }

    // Prisma Json definition supports direct object storage
    // But if we want to be consistent with previous 'stringified' behavior we should check.
    // However, best practice for Json type is to pass the object.
    const created = await this.prisma.organizationRole.create({
      data: {
        organizationId,
        role: roleName,
        permission: permissions as any, // Cast to any to satisfy Prisma input if it expects weird types
      },
    });

    return {
      ...created,
      permissions,
      permission: permissions,
      name: created.role,
      isBuiltIn: false,
      memberCount: 0,
    };
  }

  async updateRole(
    organizationId: string,
    roleId: string,
    permissions: Record<string, string[]>,
    requesterRole?: string,
  ) {
    const orgRole = await this.prisma.organizationRole.findFirst({
      where: {
        id: roleId,
        organizationId,
      },
    });

    if (!orgRole) {
      throw new NotFoundException('Role not found');
    }

    if (RESERVED_ROLES.includes(orgRole.role as any)) {
      throw new ForbiddenException('Cannot modify reserved roles');
    }

    // Validate permissions against schema
    try {
      validatePermissions(permissions);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    // Permission ceiling check: prevent privilege escalation
    if (requesterRole) {
      await this.validatePermissionCeiling(organizationId, requesterRole, permissions);
    }

    const updated = await this.prisma.organizationRole.update({
      where: { id: roleId },
      data: {
        permission: permissions as any,
        updatedAt: new Date(),
      },
    });

    this.permissionGuard.invalidateRoleCache(organizationId, orgRole.role);
    return {
      ...updated,
      permissions,
      permission: permissions,
      name: updated.role,
      isBuiltIn: false,
      memberCount: 0,
    };
  }

  async deleteRole(organizationId: string, roleId: string) {
    const orgRole = await this.prisma.organizationRole.findFirst({
      where: {
        id: roleId,
        organizationId,
      },
    });

    if (!orgRole) {
      throw new NotFoundException('Role not found');
    }

    if (RESERVED_ROLES.includes(orgRole.role as any)) {
      throw new ForbiddenException('Cannot delete reserved roles');
    }

    const deleted = await this.prisma.$transaction(async (tx) => {
      const memberCount = await tx.member.count({
        where: {
          organizationId,
          role: orgRole.role,
        },
      });

      if (memberCount > 0) {
        throw new ForbiddenException('Cannot delete role with assigned members');
      }

      return tx.organizationRole.delete({
        where: { id: roleId },
      });
    });

    this.permissionGuard.invalidateRoleCache(organizationId, orgRole.role);
    return deleted;
  }

  async getMembersByRole(organizationId: string) {
    const members = await this.prisma.member.findMany({
      where: { organizationId },
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

    const grouped: Record<string, Array<{ id: string; email: string; name: string | null }>> = {};
    for (const member of members) {
      if (!grouped[member.role]) {
        grouped[member.role] = [];
      }
      grouped[member.role].push({
        id: member.user.id,
        email: member.user.email,
        name: member.user.name,
      });
    }

    return grouped;
  }

  /**
   * Validate that a role exists for an organization
   * @returns true if role is valid (default or exists as custom role), throws otherwise
   */
  async validateRoleForOrganization(organizationId: string, roleName: string): Promise<boolean> {
    // Check if it's a valid role name format
    if (!isValidRoleName(roleName)) {
      throw new BadRequestException(`Invalid role name format: "${roleName}"`);
    }

    // Default roles are always valid
    if (RESERVED_ROLES.includes(roleName as any)) {
      return true;
    }

    // Check if custom role exists for this organization
    const customRole = await this.prisma.organizationRole.findUnique({
      where: {
        organizationId_role: {
          organizationId,
          role: roleName,
        },
      },
      select: { id: true },
    });

    if (!customRole) {
      throw new BadRequestException(
        `Role "${roleName}" does not exist in this organization. ` +
        `Valid roles are: ${RESERVED_ROLES.join(', ')} or custom roles created for this organization.`
      );
    }

    return true;
  }

  /**
   * Get all valid roles for an organization (default + custom)
   */
  async getValidRolesForOrganization(organizationId: string): Promise<string[]> {
    const customRoles = await this.prisma.organizationRole.findMany({
      where: { organizationId },
      select: { role: true },
    });

    return [
      ...RESERVED_ROLES,
      ...customRoles.map(r => r.role),
    ];
  }

  /**
   * Validates that the permissions being granted don't exceed the requester's own permissions.
   * This prevents privilege escalation where an admin grants organization:delete to a custom role.
   */
  private async validatePermissionCeiling(
    organizationId: string,
    requesterRole: string,
    newPermissions: Record<string, string[]>,
  ): Promise<void> {
    const roleMap = defaultRoles;

    const requesterRoleDef = roleMap[requesterRole as keyof typeof roleMap];

    let requesterPermissions: Record<string, string[]>;

    if (requesterRoleDef) {
      // Default role - use its built-in permissions
      // Check each permission being granted against the role definition
      for (const [resource, actions] of Object.entries(newPermissions)) {
        for (const action of actions) {
          const authCheck = (requesterRoleDef as any).authorize({ [resource]: [action] });
          if (!authCheck.success) {
            throw new ForbiddenException(
              `Cannot grant permission '${resource}:${action}' - your role does not have this permission`
            );
          }
        }
      }
      return;
    }

    // Custom role - fetch permissions from database
    const customRole = await this.prisma.organizationRole.findUnique({
      where: {
        organizationId_role: {
          organizationId,
          role: requesterRole,
        },
      },
      select: { permission: true },
    });

    if (!customRole) {
      throw new ForbiddenException('Your role does not exist in this organization');
    }

    try {
      requesterPermissions = this.parsePermissions(customRole.permission);
    } catch {
      throw new ForbiddenException('Invalid role permissions configuration');
    }

    // Validate each permission being granted against custom role's permissions
    for (const [resource, actions] of Object.entries(newPermissions)) {
      const allowedActions = requesterPermissions[resource] || [];
      for (const action of actions) {
        if (!allowedActions.includes(action)) {
          throw new ForbiddenException(
            `Cannot grant permission '${resource}:${action}' - your role does not have this permission`
          );
        }
      }
    }
  }
}
