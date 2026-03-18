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
  currentUserId: string | null;
  isLoading: boolean;
  permissions: {
    canManageMembers: boolean;
    canInviteMembers: boolean;
    canManageTeams: boolean;
    canAccessSettings: boolean;
    canViewFullMemberDetails: boolean;
    canSearchMembers: boolean;
    canBulkManage: boolean;
    canSeeInvitations: boolean;
    canDeleteOrganization: boolean;
    canTransferOwnership: boolean;
  };
}

const ROLE_PERMISSIONS = {
  owner: {
    canManageMembers: true,
    canInviteMembers: true,
    canManageTeams: true,
    canAccessSettings: true,
    canViewFullMemberDetails: true,
    canSearchMembers: true,
    canBulkManage: true,
    canSeeInvitations: true,
    canDeleteOrganization: true,
    canTransferOwnership: true,
  },
  admin: {
    canManageMembers: true,
    canInviteMembers: true,
    canManageTeams: true,
    canAccessSettings: true,
    canViewFullMemberDetails: true,
    canSearchMembers: true,
    canBulkManage: true,
    canSeeInvitations: true,
    canDeleteOrganization: false,
    canTransferOwnership: false,
  },
  manager: {
    canManageMembers: true,
    canInviteMembers: true,
    canManageTeams: false,
    canAccessSettings: true,
    canViewFullMemberDetails: true,
    canSearchMembers: true,
    canBulkManage: false,
    canSeeInvitations: true,
    canDeleteOrganization: false,
    canTransferOwnership: false,
  },
  member: {
    canManageMembers: false,
    canInviteMembers: false,
    canManageTeams: false,
    canAccessSettings: false,
    canViewFullMemberDetails: false,
    canSearchMembers: false,
    canBulkManage: false,
    canSeeInvitations: false,
    canDeleteOrganization: false,
    canTransferOwnership: false,
  },
  viewer: {
    canManageMembers: false,
    canInviteMembers: false,
    canManageTeams: false,
    canAccessSettings: false,
    canViewFullMemberDetails: false,
    canSearchMembers: false,
    canBulkManage: false,
    canSeeInvitations: false,
    canDeleteOrganization: false,
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
      // In a real implementation, you'd fetch members and find current user's role
      // For now, we'll use the org's metadata or default to the organization context
      const userRole = org.userRole;
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
        canManageTeams: false,
        canAccessSettings: false,
        canViewFullMemberDetails: false,
        canSearchMembers: false,
        canBulkManage: false,
        canSeeInvitations: false,
        canDeleteOrganization: false,
        canTransferOwnership: false,
      };

  return {
    currentUserRole: role,
    currentUserId: user?.id ?? null,
    isLoading: isLoading || isAuthLoading,
    permissions,
  };
}
