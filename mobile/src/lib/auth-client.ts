/**
 * Auth client for Expo mobile app
 * Uses HTTP-based client to call Better Auth backend directly
 * Bypasses ESM import issues with better-auth/client
 */

import { httpAuthClient } from './http-auth-client';

export type { Session, User } from './http-auth-client';

/**
 * Auth client that mirrors the Better Auth client API
 * Uses HTTP requests instead of the Better Auth SDK
 */
export const authClient = {
    // ============ Sign Up ============
    signUp: {
        email: async (data: { name: string; email: string; password: string }) => {
            return httpAuthClient.signUpEmail(data);
        },
    },

    // ============ Sign In ============
    signIn: {
        email: async (data: { email: string; password: string }) => {
            return httpAuthClient.signInEmail(data);
        },
        social: {
            google: {
                callback: async (data: { code?: string; state?: string; error?: string }) => {
                    return httpAuthClient.socialSignInCallback({ provider: 'google', ...data });
                }
            },
            microsoft: {
                callback: async (data: { code?: string; state?: string; error?: string }) => {
                    return httpAuthClient.socialSignInCallback({ provider: 'microsoft', ...data });
                }
            },
        },
    },

    // ============ Sign Out ============
    signOut: async () => {
        return httpAuthClient.signOut();
    },

    // ============ Session ============
    getSession: async () => {
        return httpAuthClient.getSession();
    },

    // ============ Password ============
    forgotPassword: async (data: { email: string; redirectTo?: string }) => {
        return httpAuthClient.forgotPassword(data);
    },

    resetPassword: async (data: { password: string; token: string }) => {
        return httpAuthClient.resetPassword(data);
    },

    changePassword: async (data: { currentPassword: string; newPassword: string }) => {
        return httpAuthClient.changePassword(data);
    },

    // ============ Email Verification ============
    sendVerificationOtp: async (data: { email: string }) => {
        return httpAuthClient.sendVerificationOtp(data);
    },

    verifyEmail: async (data: { code: string }) => {
        return httpAuthClient.verifyEmail(data);
    },

    // ============ Two Factor ============
    twoFactor: {
        enable: async () => {
            return httpAuthClient.enableTwoFactor();
        },
        verifySetup: async (data: { code: string }) => {
            return httpAuthClient.verifyTwoFactorSetup(data);
        },
        disable: async (data: { password: string }) => {
            return httpAuthClient.disableTwoFactor(data);
        },
        generateBackupCodes: async () => {
            return httpAuthClient.generateBackupCodes();
        },
    },

    signInWithTwoFactor: async (data: {
        email: string;
        password: string;
        code: string;
    }) => {
        return httpAuthClient.signInWithTwoFactor(data);
    },

    // ============ User ============
    updateUser: async (data: { name?: string; image?: string }) => {
        return httpAuthClient.updateUser(data);
    },

    // ============ Organizations ============
    organization: {
        list: async () => {
            return httpAuthClient.listOrganizations();
        },
        getActive: async () => {
            return httpAuthClient.getActiveOrganization();
        },
        setActive: async (data: { organizationId: string }) => {
            return httpAuthClient.setActiveOrganization(data);
        },
        create: async (data: { name: string; slug: string }) => {
            return httpAuthClient.createOrganization(data);
        },
        getFullOrganization: async () => {
            return httpAuthClient.getFullOrganization();
        },
        listMembers: async (data: { query: { organizationId: string } }) => {
            return httpAuthClient.listMembers({ organizationId: data.query.organizationId });
        },
        removeMember: async (data: { memberIdOrEmail: string; organizationId: string }) => {
            return httpAuthClient.removeMember(data);
        },
        updateMemberRole: async (data: { memberId: string; role: string; organizationId: string }) => {
            return httpAuthClient.updateMemberRole(data);
        },
        listInvitations: async (data: { query: { organizationId: string } }) => {
            return httpAuthClient.listInvitations({ organizationId: data.query.organizationId });
        },
        getInvitation: async (data: { query: { id: string } }) => {
            return httpAuthClient.getInvitation({ id: data.query.id });
        },
        acceptInvitation: async (data: { invitationId: string }) => {
            return httpAuthClient.acceptInvitation(data);
        },
        rejectInvitation: async (data: { invitationId: string }) => {
            return httpAuthClient.rejectInvitation(data);
        },
        inviteMember: async (data: { organizationId: string; email: string; role: string }) => {
            return httpAuthClient.inviteMember(data);
        },
        cancelInvitation: async (data: { invitationId: string }) => {
            return httpAuthClient.cancelInvitation(data.invitationId);
        },
        listTeams: async (data: { query: { organizationId: string } }) => {
            return httpAuthClient.listTeams(data.query.organizationId);
        },
        createTeam: async (data: { name: string; organizationId: string }) => {
            return httpAuthClient.createTeam(data);
        },
        updateTeam: async (data: { teamId: string; data: { name: string } }) => {
            return httpAuthClient.updateTeam(data);
        },
        addTeamMember: async (data: { teamId: string; userId: string }) => {
            return httpAuthClient.addTeamMember(data);
        },
        removeTeamMember: async (data: { teamId: string; userId: string }) => {
            return httpAuthClient.removeTeamMember(data);
        },
    },

    // ============ Sessions ============
    session: {
        list: async () => {
            return httpAuthClient.listSessions();
        },
        revoke: async (data: { sessionId: string }) => {
            return httpAuthClient.revokeSession(data);
        },
        revokeOthers: async () => {
            return httpAuthClient.revokeOtherSessions();
        },
    },
};

/**
 * Get the current API base URL
 */
export function getApiBaseURL(): string {
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';
}

/**
 * Validate the client configuration
 */
export function validateClientConfig(): boolean {
    const apiURL = process.env.EXPO_PUBLIC_API_URL;
    if (!apiURL) {
        console.warn('[auth-mobile] EXPO_PUBLIC_API_URL not set');
        return false;
    }
    try {
        new URL(apiURL);
        return true;
    } catch {
        console.warn('[auth-mobile] EXPO_PUBLIC_API_URL is invalid:', apiURL);
        return false;
    }
}
