/**
 * Role information and permissions matching frontend
 * Single source of truth for role hierarchy
 */

import type { UserRole } from './types';

export interface RoleInfo {
    name: string;
    description: string;
    level: number;
    permissions: string[];
    canInvite: boolean;
    canManageMembers: boolean;
    canManageTeams: boolean;
    canDeleteOrganization: boolean;
    canUpdateSettings: boolean;
}

export const ROLE_INFO: Record<UserRole, RoleInfo> = {
    owner: {
        name: 'Owner',
        description: 'Full control over the organization',
        level: 5,
        permissions: ['*'],
        canInvite: true,
        canManageMembers: true,
        canManageTeams: true,
        canDeleteOrganization: true,
        canUpdateSettings: true,
    },
    admin: {
        name: 'Admin',
        description: 'Can manage members, teams, and settings',
        level: 4,
        permissions: ['read', 'write', 'invite', 'manage_members', 'manage_teams', 'update_settings'],
        canInvite: true,
        canManageMembers: true,
        canManageTeams: true,
        canDeleteOrganization: false,
        canUpdateSettings: true,
    },
    manager: {
        name: 'Manager',
        description: 'Can manage members and update organization',
        level: 3,
        permissions: ['read', 'write', 'invite', 'manage_members', 'update_settings'],
        canInvite: true,
        canManageMembers: true,
        canManageTeams: false,
        canDeleteOrganization: false,
        canUpdateSettings: true,
    },
    member: {
        name: 'Member',
        description: 'Standard access with read permissions',
        level: 2,
        permissions: ['read', 'write'],
        canInvite: false,
        canManageMembers: false,
        canManageTeams: false,
        canDeleteOrganization: false,
        canUpdateSettings: false,
    },
    viewer: {
        name: 'Viewer',
        description: 'Read-only access to organization resources',
        level: 1,
        permissions: ['read'],
        canInvite: false,
        canManageMembers: false,
        canManageTeams: false,
        canDeleteOrganization: false,
        canUpdateSettings: false,
    },
};

/**
 * Role hierarchy as a Record for easy lookup
 * Export this for use in other modules
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
    owner: 5,
    admin: 4,
    manager: 3,
    member: 2,
    viewer: 1,
};

/**
 * Get role info for a given role
 */
export function getRoleInfo(role: UserRole): RoleInfo {
    return ROLE_INFO[role];
}

/**
 * Check if a role has permission
 */
export function roleHasPermission(role: UserRole, permission: string): boolean {
    const info = ROLE_INFO[role];
    return info.permissions.includes('*') || info.permissions.includes(permission);
}

/**
 * Check if role1 can manage role2
 */
export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
    return ROLE_INFO[managerRole].level > ROLE_INFO[targetRole].level;
}

/**
 * Get available roles that a given role can assign
 */
export function getAssignableRoles(role: UserRole): UserRole[] {
    const roleInfo = ROLE_INFO[role];
    return Object.entries(ROLE_INFO)
        .filter(([_, info]) => info.level < roleInfo.level)
        .map(([r]) => r as UserRole);
}

/**
 * Format role name for display
 */
export function formatRoleName(role: UserRole): string {
    return ROLE_INFO[role].name;
}

/**
 * Get role color for UI (hex codes)
 */
export function getRoleColor(role: UserRole): string {
    const colors: Record<UserRole, string> = {
        owner: '#ef4444',
        admin: '#f97316',
        manager: '#eab308',
        member: '#3b82f6',
        viewer: '#6b7280',
    };
    return colors[role];
}
