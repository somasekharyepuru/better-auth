/**
 * Permission definitions for role-based access control
 * These constants are shared between frontend and backend
 */

export const RESOURCES = {
  user: ['create', 'read', 'update', 'delete'],
  organization: ['update', 'delete'],
  member: ['create', 'read', 'update', 'delete'],
  invitation: ['create', 'read', 'cancel'],
  team: ['create', 'read', 'update', 'delete'],
  ac: ['create', 'read', 'update', 'delete'],
} as const;

export type Resource = keyof typeof RESOURCES;
export type Action<R extends Resource> = (typeof RESOURCES)[R][number];

export type Permission = {
  [R in Resource]?: Action<R>[];
};

// Permission descriptions for UI display
export const PERMISSION_DESCRIPTIONS: Record<
  Resource,
  Record<string, string>
> = {
  user: {
    create: 'Create new users',
    read: 'View user information',
    update: 'Edit user details',
    delete: 'Remove users',
  },
  organization: {
    update: 'Edit organization settings',
    delete: 'Delete the organization',
  },
  member: {
    create: 'Add new members',
    read: 'View member list',
    update: 'Change member roles',
    delete: 'Remove members',
  },
  invitation: {
    create: 'Send new invitations',
    read: 'View pending invitations',
    cancel: 'Cancel pending invitations',
  },
  team: {
    create: 'Create new teams',
    read: 'View teams',
    update: 'Edit team details',
    delete: 'Remove teams',
  },
  ac: {
    create: 'Create custom roles',
    read: 'View roles and permissions',
    update: 'Edit role permissions',
    delete: 'Remove custom roles',
  },
} as const;

// Reserved role names that cannot be used for custom roles
export const RESERVED_ROLES = ['owner', 'admin', 'member', 'manager', 'viewer'] as const;

// Default roles with their display names and descriptions
export const DEFAULT_ROLES = {
  owner: {
    name: 'Owner',
    description: 'Full control over the organization',
    isSystem: true,
  },
  admin: {
    name: 'Admin',
    description: 'Full control except deleting the organization',
    isSystem: true,
  },
  member: {
    name: 'Member',
    description: 'Read-only access to organization data',
    isSystem: true,
  },
  manager: {
    name: 'Manager',
    description: 'Can manage members and teams',
    isSystem: true,
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to teams',
    isSystem: true,
  },
} as const;

// Role templates for quick role creation
export const ROLE_TEMPLATES: Record<
  string,
  { name: string; permissions: Permission; description: string }
> = {
  read_only: {
    name: 'read-only',
    permissions: {
      user: ['read'],
      member: ['read'],
      team: ['read'],
    },
    description: 'Can view everything but make no changes',
  },
  contributor: {
    name: 'contributor',
    permissions: {
      user: ['read'],
      member: ['read'],
      team: ['create', 'read', 'update'],
    },
    description: 'Can work with teams but not manage members',
  },
  moderator: {
    name: 'moderator',
    permissions: {
      user: ['read'],
      member: ['read', 'update'],
      team: ['read'],
    },
    description: 'Can manage member activity',
  },
  team_lead: {
    name: 'team-lead',
    permissions: {
      user: ['read'],
      member: ['read', 'update'],
      team: ['create', 'read', 'update', 'delete'],
    },
    description: 'Can fully manage teams and update members',
  },
} as const;

/**
 * Validates a permission object against the defined resources and actions
 * @throws Error if validation fails with descriptive message
 */
export function validatePermissions(permissions: Record<string, string[]>): void {
  if (!permissions || typeof permissions !== 'object') {
    throw new Error('Permissions must be an object');
  }

  for (const [resource, actions] of Object.entries(permissions)) {
    // Validate resource exists
    if (!(resource in RESOURCES)) {
      throw new Error(`Invalid resource: "${resource}". Valid resources are: ${Object.keys(RESOURCES).join(', ')}`);
    }

    // Validate actions is an array
    if (!Array.isArray(actions)) {
      throw new Error(`Actions for resource "${resource}" must be an array`);
    }

    const validActions = RESOURCES[resource as Resource] as readonly string[];

    // Validate each action
    for (const action of actions) {
      if (!validActions.includes(action)) {
        throw new Error(
          `Invalid action "${action}" for resource "${resource}". Valid actions are: ${validActions.join(', ')}`
        );
      }
    }
  }
}

/**
 * Type guard to check if a role name is valid for an organization
 * Returns true if the role is either a default role or should be validated as a custom role
 */
export function isValidRoleName(roleName: string): boolean {
  if (RESERVED_ROLES.includes(roleName as any)) {
    return true;
  }

  // Custom roles must be alphanumeric with hyphens/underscores, 2-50 chars
  return /^[a-zA-Z0-9_-]{2,50}$/.test(roleName);
}

/**
 * Gets all valid role names (default roles)
 */
export function getDefaultRoles(): readonly string[] {
  return RESERVED_ROLES;
}
