/**
 * HTTP-based auth client for Expo mobile app
 * Direct fetch API calls to Better Auth backend endpoints
 * Bypasses ESM import issues with better-auth/client
 */

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';

export interface Session {
    id: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        image?: string;
        createdAt: string;
        updatedAt: string;
    };
    token: string;
    expiresAt: string;
    userId: string;
    activeOrganizationId: string | null;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse<T = unknown> {
    data: T | null;
    error: { message: string; code?: string; status?: number } | null;
}

class HTTPAuthClient {
    private baseURL: string;

    constructor(baseURL: string = API_BASE) {
        this.baseURL = baseURL;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<AuthResponse<T>> {
        try {
            const url = `${this.baseURL}/api/auth/${endpoint}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(url, {
                ...options,
                credentials: 'include',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });
            clearTimeout(timeoutId);

            const contentType = response.headers.get('content-type');
            const isJson = contentType?.includes('application/json');

            let data: unknown;
            if (isJson) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = text;
            }

            if (!response.ok) {
                const errorMessage = isJson && typeof data === 'object'
                    ? (data as any).message || (data as any).error || 'Request failed'
                    : typeof data === 'string' && data
                        ? data
                        : 'Request failed';

                return {
                    data: null,
                    error: {
                        message: errorMessage,
                        code: isJson && typeof data === 'object' ? (data as any).code : undefined,
                        status: response.status,
                    },
                };
            }

            return { data: data as T, error: null };
        } catch (error) {
            return {
                data: null,
                error: {
                    message: error instanceof Error ? error.message : 'Network error',
                },
            };
        }
    }

    private async requestAPI<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<AuthResponse<T>> {
        try {
            const url = `${this.baseURL}/api/${endpoint}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(url, {
                ...options,
                credentials: 'include',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });
            clearTimeout(timeoutId);

            const contentType = response.headers.get('content-type');
            const isJson = contentType?.includes('application/json');

            let data: unknown;
            if (isJson) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = text;
            }

            if (!response.ok) {
                const errorMessage = isJson && typeof data === 'object'
                    ? (data as any).message || (data as any).error || 'Request failed'
                    : typeof data === 'string' && data
                        ? data
                        : 'Request failed';

                return {
                    data: null,
                    error: {
                        message: errorMessage,
                        code: isJson && typeof data === 'object' ? (data as any).code : undefined,
                        status: response.status,
                    },
                };
            }

            return { data: data as T, error: null };
        } catch (error) {
            return {
                data: null,
                error: {
                    message: error instanceof Error ? error.message : 'Network error',
                },
            };
        }
    }

    // ============ Sign Up ============
    async signUpEmail(data: {
        name: string;
        email: string;
        password: string;
    }): Promise<AuthResponse<{ user: User }>> {
        return this.request('sign-up/email', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // ============ Sign In ============
    async signInEmail(data: {
        email: string;
        password: string;
    }): Promise<AuthResponse<{ user: User; session: Session }>> {
        return this.request('sign-in/email', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // ============ Sign Out ============
    async signOut(): Promise<AuthResponse<undefined>> {
        return this.request('sign-out', { method: 'POST' });
    }

    // ============ Get Session ============
    async getSession(): Promise<AuthResponse<{ session: Session; user: User }>> {
        return this.request('get-session', { method: 'GET' });
    }

    // ============ Forgot Password ============
    async forgotPassword(data: {
        email: string;
        redirectTo?: string;
    }): Promise<AuthResponse<undefined>> {
        return this.request('forgot-password', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // ============ Reset Password ============
    async resetPassword(data: {
        password: string;
        token: string;
    }): Promise<AuthResponse<{ user: User }>> {
        return this.request('reset-password', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // ============ Verify Email ============
    async verifyEmail(data: {
        code: string;
    }): Promise<AuthResponse<{ user: User }>> {
        return this.request('verify-email', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // ============ Send Verification OTP ============
    async sendVerificationOtp(data: {
        email: string;
    }): Promise<AuthResponse<undefined>> {
        return this.request('send-verification-email', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // ============ Two Factor ============
    async enableTwoFactor(): Promise<AuthResponse<{
        secret: string;
        qrCode: string;
        backupCodes: string[];
    }>> {
        return this.request('two-factor/enable', { method: 'POST' });
    }

    async verifyTwoFactorSetup(data: {
        code: string;
    }): Promise<AuthResponse<{ user: User }>> {
        return this.request('two-factor/verify-setup', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async disableTwoFactor(data: {
        password: string;
    }): Promise<AuthResponse<{ user: User }>> {
        return this.request('two-factor/disable', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async signInWithTwoFactor(data: {
        email: string;
        password: string;
        code: string;
    }): Promise<AuthResponse<{ user: User; session: Session }>> {
        return this.request('sign-in/two-factor', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async generateBackupCodes(): Promise<AuthResponse<{
        codes: string[];
    }>> {
        return this.request('two-factor/generate-backup-codes', {
            method: 'POST',
        });
    }

    // ============ Social Sign In ============
    async socialSignInCallback(data: {
        provider: string;
        code?: string;
        state?: string;
        error?: string;
    }): Promise<AuthResponse<{ user: User; session: Session }>> {
        const params = new URLSearchParams();
        if (data.code) params.set('code', data.code);
        if (data.state) params.set('state', data.state);
        if (data.error) params.set('error', data.error);

        return this.request(`callback/${data.provider}?${params.toString()}`, {
            method: 'GET',
        });
    }

    // ============ Organizations ============
    async listOrganizations(): Promise<AuthResponse<{
        organizations: Array<{
            id: string;
            name: string;
            slug: string;
            logo?: string;
            role: string;
        }>;
    }>> {
        return this.request('user/organizations', { method: 'GET' });
    }

    async getActiveOrganization(): Promise<AuthResponse<{
        organization: {
            id: string;
            name: string;
            slug: string;
        } | null;
    }>> {
        return this.request('active-organization', { method: 'GET' });
    }

    async setActiveOrganization(data: {
        organizationId: string;
    }): Promise<AuthResponse<undefined>> {
        return this.request('set-active-organization', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // ============ Sessions ============
    async listSessions(): Promise<AuthResponse<{
        sessions: Array<{
            id: string;
            token: string;
            expiresAt: string;
            ipAddress: string;
            userAgent: string;
            current: boolean;
        }>;
    }>> {
        return this.request('user/sessions', { method: 'GET' });
    }

    async revokeSession(data: {
        sessionId: string;
    }): Promise<AuthResponse<undefined>> {
        return this.request('revoke-session', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async revokeOtherSessions(): Promise<AuthResponse<undefined>> {
        return this.request('revoke-sessions', { method: 'POST' });
    }

    // ============ Update User ============
    async updateUser(data: {
        name?: string;
        image?: string;
    }): Promise<AuthResponse<{ user: User }>> {
        return this.request('update-user', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // ============ Change Password ============
    async changePassword(data: {
        currentPassword: string;
        newPassword: string;
    }): Promise<AuthResponse<{ user: User }>> {
        return this.request('change-password', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // ============ Organization CRUD ============
    async createOrganization(data: {
        name: string;
        slug: string;
    }): Promise<AuthResponse<unknown>> {
        return this.request('organization/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getFullOrganization(): Promise<AuthResponse<unknown>> {
        return this.request('organization/full', { method: 'GET' });
    }

    async listMembers(data: {
        organizationId: string;
    }): Promise<AuthResponse<unknown>> {
        return this.request(`organization/members?organizationId=${data.organizationId}`, { method: 'GET' });
    }

    async listInvitations(data: {
        organizationId: string;
    }): Promise<AuthResponse<unknown>> {
        return this.request(`organization/invitations?organizationId=${data.organizationId}`, { method: 'GET' });
    }

    async getInvitation(data: {
        id: string;
    }): Promise<AuthResponse<unknown>> {
        return this.request(`organization/invitation?id=${data.id}`, { method: 'GET' });
    }

    async acceptInvitation(data: {
        invitationId: string;
    }): Promise<AuthResponse<unknown>> {
        return this.request('organization/accept-invitation', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async rejectInvitation(data: {
        invitationId: string;
    }): Promise<AuthResponse<unknown>> {
        return this.request('organization/reject-invitation', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async createTeam(data: {
        name: string;
        organizationId: string;
    }): Promise<AuthResponse<unknown>> {
        return this.request('organization/team/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateTeam(data: {
        teamId: string;
        data: { name: string };
    }): Promise<AuthResponse<unknown>> {
        return this.request('organization/team/update', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // ============ Organization Member Management ============
    async inviteMember(data: {
        organizationId: string;
        email: string;
        role: string;
    }): Promise<AuthResponse<{ invitation: unknown }>> {
        return this.requestAPI(`organizations/${data.organizationId}/invite`, {
            method: 'POST',
            body: JSON.stringify({ email: data.email, role: data.role }),
        });
    }

    async cancelInvitation(invitationId: string): Promise<AuthResponse<undefined>> {
        return this.requestAPI(`organizations/invitations/${invitationId}`, {
            method: 'DELETE',
        });
    }

    async updateMemberRole(data: {
        organizationId: string;
        memberId: string;
        role: string;
    }): Promise<AuthResponse<undefined>> {
        return this.requestAPI(`organizations/${data.organizationId}/members/${data.memberId}`, {
            method: 'PATCH',
            body: JSON.stringify({ role: data.role }),
        });
    }

    async removeMember(data: {
        organizationId: string;
        memberIdOrEmail: string;
    }): Promise<AuthResponse<undefined>> {
        return this.requestAPI(`organizations/${data.organizationId}/members`, {
            method: 'DELETE',
            body: JSON.stringify({ memberIdOrEmail: data.memberIdOrEmail }),
        });
    }

    // ============ Organization Team Management ============
    async addTeamMember(data: {
        teamId: string;
        userId: string;
    }): Promise<AuthResponse<undefined>> {
        return this.requestAPI(`organizations/team/${data.teamId}/members`, {
            method: 'POST',
            body: JSON.stringify({ userId: data.userId }),
        });
    }

    async removeTeamMember(data: {
        teamId: string;
        userId: string;
    }): Promise<AuthResponse<undefined>> {
        return this.requestAPI(`organizations/team/${data.teamId}/members/${data.userId}`, {
            method: 'DELETE',
        });
    }

    async leaveOrganization(organizationId: string): Promise<AuthResponse<undefined>> {
        return this.requestAPI(`organizations/${organizationId}/leave`, {
            method: 'POST',
        });
    }

    async listTeams(organizationId: string): Promise<AuthResponse<{ teams: unknown[] }>> {
        return this.requestAPI(`organizations/${organizationId}/teams`, {
            method: 'GET',
        });
    }
}

export const httpAuthClient = new HTTPAuthClient();
