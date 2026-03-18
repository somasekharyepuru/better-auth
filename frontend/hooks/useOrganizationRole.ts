"use client";

import { useState, useEffect, useMemo } from "react";
import { authClient } from "@/lib/auth-client";

export type OrganizationRole = "owner" | "admin" | "manager" | "member" | "viewer";

interface Member {
    id: string;
    userId: string;
    role: string;
    createdAt: Date;
    user: {
        id: string;
        name: string;
        email: string;
        image?: string;
    };
}

interface UseOrganizationRoleResult {
    currentUserRole: OrganizationRole | null;
    currentUserId: string | null;
    isLoading: boolean;
    // Permission helpers
    isOwner: boolean;
    isAdmin: boolean;
    isManager: boolean;
    isMember: boolean;
    isViewer: boolean;
    // Feature permissions
    canManageMembers: boolean;      // Invite, remove, change roles
    canInviteMembers: boolean;       // Send invitations
    canManageTeams: boolean;         // Create, edit, delete teams
    canAccessSettings: boolean;      // Access organization settings
    canViewFullMemberDetails: boolean; // See emails, join dates, etc.
    canSearchMembers: boolean;       // Search functionality
    canBulkManage: boolean;          // Bulk selection and actions
    canSeeInvitations: boolean;      // View pending invitations
}

export function useOrganizationRole(organizationId: string): UseOrganizationRoleResult {
    const [currentUserRole, setCurrentUserRole] = useState<OrganizationRole | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRole = async () => {
            if (!organizationId) {
                setIsLoading(false);
                return;
            }

            try {
                // Get current user
                const sessionRes = await authClient.getSession();
                const userId = sessionRes.data?.user?.id;
                setCurrentUserId(userId || null);

                if (!userId) {
                    setIsLoading(false);
                    return;
                }

                // Set active organization
                // @ts-ignore
                await authClient.organization.setActive({
                    organizationId,
                });

                // Get members to find current user's role
                // @ts-ignore
                const membersData = await authClient.organization.listMembers({
                    query: { organizationId }
                });

                // @ts-ignore
                const membersList = membersData.data?.members || membersData.data || [];
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

    // Role checks
    const isOwner = currentUserRole === "owner";
    const isAdmin = currentUserRole === "admin";
    const isManager = currentUserRole === "manager";
    const isMember = currentUserRole === "member";
    const isViewer = currentUserRole === "viewer";

    // Calculate permissions based on role
    const permissions = useMemo(() => {
        // Owner and Admin can do everything
        const hasAdminAccess = isOwner || isAdmin;
        // Manager has limited admin access
        const hasManagerAccess = hasAdminAccess || isManager;

        return {
            // Full member management: owner/admin only
            canManageMembers: hasAdminAccess,
            canInviteMembers: hasAdminAccess,

            // Team management: owner/admin can manage all, manager can manage their own
            canManageTeams: hasAdminAccess,

            // Settings: owner/admin only
            canAccessSettings: hasAdminAccess,

            // View full member details: owner/admin/manager can see emails, dates, etc.
            canViewFullMemberDetails: hasManagerAccess,

            // Search: owner/admin/manager
            canSearchMembers: hasManagerAccess,

            // Bulk actions: owner/admin only
            canBulkManage: hasAdminAccess,

            // Pending invitations: owner/admin only
            canSeeInvitations: hasAdminAccess,
        };
    }, [isOwner, isAdmin, isManager]);

    return {
        currentUserRole,
        currentUserId,
        isLoading,
        isOwner,
        isAdmin,
        isManager,
        isMember,
        isViewer,
        ...permissions,
    };
}
