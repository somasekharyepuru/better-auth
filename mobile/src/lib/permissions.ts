/**
 * Permission definitions for role-based access control
 * Ported from frontend for consistency
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
export type DefaultRoleName = typeof RESERVED_ROLES[number];

// Default roles with their display names, descriptions, and permissions
export const DEFAULT_ROLES = {
  owner: {
    name: 'owner',
    label: 'Owner',
    description: 'Full control over the organization',
    icon: 'Crown',
    isSystem: true,
    permissions: {
      user: ['create', 'read', 'update', 'delete'],
      organization: ['update', 'delete'],
      member: ['create', 'read', 'update', 'delete'],
      invitation: ['create', 'cancel'],
      team: ['create', 'read', 'update', 'delete'],
      ac: ['create', 'read', 'update', 'delete'],
    },
  },
  admin: {
    name: 'admin',
    label: 'Admin',
    description: 'Full control except deleting the organization',
    icon: 'Shield',
    isSystem: true,
    permissions: {
      user: ['create', 'read', 'update'],
      organization: ['update'],
      member: ['create', 'read', 'update', 'delete'],
      invitation: ['create', 'cancel'],
      team: ['create', 'read', 'update', 'delete'],
      ac: ['create', 'read', 'update', 'delete'],
    },
  },
  manager: {
    name: 'manager',
    label: 'Manager',
    description: 'Can manage members and teams',
    icon: 'Clipboard',
    isSystem: true,
    permissions: {
      user: ['read', 'update'],
      organization: ['update'],
      member: ['create', 'update'],
      invitation: ['create', 'cancel'],
      team: ['create', 'read', 'update'],
      ac: ['read'],
    },
  },
  member: {
    name: 'member',
    label: 'Member',
    description: 'Read-only access to organization data',
    icon: 'User',
    isSystem: true,
    permissions: {
      user: ['read'],
      organization: [],
      member: ['read'],
      invitation: [],
      team: ['read'],
      ac: ['read'],
    },
  },
  viewer: {
    name: 'viewer',
    label: 'Viewer',
    description: 'Read-only access to teams',
    icon: 'Eye',
    isSystem: true,
    permissions: {
      user: ['read'],
      organization: [],
      member: [],
      invitation: [],
      team: ['read'],
      ac: [],
    },
  },
} as const;

// Role templates for quick role creation
export const ROLE_TEMPLATES: Record<
  string,
  { name: string; permissions: Permission; description: string; icon: string }
> = {
  read_only: {
    name: 'read-only',
    permissions: {
      user: ['read'],
      member: ['read'],
      team: ['read'],
    },
    description: 'Can view everything but make no changes',
    icon: 'Eye',
  },
  contributor: {
    name: 'contributor',
    permissions: {
      user: ['read'],
      member: ['read'],
      team: ['create', 'read', 'update'],
    },
    description: 'Can work with teams but not manage members',
    icon: 'Edit',
  },
  moderator: {
    name: 'moderator',
    permissions: {
      user: ['read'],
      member: ['read', 'update'],
      team: ['read'],
    },
    description: 'Can manage member activity',
    icon: 'Hammer',
  },
  team_lead: {
    name: 'team-lead',
    permissions: {
      user: ['read'],
      member: ['read'],
      team: ['create', 'read', 'update'],
    },
    description: 'Can create and manage teams',
    icon: 'Users',
  },
} as const;

// Get role display info
export function getRoleDisplay(roleName: string) {
  const defaultRole = DEFAULT_ROLES[roleName as keyof typeof DEFAULT_ROLES];
  if (defaultRole) {
    return {
      ...defaultRole,
      type: 'default' as const,
    };
  }
  return {
    name: roleName,
    label: formatRoleName(roleName),
    description: 'Custom role',
    icon: 'Settings',
    type: 'custom' as const,
    isSystem: false,
    permissions: {},
  };
}

// Count total permissions in a permission object
export function countPermissions(permissions: Permission): number {
  let count = 0;
  for (const actions of Object.values(permissions)) {
    count += actions?.length || 0;
  }
  return count;
}

// Check if a permission object is empty (no permissions)
export function isEmptyPermissions(permissions: Permission): boolean {
  return countPermissions(permissions) === 0;
}

// Format role name for display (capitalize, replace hyphens with spaces)
export function formatRoleName(roleName: string): string {
  return roleName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
