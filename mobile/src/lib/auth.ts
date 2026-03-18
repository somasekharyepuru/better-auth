/**
 * Authentication helpers for mobile app
 * Comprehensive auth functions matching frontend functionality
 * Type-safe error handling without 'any' types
 *
 * Better Auth v1.4.13 compatible
 */

import { authClient, httpAuthClient } from './auth-client';
import {
    createError,
    getErrorMessage,
} from './error-utils';
import { ERROR_MESSAGES } from './error-messages';
import type {
    User,
    AuthError,
    Organization,
    Member,
    Invitation,
    Team,
    SessionInfo,
    AuditLog,
    UserRole,
    TransferInfo,
} from './types';
import { ROLE_HIERARCHY } from './role-info';

// ============ Type Guards ============

/**
 * Type guard for Better Auth success result
 */
interface SuccessResult<T> {
    data: T;
    error: null;
}

/**
 * Type guard for Better Auth error result
 */
interface ErrorResult {
    data: null;
    error: { message: string; code?: string; status?: number };
}

type AuthResult<T> = SuccessResult<T> | ErrorResult;

function isSuccess<T>(result: AuthResult<T>): result is SuccessResult<T> {
    return result.error === null;
}

/**
 * Check if result has a redirect (for 2FA)
 */
function isRedirectResult(data: unknown): data is { redirect: boolean; url?: string } {
    return typeof data === 'object' && data !== null && 'redirect' in data;
}

// ============ Core Authentication ============

/**
 * Sign up with email and password
 *
 * @param data - User registration data
 * @returns User object or error
 */
export async function signUp(data: {
    name: string;
    email: string;
    password: string;
}): Promise<{ user: User } | { error: AuthError }> {
    try {
        const result = await authClient.signUp.email({
            name: data.name,
            email: data.email,
            password: data.password,
        });

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.AUTH.SIGN_UP_FAILED,
                    code: result.error.code,
                    status: result.error.status,
                },
            };
        }

        if (!result.data?.user) {
            return { error: { message: ERROR_MESSAGES.AUTH.NO_USER_RETURNED } };
        }

        return { user: result.data.user as unknown as User };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.AUTH.SIGN_UP_FAILED) };
    }
}

/**
 * Sign in with email and password
 *
 * @param data - User credentials
 * @returns User object with optional 2FA flag, or error
 */
export async function signIn(data: {
    email: string;
    password: string;
}): Promise<{ user: User; requiresTwoFactor?: boolean } | { error: AuthError }> {
    try {
        const result = await authClient.signIn.email({
            email: data.email,
            password: data.password,
        });

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.AUTH.SIGN_IN_FAILED,
                    code: result.error.code,
                    status: result.error.status,
                },
            };
        }

        if (!result.data) {
            return { error: { message: ERROR_MESSAGES.AUTH.NO_USER_RETURNED } };
        }

        // Check if result is a redirect (2FA required)
        if (isRedirectResult(result.data)) {
            // Two-factor authentication required - but this result type doesn't have user
            return {
                error: { message: 'Two-factor authentication required' },
            };
        }

        // Normal sign in with user data
        const signInData = result.data as unknown as { user?: User };
        if (signInData.user) {
            return {
                user: signInData.user,
                requiresTwoFactor: false,
            };
        }

        return { error: { message: ERROR_MESSAGES.AUTH.NO_USER_RETURNED } };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.AUTH.SIGN_IN_FAILED) };
    }
}

/**
 * Sign in with two-factor authentication code
 *
 * @param data - User credentials and 2FA code
 * @returns User object or error
 */
/**
 * Result shape for two-factor verification
 */
interface TwoFactorVerifyResult {
    error?: { message?: string };
}

/**
 * Two-factor client interface with optional verification methods
 */
interface TwoFactorClient {
    verifySetup?: (params: { code: string }) => Promise<TwoFactorVerifyResult | null>;
    verifyTotp?: (params: { code: string }) => Promise<TwoFactorVerifyResult | null>;
}

export async function signInWithTwoFactor(data: {
    email: string;
    password: string;
    code: string;
}): Promise<{ user: User } | { error: AuthError }> {
    try {
        // For 2FA sign in, we need to use the verifyTotp endpoint
        const twoFactorClient = authClient.twoFactor;
        if (!twoFactorClient) {
            return { error: { message: ERROR_MESSAGES.TWO_FACTOR.NOT_ENABLED } };
        }

        const tfClient = twoFactorClient as TwoFactorClient;
        const verifyFn = tfClient.verifySetup ?? tfClient.verifyTotp;
        if (!verifyFn) {
            return { error: { message: ERROR_MESSAGES.TWO_FACTOR.NOT_ENABLED } };
        }
        const rawResult = await verifyFn({
            code: data.code,
        });
        const result = rawResult as TwoFactorVerifyResult | null;

        if (result?.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.TWO_FACTOR.VERIFY_FAILED,
                },
            };
        }

        // After successful 2FA, get the session
        const sessionResult = await authClient.getSession();
        if (!sessionResult.data?.user) {
            return { error: { message: ERROR_MESSAGES.AUTH.NO_SESSION } };
        }

        return { user: sessionResult.data.user as unknown as User };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.AUTH.SIGN_IN_FAILED) };
    }
}

/**
 * Sign in with social provider (Google, Microsoft, Apple)
 *
 * @param provider - The social provider to use
 * @returns User object or error
 */
export async function signInSocial(
    provider: 'google' | 'microsoft' | 'apple'
): Promise<{ user: User } | { error: AuthError }> {
    try {
        const result = await (authClient.signIn.social as unknown as (data: { provider: string; callbackURL: string }) => Promise<{ data: unknown; error: { message: string } | null }>)({
            provider,
            callbackURL: 'mobile://callback',
        });

        if (result.error) {
            return {
                error: {
                    message: result.error.message || `${provider} sign in failed`,
                },
            };
        }

        // Social sign in may return redirect or user data
        if (!result.data) {
            return {
                error: {
                    message: `${provider} sign in failed - no data returned`,
                },
            };
        }

        if (isRedirectResult(result.data)) {
            // Redirect to OAuth provider
            return { error: { message: `Redirecting to ${provider}...` } };
        }

        const data = result.data as { user?: User };
        if (data.user) {
            return { user: data.user };
        }

        return {
            error: {
                message: `${provider} sign in failed - no user returned`,
            },
        };
    } catch (error) {
        return {
            error: createError(error, `${provider} sign in failed`),
        };
    }
}

/**
 * Sign out current user
 *
 * @returns Success indicator or error
 */
export async function signOut(): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        await authClient.signOut();
        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.AUTH.SIGN_OUT_FAILED) };
    }
}

/**
 * Get current session
 *
 * @returns Session with user or null if not authenticated
 */
export async function getSession(): Promise<{
    user: User;
    session: {
        id: string;
        activeOrganizationId: string | null;
        expiresAt: Date;
        token: string;
        userId: string;
    } | null;
} | null> {
    try {
        const result = await authClient.getSession();
        if (result.data?.user) {
            // Normalize session type to ensure activeOrganizationId is not undefined
            const rawSession = result.data.session;
            const session = rawSession ? {
                ...rawSession,
                activeOrganizationId: rawSession.activeOrganizationId ?? null,
            } : null;
            return {
                user: result.data.user as unknown as User,
                session: session as unknown as { id: string; activeOrganizationId: string | null; expiresAt: Date; token: string; userId: string; } | null,
            };
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Get active organization
 *
 * @returns Active organization or null
 * Note: This is retrieved from the session
 */
export async function getActiveOrganization(): Promise<{
    organization: Organization | null;
}> {
    try {
        // Active organization is stored in the session
        const sessionData = await getSession();
        if (sessionData?.session?.activeOrganizationId) {
            // Get full organization details
            const result = await authClient.organization.getFullOrganization();
            if (result.data) {
                return { organization: result.data as Organization };
            }
        }
        return { organization: null };
    } catch {
        return { organization: null };
    }
}

/**
 * Update user profile
 *
 * @param data - User profile updates
 * @returns Success indicator or error
 */
export async function updateUser(data: {
    name?: string;
    image?: string;
}): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const result = await authClient.updateUser(data);

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.PROFILE.UPDATE_FAILED,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.PROFILE.UPDATE_FAILED) };
    }
}

// ============ Password Management ============

/**
 * Change password for authenticated user
 *
 * @param data - Current and new password
 * @returns Success indicator or error
 */
export async function changePassword(data: {
    currentPassword: string;
    newPassword: string;
}): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const result = await authClient.changePassword({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
        });

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.PASSWORD.CHANGE_FAILED,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.PASSWORD.CHANGE_FAILED) };
    }
}

/**
 * Initiate forgot password flow
 *
 * @param email - User email address
 * @returns Success indicator or error
 */
export async function forgotPassword(
    email: string
): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const result = await authClient.forgotPassword({ email });

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.PASSWORD.RESET_FAILED,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.PASSWORD.RESET_FAILED) };
    }
}

/**
 * Reset password with token
 *
 * @param data - Password and token
 * @returns Success indicator or error
 */
export async function resetPassword(data: {
    password: string;
    token: string;
}): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const result = await authClient.resetPassword({
            password: data.password,
            token: data.token,
        });

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.PASSWORD.RESET_FAILED,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.PASSWORD.RESET_FAILED) };
    }
}

// ============ Email Verification ============

/**
 * Send OTP for email verification
 *
 * @param email - Email address to verify
 * @returns Success indicator or error
 */
export async function sendVerificationOtp(
    email: string
): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const result = await authClient.sendVerificationOtp({ email });

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.EMAIL_OTP.SEND_FAILED,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.EMAIL_OTP.SEND_FAILED) };
    }
}

/**
 * Verify email with code
 *
 * @param data - Code to verify
 * @returns Success indicator or error
 */
export async function verifyEmail(data: {
    code: string;
}): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const result = await authClient.verifyEmail({ code: data.code });

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.EMAIL_OTP.VERIFY_FAILED,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.EMAIL_OTP.VERIFY_FAILED) };
    }
}

// ============ Two-Factor Authentication ============

/**
 * Get two-factor client safely
 */
function getTwoFactorClient() {
    const client = authClient as unknown as {
        twoFactor?: {
            enable: (params: { password: string }) => Promise<unknown>;
            verifySetup: (params: { code: string }) => Promise<unknown>;
            verifyTotp: (params: { code: string }) => Promise<unknown>;
            disable: (params: { password: string }) => Promise<unknown>;
            generateBackupCodes: (params: { password: string }) => Promise<unknown>;
        };
    };
    return client.twoFactor;
}

/**
 * Enable two-factor authentication
 *
 * @param password - User's current password
 * @returns TOTP URI and backup codes, or error
 */
export async function enableTwoFactor(
    password: string
): Promise<{ totpURI?: string; backupCodes?: string[] } | { error: AuthError }> {
    try {
        const twoFactor = getTwoFactorClient();
        if (!twoFactor) {
            return { error: { message: ERROR_MESSAGES.TWO_FACTOR.NOT_AVAILABLE } };
        }

        const result = await twoFactor.enable({ password });

        if (!result || typeof result !== 'object') {
            return { error: { message: ERROR_MESSAGES.TWO_FACTOR.ENABLE_FAILED } };
        }

        if ('error' in result && result.error) {
            return {
                error: {
                    message: (result.error as { message?: string }).message || ERROR_MESSAGES.TWO_FACTOR.ENABLE_FAILED,
                },
            };
        }

        const data = result as {
            totpURI?: string;
            backupCodes?: string[];
        };

        return {
            totpURI: data.totpURI,
            backupCodes: data.backupCodes,
        };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.TWO_FACTOR.ENABLE_FAILED) };
    }
}

/**
 * Verify TOTP setup
 *
 * @param code - TOTP code to verify
 * @returns Success indicator or error
 */
export async function verifyTwoFactorSetup(
    code: string
): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const twoFactor = getTwoFactorClient();
        if (!twoFactor) {
            return { error: { message: ERROR_MESSAGES.TWO_FACTOR.NOT_AVAILABLE } };
        }

        const result = await twoFactor.verifyTotp({ code });

        if (!result || typeof result !== 'object') {
            return { error: { message: ERROR_MESSAGES.TWO_FACTOR.VERIFY_FAILED } };
        }

        if ('error' in result && result.error) {
            return {
                error: {
                    message: (result.error as { message?: string }).message || ERROR_MESSAGES.TWO_FACTOR.VERIFY_FAILED,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.TWO_FACTOR.VERIFY_FAILED) };
    }
}

/**
 * Disable two-factor authentication
 *
 * @param password - User's current password
 * @returns Success indicator or error
 */
export async function disableTwoFactor(
    password: string
): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const twoFactor = getTwoFactorClient();
        if (!twoFactor) {
            return { error: { message: ERROR_MESSAGES.TWO_FACTOR.NOT_AVAILABLE } };
        }

        const result = await twoFactor.disable({ password });

        if (!result || typeof result !== 'object') {
            return { error: { message: ERROR_MESSAGES.TWO_FACTOR.DISABLE_FAILED } };
        }

        if ('error' in result && result.error) {
            return {
                error: {
                    message: (result.error as { message?: string }).message || ERROR_MESSAGES.TWO_FACTOR.DISABLE_FAILED,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.TWO_FACTOR.DISABLE_FAILED) };
    }
}

/**
 * Generate new backup codes
 *
 * @param password - User's current password
 * @returns New backup codes or error
 */
export async function generateBackupCodes(
    password: string
): Promise<{ backupCodes?: string[] } | { error: AuthError }> {
    try {
        const twoFactor = getTwoFactorClient();
        if (!twoFactor) {
            return { error: { message: ERROR_MESSAGES.TWO_FACTOR.NOT_AVAILABLE } };
        }

        const result = await twoFactor.generateBackupCodes({ password });

        if (!result || typeof result !== 'object') {
            return { error: { message: ERROR_MESSAGES.TWO_FACTOR.BACKUP_CODES_FAILED } };
        }

        if ('error' in result && result.error) {
            return {
                error: {
                    message: (result.error as { message?: string }).message || ERROR_MESSAGES.TWO_FACTOR.BACKUP_CODES_FAILED,
                },
            };
        }

        const data = result as { backupCodes?: string[] };
        return { backupCodes: data.backupCodes };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.TWO_FACTOR.BACKUP_CODES_FAILED) };
    }
}

// ============ Organization Management ============

/**
 * List all organizations for current user
 *
 * @returns List of organizations or error
 */
export async function listOrganizations(): Promise<
    { organizations: Organization[] } | { error: AuthError }
> {
    try {
        const result = await authClient.organization.list();

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.ORG.FETCH_FAILED,
                },
            };
        }

        if (!result.data) {
            return { organizations: [] };
        }

        const orgData = result.data as { organizations?: unknown[] };
        return { organizations: (orgData.organizations ?? []) as Organization[] };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.ORG.FETCH_FAILED) };
    }
}

/**
 * Create a new organization
 *
 * @param data - Organization name and slug
 * @returns Created organization or error
 */
export async function createOrganization(data: {
    name: string;
    slug?: string;
}): Promise<{ organization: Organization } | { error: AuthError }> {
    try {
        // Generate slug from name if not provided
        const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-');

        const result = await authClient.organization.create({
            name: data.name,
            slug,
        });

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.ORG.CREATE_FAILED,
                },
            };
        }

        if (!result.data) {
            return { error: { message: ERROR_MESSAGES.ORG.CREATE_FAILED } };
        }

        return { organization: result.data as Organization };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.ORG.CREATE_FAILED) };
    }
}

/**
 * Set active organization
 *
 * @param organizationId - Organization ID to set as active
 * @returns Success indicator or error
 */
export async function setActiveOrganization(
    organizationId: string
): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const result = await authClient.organization.setActive({
            organizationId,
        });

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.ORG.SET_ACTIVE_FAILED,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.ORG.SET_ACTIVE_FAILED) };
    }
}

/**
 * Get full organization details
 *
 * @returns Organization details or error
 */
export async function getFullOrganization(): Promise<
    { organization: Organization | null } | { error: AuthError }
> {
    try {
        const result = await authClient.organization.getFullOrganization();

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.ORG.FETCH_FAILED,
                },
            };
        }

        return { organization: (result.data as Organization | null) };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.ORG.FETCH_FAILED) };
    }
}

/**
 * List members of an organization
 *
 * @param organizationId - Organization ID
 * @returns List of members or error
 */
export async function listMembers(
    organizationId: string
): Promise<{ members: Member[] } | { error: AuthError }> {
    try {
        const result = await authClient.organization.listMembers({
            query: { organizationId },
        });

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.ORG.MEMBERS_FETCH_FAILED,
                },
            };
        }

        if (!result.data) {
            return { members: [] };
        }

        // Result data may be { members, total } or just members array
        const membersData = result.data as { members?: Member[] } | Member[];
        const members = Array.isArray(membersData) ? membersData : (membersData.members ?? []);

        return { members };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.ORG.MEMBERS_FETCH_FAILED) };
    }
}

/**
 * Remove a member from organization
 *
 * @param params - Member ID and organization ID
 * @returns Success indicator or error
 */
export async function removeMember(params: {
    memberIdOrEmail: string;
    organizationId: string;
}): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const result = await authClient.organization.removeMember(params);

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.ORG.MEMBER_REMOVE_FAILED,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.ORG.MEMBER_REMOVE_FAILED) };
    }
}

/**
 * Leave an organization
 *
 * @param organizationId - Organization ID to leave
 * @returns Success indicator or error
 */
export async function leaveOrganization(
    organizationId: string
): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const result = await httpAuthClient.leaveOrganization(organizationId);

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.ORG.LEAVE_FAILED,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.ORG.LEAVE_FAILED) };
    }
}

/**
 * Update member role
 *
 * @param params - Member ID, role, and organization ID
 * @returns Success indicator or error
 */
export async function updateMemberRole(params: {
    memberId: string;
    role: UserRole;
    organizationId: string;
}): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const result = await authClient.organization.updateMemberRole(params);

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.ORG.ROLE_UPDATE_FAILED,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.ORG.ROLE_UPDATE_FAILED) };
    }
}

/**
 * List invitations for an organization
 *
 * @param organizationId - Organization ID
 * @returns List of invitations or error
 */
export async function listInvitations(
    organizationId: string
): Promise<{ invitations: Invitation[] } | { error: AuthError }> {
    try {
        const result = await authClient.organization.listInvitations({
            query: { organizationId },
        });

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.ORG.INVITATIONS_FETCH_FAILED,
                },
            };
        }

        if (!result.data) {
            return { invitations: [] };
        }

        return { invitations: result.data as Invitation[] };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.ORG.INVITATIONS_FETCH_FAILED) };
    }
}

/**
 * Get invitation details
 *
 * @param invitationId - Invitation ID
 * @returns Invitation details or error
 */
export async function getInvitation(
    invitationId: string
): Promise<{ invitation: Invitation } | { error: AuthError }> {
    try {
        const result = await authClient.organization.getInvitation({
            query: { id: invitationId },
        });

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.ORG.INVITATION_FETCH_FAILED,
                },
            };
        }

        if (!result.data) {
            return { error: { message: ERROR_MESSAGES.ORG.INVITATION_FETCH_FAILED } };
        }

        return { invitation: result.data as Invitation };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.ORG.INVITATION_FETCH_FAILED) };
    }
}

/**
 * Accept organization invitation
 *
 * @param invitationId - Invitation ID
 * @returns Success indicator or error
 */
export async function acceptInvitation(
    invitationId: string
): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const result = await authClient.organization.acceptInvitation({
            invitationId,
        });

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.ORG.INVITATION_ACCEPT_FAILED,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.ORG.INVITATION_ACCEPT_FAILED) };
    }
}

/**
 * Reject organization invitation
 *
 * @param invitationId - Invitation ID
 * @returns Success indicator or error
 */
export async function rejectInvitation(
    invitationId: string
): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const result = await authClient.organization.rejectInvitation({
            invitationId,
        });

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.ORG.INVITATION_REJECT_FAILED,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.ORG.INVITATION_REJECT_FAILED) };
    }
}

/**
 * Invite a member to an organization
 *
 * @param params - Organization ID, email, and role
 * @returns Created invitation or error
 */
/**
 * Normalize invitation data from API response
 * Handles both direct invitation objects and nested { invitation: ... } responses
 */
function parseInvitation(data: unknown): Invitation {
    if (typeof data === 'object' && data !== null && 'invitation' in data) {
        return (data as { invitation: unknown }).invitation as Invitation;
    }
    return data as Invitation;
}

export async function inviteMember(params: {
    organizationId: string;
    email: string;
    role: UserRole;
}): Promise<{ invitation: Invitation } | { error: AuthError }> {
    try {
        const result = await authClient.organization.inviteMember({
            organizationId: params.organizationId,
            email: params.email,
            role: params.role,
        });

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.ORG.INVITATION_SEND_FAILED,
                },
            };
        }

        if (!result.data) {
            return { error: { message: ERROR_MESSAGES.ORG.INVITATION_SEND_FAILED } };
        }

        return { invitation: parseInvitation(result.data) };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.ORG.INVITATION_SEND_FAILED) };
    }
}

/**
 * Cancel a pending organization invitation
 *
 * @param invitationId - Invitation ID to cancel
 * @returns Success indicator or error
 */
export async function cancelInvitation(
    invitationId: string
): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const result = await authClient.organization.cancelInvitation({
            invitationId,
        });

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.INVITATION.CANCEL_FAILED,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.INVITATION.CANCEL_FAILED) };
    }
}

// ============ Team Management ============

/**
 * List teams in an organization
 *
 * @param organizationId - Organization ID
 * @returns List of teams or error
 */
export async function listTeams(
    organizationId: string
): Promise<{ teams: Team[] } | { error: AuthError }> {
    try {
        const result = await authClient.organization.listTeams({
            query: { organizationId },
        });

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.TEAM.FETCH_FAILED,
                },
            };
        }

        if (!result.data) {
            return { teams: [] };
        }

        const teamsData = result.data as { teams?: unknown[] } | unknown;
        const teams = (typeof teamsData === 'object' && teamsData !== null && 'teams' in teamsData) ? (teamsData as { teams: unknown[] }).teams : teamsData;
        return { teams: (teams ?? []) as Team[] };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.TEAM.FETCH_FAILED) };
    }
}

/**
 * Create a new team
 *
 * @param params - Team name and organization ID
 * @returns Created team or error
 */
export async function createTeam(params: {
    name: string;
    organizationId: string;
}): Promise<{ team: Team } | { error: AuthError }> {
    try {
        const result = await authClient.organization.createTeam({
            name: params.name,
            organizationId: params.organizationId,
        });

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.TEAM.CREATE_FAILED,
                },
            };
        }

        if (!result.data) {
            return { error: { message: ERROR_MESSAGES.TEAM.CREATE_FAILED } };
        }

        return { team: result.data as Team };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.TEAM.CREATE_FAILED) };
    }
}

/**
 * Update team name
 *
 * @param params - Team ID and new name
 * @returns Success indicator or error
 */
export async function updateTeam(params: {
    teamId: string;
    name: string;
}): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const result = await authClient.organization.updateTeam({
            teamId: params.teamId,
            data: { name: params.name },
        });

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.TEAM.UPDATE_FAILED,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.TEAM.UPDATE_FAILED) };
    }
}

/**
 * Delete a team
 *
 * @param teamId - Team ID to delete
 * @returns Success indicator or error
 */
export async function deleteTeam(
    teamId: string
): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        // Use direct fetch as deleteTeam might not be in the client
        const response = await fetch(`${getApiBaseURL()}/organization/team/${teamId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            return {
                error: {
                    message: ERROR_MESSAGES.TEAM.DELETE_FAILED,
                    status: response.status,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.TEAM.DELETE_FAILED) };
    }
}

/**
 * Add member to team
 *
 * @param params - Team ID and user ID
 * @returns Success indicator or error
 */
export async function addTeamMember(params: {
    teamId: string;
    userId: string;
}): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const result = await authClient.organization.addTeamMember(params);

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.TEAM.MEMBER_ADD_FAILED,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.TEAM.MEMBER_ADD_FAILED) };
    }
}

/**
 * Remove member from team
 *
 * @param params - Team ID and user ID
 * @returns Success indicator or error
 */
export async function removeTeamMember(params: {
    teamId: string;
    userId: string;
}): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const result = await authClient.organization.removeTeamMember(params);

        if (result.error) {
            return {
                error: {
                    message: result.error.message || ERROR_MESSAGES.TEAM.MEMBER_REMOVE_FAILED,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.TEAM.MEMBER_REMOVE_FAILED) };
    }
}

// ============ Session Management ============

/**
 * Get API base URL for direct fetch calls
 */
function getApiBaseURL(): string {
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';
}

/**
 * List all sessions for current user
 *
 * @returns List of sessions or error
 */
export async function listSessions(): Promise<
    { sessions: SessionInfo[] } | { error: AuthError }
> {
    try {
        const response = await fetch(`${getApiBaseURL()}/sessions/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            return {
                error: {
                    message: ERROR_MESSAGES.SESSION.FETCH_FAILED,
                    status: response.status,
                },
            };
        }

        const sessions = (await response.json()) as SessionInfo[];
        return { sessions };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.SESSION.FETCH_FAILED) };
    }
}

/**
 * Revoke a specific session
 *
 * @param sessionId - Session ID to revoke
 * @returns Success indicator or error
 */
export async function revokeSession(
    sessionId: string
): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const response = await fetch(`${getApiBaseURL()}/sessions/me/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            return {
                error: {
                    message: ERROR_MESSAGES.SESSION.REVOKE_FAILED,
                    status: response.status,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.SESSION.REVOKE_FAILED) };
    }
}

/**
 * Revoke all other sessions except current
 *
 * @returns Success indicator or error
 */
export async function revokeOtherSessions(): Promise<
    { success: boolean } | { error: AuthError }
> {
    try {
        const response = await fetch(`${getApiBaseURL()}/sessions/me`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            return {
                error: {
                    message: ERROR_MESSAGES.SESSION.REVOKE_ALL_FAILED,
                    status: response.status,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.SESSION.REVOKE_ALL_FAILED) };
    }
}

// ============ Audit Logging ============

/**
 * Get audit logs for an organization
 *
 * @param organizationId - Organization ID
 * @returns List of audit logs or error
 */
export async function getAuditLogs(
    organizationId: string
): Promise<{ logs: AuditLog[] } | { error: AuthError }> {
    try {
        const response = await fetch(
            `${getApiBaseURL()}/admin/audit-logs?organizationId=${organizationId}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            }
        );

        if (!response.ok) {
            return {
                error: {
                    message: ERROR_MESSAGES.AUDIT.FETCH_FAILED,
                    status: response.status,
                },
            };
        }

        const logs = (await response.json()) as AuditLog[];
        return { logs };
    } catch (error) {
        return { error: createError(error, ERROR_MESSAGES.AUDIT.FETCH_FAILED) };
    }
}

// ============ Role Helpers ============

/**
 * Get role hierarchy level
 *
 * @param role - User role
 * @returns Hierarchy level (higher = more permissions)
 */
export function getRoleLevel(role: UserRole): number {
    return ROLE_HIERARCHY[role] ?? 0;
}

/**
 * Check if a role has permission over another role
 *
 * @param userRole - The user's role
 * @param targetRole - The target role to check against
 * @returns true if userRole has higher or equal permissions
 */
export function hasRoleOver(userRole: UserRole, targetRole: UserRole): boolean {
    return getRoleLevel(userRole) >= getRoleLevel(targetRole);
}

/**
 * Check if user can perform admin-level actions
 *
 * @param role - User's role
 * @returns true if role is admin or higher
 */
export function isAdmin(role: UserRole): boolean {
    return getRoleLevel(role) >= getRoleLevel('admin');
}

/**
 * Check if user is owner
 *
 * @param role - User's role
 * @returns true if role is owner
 */
export function isOwner(role: UserRole): boolean {
    return role === 'owner';
}

// ============ Ownership Transfer ============

/**
 * Get ownership transfer status for an organization
 *
 * @param orgId - Organization ID
 * @returns Transfer info or error
 */
export async function getTransferStatus(
    orgId: string
): Promise<{ transfer: TransferInfo | null } | { error: AuthError }> {
    try {
        const response = await fetch(`${getApiBaseURL()}/api/organizations/${orgId}/transfer`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            return {
                error: {
                    message: 'Failed to get transfer status',
                    status: response.status,
                },
            };
        }

        const transfer = await response.json();
        return { transfer };
    } catch (error) {
        return { error: createError(error, 'Failed to get transfer status') };
    }
}

/**
 * Initiate ownership transfer
 *
 * @param orgId - Organization ID
 * @param newOwnerId - ID of the user to transfer ownership to
 * @returns Success indicator or error
 */
export async function initiateOwnershipTransfer(
    orgId: string,
    newOwnerId: string
): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const response = await fetch(`${getApiBaseURL()}/api/organizations/${orgId}/transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ newOwnerId }),
        });

        if (!response.ok) {
            return {
                error: {
                    message: 'Failed to initiate transfer',
                    status: response.status,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, 'Failed to initiate transfer') };
    }
}

/**
 * Cancel pending ownership transfer
 *
 * @param orgId - Organization ID
 * @returns Success indicator or error
 */
export async function cancelOwnershipTransfer(
    orgId: string
): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const response = await fetch(`${getApiBaseURL()}/api/organizations/${orgId}/transfer`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            return {
                error: {
                    message: 'Failed to cancel transfer',
                    status: response.status,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, 'Failed to cancel transfer') };
    }
}

/**
 * Get ownership transfer details by token
 *
 * @param token - Transfer token
 * @returns Transfer info or error
 */
export async function getTransferDetails(
    token: string
): Promise<{ transfer: TransferInfo } | { error: AuthError }> {
    try {
        const response = await fetch(`${getApiBaseURL()}/api/organizations/transfer/confirm/${token}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            return {
                error: {
                    message: 'Failed to get transfer details',
                    status: response.status,
                },
            };
        }

        const transfer = await response.json();
        return { transfer };
    } catch (error) {
        return { error: createError(error, 'Failed to get transfer details') };
    }
}

/**
 * Confirm or decline ownership transfer
 *
 * @param token - Transfer token
 * @param action - 'accept' or 'decline'
 * @returns Success indicator or error
 */
export async function confirmTransfer(
    token: string,
    action: 'accept' | 'decline'
): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const response = await fetch(`${getApiBaseURL()}/api/organizations/transfer/confirm/${token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ action }),
        });

        if (!response.ok) {
            return {
                error: {
                    message: `Failed to ${action} transfer`,
                    status: response.status,
                },
            };
        }

        return { success: true };
    } catch (error) {
        return { error: createError(error, `Failed to ${action} transfer`) };
    }
}

// ============ Organization Ban Status ============

/**
 * Get organization ban status
 *
 * @param orgId - Organization ID
 * @returns Ban status or error
 */
export async function getOrgBanStatus(
    orgId: string
): Promise<{ isBanned: boolean; reason?: string } | { error: AuthError }> {
    try {
        const response = await fetch(`${getApiBaseURL()}/api/admin/organizations/${orgId}/ban-status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            return {
                error: {
                    message: 'Failed to check ban status',
                    status: response.status,
                },
            };
        }

        const data = await response.json();
        return {
            isBanned: data.isBanned || false,
            reason: data.reason,
        };
    } catch (error) {
        return { error: createError(error, 'Failed to check ban status') };
    }
}
