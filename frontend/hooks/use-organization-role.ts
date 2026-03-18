"use client";

import { useEffect, useState, useMemo } from "react";
import { authClient } from "@/lib/auth-client";
import type { Member } from "@/lib/types";

export type OrganizationRole = "owner" | "admin" | "manager" | "member" | "viewer";

interface RolePermissions {
    canManageMembers: boolean;
    canInviteMembers: boolean;
    canManageTeams: boolean;
    canAccessSettings: boolean;
    canViewFullMemberDetails: boolean;
    canSearchMembers: boolean;
    canBulkManage: boolean;
    canSeeInvitations: boolean;
}

interface UseOrganizationRoleResult {
    currentUserRole: OrganizationRole | null;
    currentUserId: string | null;
    isLoading: boolean;
    permissions: RolePermissions;
}

const DEFAULT_PERMISSIONS: RolePermissions = {
    canManageMembers: false,
    canInviteMembers: false,
    canManageTeams: false,
    canAccessSettings: false,
    canViewFullMemberDetails: false,
    canSearchMembers: false,
    canBulkManage: false,
    canSeeInvitations: false,
};

const ROLE_PERMISSIONS: Record<OrganizationRole, RolePermissions> = {
    owner: {
        canManageMembers: true,
        canInviteMembers: true,
        canManageTeams: true,
        canAccessSettings: true,
        canViewFullMemberDetails: true,
        canSearchMembers: true,
        canBulkManage: true,
        canSeeInvitations: true,
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
    },
    manager: {
        canManageMembers: false,
        canInviteMembers: false,
        canManageTeams: false,
        canAccessSettings: false,
        canViewFullMemberDetails: true,
        canSearchMembers: true,
        canBulkManage: false,
        canSeeInvitations: false,
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
    },
};

export function useOrganizationRole(organizationId: string): UseOrganizationRoleResult {
    const [currentUserRole, setCurrentUserRole] = useState<OrganizationRole | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!organizationId) {
            setIsLoading(false);
            return;
        }

        const fetchRole = async () => {
            try {
                const sessionRes = await authClient.getSession();
                const userId = sessionRes.data?.user?.id;
                setCurrentUserId(userId ?? null);

                if (!userId) {
                    setIsLoading(false);
                    return;
                }

                await authClient.organization.setActive({ organizationId } as never);

                const membersData = await authClient.organization.listMembers({
                    query: { organizationId }
                } as never);

                const membersList = membersData.data?.members ?? membersData.data ?? [];
                const currentMember = (Array.isArray(membersList) ? membersList : []).find(
                    (m: Member) => m.userId === userId
                );

                if (currentMember) {
                    setCurrentUserRole(currentMember.role as OrganizationRole);
                }
            } catch (error) {
                console.error("Failed to fetch organization role:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRole();
    }, [organizationId]);

    const permissions = useMemo(
        () => (currentUserRole ? ROLE_PERMISSIONS[currentUserRole] : DEFAULT_PERMISSIONS),
        [currentUserRole]
    );

    return {
        currentUserRole,
        currentUserId,
        isLoading,
        permissions,
    };
}
