/**
 * useOrganizationRole Hook
 *
 * Provides organization role information and computed permissions.
 * Used for permission-based rendering in organization screens.
 */

import { useEffect, useState } from 'react';
import { useOrganization } from '../src/contexts/OrganizationContext';
import { useAuth } from '../src/contexts/AuthContext';
import type { UserRole } from '../src/lib/types';

interface UseOrganizationRoleReturn {
  currentUserRole: UserRole | null;
  role: UserRole | null; // alias for compatibility
  currentUserId: string | null;
  isLoading: boolean;
  canManageMembers: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canChangeRole: boolean;
  canManageTeams: boolean;
  canAccessSettings: boolean;
  canUpdateSettings: boolean;
  canDeleteOrganization: boolean;
  canDeleteOrg: boolean;
  canManageInvitations: boolean;
  canInvite: boolean;
  canBulkManage: boolean;
  canManageRoles: boolean;
  permissions: {
    canManageMembers: boolean;
    canInviteMembers: boolean;
    canRemoveMembers: boolean;
    canChangeRole: boolean;
    canManageTeams: boolean;
    canAccessSettings: boolean;
    canUpdateSettings: boolean;
    canDeleteOrganization: boolean;
    canViewFullMemberDetails: boolean;
    canSearchMembers: boolean;
    canBulkManage: boolean;
    canSeeInvitations: boolean;
    canManageInvitations: boolean;
    canTransferOwnership: boolean;
  };
}

const ROLE_PERMISSIONS = {
  owner: {
    canManageMembers: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canChangeRole: true,
    canManageTeams: true,
    canAccessSettings: true,
    canUpdateSettings: true,
    canDeleteOrganization: true,
    canViewFullMemberDetails: true,
    canSearchMembers: true,
    canBulkManage: true,
    canSeeInvitations: true,
    canManageInvitations: true,
    canTransferOwnership: true,
  },
  admin: {
    canManageMembers: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canChangeRole: true,
    canManageTeams: true,
    canAccessSettings: true,
    canUpdateSettings: true,
    canDeleteOrganization: false,
    canViewFullMemberDetails: true,
    canSearchMembers: true,
    canBulkManage: true,
    canSeeInvitations: true,
    canManageInvitations: true,
    canTransferOwnership: false,
  },
  manager: {
    canManageMembers: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canChangeRole: true,
    canManageTeams: false,
    canAccessSettings: true,
    canUpdateSettings: true,
    canDeleteOrganization: false,
    canViewFullMemberDetails: true,
    canSearchMembers: true,
    canBulkManage: false,
    canSeeInvitations: true,
    canManageInvitations: true,
    canTransferOwnership: false,
  },
  member: {
    canManageMembers: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canChangeRole: false,
    canManageTeams: false,
    canAccessSettings: false,
    canUpdateSettings: false,
    canDeleteOrganization: false,
    canViewFullMemberDetails: false,
    canSearchMembers: false,
    canBulkManage: false,
    canSeeInvitations: false,
    canManageInvitations: false,
    canTransferOwnership: false,
  },
  viewer: {
    canManageMembers: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canChangeRole: false,
    canManageTeams: false,
    canAccessSettings: false,
    canUpdateSettings: false,
    canDeleteOrganization: false,
    canViewFullMemberDetails: false,
    canSearchMembers: false,
    canBulkManage: false,
    canSeeInvitations: false,
    canManageInvitations: false,
    canTransferOwnership: false,
  },
};

export function useOrganizationRole(organizationId?: string): UseOrganizationRoleReturn {
  const { organizations, activeOrganization } = useOrganization();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to complete before proceeding
    if (isAuthLoading) {
      return;
    }

    // Find the organization and get current user's role
    const orgId = organizationId || activeOrganization?.id;
    if (!orgId) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    const org = organizations.find(o => o.id === orgId);
    if (org) {
      const userRole = org.userRole ?? org.role;
      // Validate role is a known value before setting
      if (userRole && userRole in ROLE_PERMISSIONS) {
        setRole(userRole as UserRole);
      } else {
        setRole(null);
      }
    }
    setIsLoading(false);
  }, [organizationId, activeOrganization, organizations, isAuthLoading]);

  const permissions = role
    ? ROLE_PERMISSIONS[role]
    : {
        canManageMembers: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canChangeRole: false,
        canManageTeams: false,
        canAccessSettings: false,
        canUpdateSettings: false,
        canDeleteOrganization: false,
        canViewFullMemberDetails: false,
        canSearchMembers: false,
        canBulkManage: false,
        canSeeInvitations: false,
        canManageInvitations: false,
        canTransferOwnership: false,
      };

  return {
    currentUserRole: role,
    role, // Alias for compatibility
    currentUserId: user?.id ?? null,
    isLoading: isLoading || isAuthLoading,
    canManageMembers: permissions.canManageMembers,
    canInviteMembers: permissions.canInviteMembers,
    canRemoveMembers: permissions.canRemoveMembers,
    canChangeRole: permissions.canChangeRole,
    canManageTeams: permissions.canManageTeams,
    canAccessSettings: permissions.canAccessSettings,
    canUpdateSettings: permissions.canUpdateSettings,
    canDeleteOrganization: permissions.canDeleteOrganization,
    canDeleteOrg: permissions.canDeleteOrganization,
    canManageInvitations: permissions.canManageInvitations,
    canInvite: permissions.canInviteMembers,
    canBulkManage: permissions.canBulkManage,
    canManageRoles: role === 'owner' || role === 'admin',
    permissions,
  };
}
