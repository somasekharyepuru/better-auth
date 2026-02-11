/**
 * Better Auth client for Expo mobile app
 * Uses the official @better-auth/expo integration
 */

import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import { twoFactorClient, emailOTPClient } from 'better-auth/client/plugins';
import * as SecureStore from 'expo-secure-store';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';

export const authClient = createAuthClient({
    baseURL: API_BASE,
    plugins: [
        expoClient({
            scheme: 'mobile', // matches app.json scheme
            storagePrefix: 'daymark',
            storage: SecureStore,
        }),
        twoFactorClient(),
        emailOTPClient(),
    ],
});

// Re-export types for convenience
export type { User, Session } from 'better-auth/types';

// Organization types
export interface Organization {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    ownerId?: string;
    allowMemberInvite?: boolean;
    requireApproval?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface OrganizationMember {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
    organizationId: string;
    createdAt: string;
}

export interface OrganizationInvitation {
    id: string;
    organizationId: string;
    organization?: {
        id: string;
        name: string;
        slug: string;
    } | null;
    email: string;
    role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
    invitedBy?: {
        id: string;
        name: string;
    } | null;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: string;
    expiresAt: string;
}

// Organization API methods
export const organization = {
    list: async (): Promise<{ data?: Organization[] }> => {
        const response = await fetch(`${API_BASE}/api/organizations`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch organizations');
        }
        return response.json();
    },

    get: async (id: string): Promise<Organization> => {
        const response = await fetch(`${API_BASE}/api/organizations/${id}`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch organization');
        }
        return response.json();
    },

    create: async (data: { name: string; slug?: string; description?: string }): Promise<Organization> => {
        const response = await fetch(`${API_BASE}/api/organizations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to create organization');
        }
        return response.json();
    },

    update: async (id: string, data: { name?: string; description?: string }): Promise<Organization> => {
        const response = await fetch(`${API_BASE}/api/organizations/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to update organization');
        }
        return response.json();
    },

    listMembers: async (id: string): Promise<{ members?: OrganizationMember[] }> => {
        const response = await fetch(`${API_BASE}/api/organizations/${id}/members`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch members');
        }
        return response.json();
    },

    changeRole: async (orgId: string, memberId: string, role: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/api/organizations/${orgId}/members/${memberId}/role`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role }),
        });
        if (!response.ok) {
            throw new Error('Failed to change role');
        }
    },

    removeMember: async (orgId: string, memberId: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/api/organizations/${orgId}/members/${memberId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to remove member');
        }
    },

    leave: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/api/organizations/${id}/leave`, {
            method: 'POST',
        });
        if (!response.ok) {
            throw new Error('Failed to leave organization');
        }
    },

    listInvitations: async (): Promise<{ invitations?: OrganizationInvitation[] }> => {
        const response = await fetch(`${API_BASE}/api/organizations/invitations`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch invitations');
        }
        return response.json();
    },

    getInvitation: async (id: string): Promise<OrganizationInvitation> => {
        const response = await fetch(`${API_BASE}/api/organizations/invitations/${id}`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch invitation');
        }
        return response.json();
    },

    acceptInvitation: async (id: string): Promise<Organization> => {
        const response = await fetch(`${API_BASE}/api/organizations/invitations/${id}/accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to accept invitation');
        }
        const data = await response.json();
        return data.organization;
    },

    declineInvitation: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/api/organizations/invitations/${id}/decline`, {
            method: 'POST',
        });
        if (!response.ok) {
            throw new Error('Failed to decline invitation');
        }
    },

    inviteMember: async (orgId: string, email: string, role?: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/api/organizations/${orgId}/invite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, role }),
        });
        if (!response.ok) {
            throw new Error('Failed to send invitation');
        }
    },
};
