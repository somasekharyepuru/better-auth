// Permission definitions matching the backend access control
export const permissions = {
  user: ['create', 'read', 'update', 'delete'] as const,
  organization: ['update', 'delete'] as const,
  member: ['create', 'update', 'delete'] as const,
  invitation: ['create', 'cancel'] as const,
} as const;

export type PermissionResource = keyof typeof permissions;
export type PermissionAction<T extends PermissionResource> = (typeof permissions)[T][number];

// Helper function to check permissions
export function hasPermission(
  resource: PermissionResource,
  action: string,
  userRole?: string
): boolean {
  // Owner has all permissions
  if (userRole === 'owner') {
    return true;
  }

  // Admin has most permissions except org deletion
  if (userRole === 'admin') {
    if (resource === 'organization' && action === 'delete') {
      return false;
    }
    return (permissions[resource] as readonly string[]).includes(action);
  }

  // Manager role - can manage members and invitations, update org
  if (userRole === 'manager') {
    const managerPermissions = {
      user: ['read', 'update'],
      organization: ['update'],
      member: ['create', 'update'],
      invitation: ['create', 'cancel'],
    };
    return (managerPermissions[resource as keyof typeof managerPermissions] as string[] || []).includes(action);
  }

  // Viewer role - read-only access
  if (userRole === 'viewer') {
    return resource === 'user' && action === 'read';
  }

  // Member has read-only access
  if (userRole === 'member') {
    return resource === 'user' && action === 'read';
  }

  return false;
}

