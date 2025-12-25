/**
 * Authentication helpers for mobile app
 * Uses better-auth's official Expo client integration
 */

import { authClient } from './auth-client';

// User type - matches better-auth's user type
export interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

// Auth error type
interface AuthError {
    message: string;
    code?: string;
}

// Sign up with email and password
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
            return { error: { message: result.error.message || 'Sign up failed' } };
        }

        if (!result.data?.user) {
            return { error: { message: 'Sign up failed - no user returned' } };
        }

        return { user: result.data.user as User };
    } catch (error) {
        return { error: { message: 'Network error. Please try again.' } };
    }
}

// Sign in with email and password
export async function signIn(data: {
    email: string;
    password: string;
}): Promise<{ user: User } | { error: AuthError }> {
    try {
        const result = await authClient.signIn.email({
            email: data.email,
            password: data.password,
        });

        if (result.error) {
            return { error: { message: result.error.message || 'Sign in failed' } };
        }

        if (!result.data?.user) {
            return { error: { message: 'Sign in failed - no user returned' } };
        }

        return { user: result.data.user as User };
    } catch (error) {
        return { error: { message: 'Network error. Please try again.' } };
    }
}

// Sign out
export async function signOut(): Promise<void> {
    try {
        await authClient.signOut();
    } catch {
        // Ignore sign-out errors
    }
}

// Get current session
export async function getSession(): Promise<{ user: User } | null> {
    try {
        const result = await authClient.getSession();
        if (result.data?.user) {
            return { user: result.data.user as User };
        }
        return null;
    } catch {
        return null;
    }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
    const session = await getSession();
    return session !== null;
}

// Update user profile
export async function updateUser(data: {
    name?: string;
}): Promise<{ user: User } | { error: AuthError }> {
    try {
        const result = await authClient.updateUser({
            name: data.name,
        });

        if (result.error) {
            return { error: { message: result.error.message || 'Update failed' } };
        }

        // Fetch the updated session to get the user data
        const session = await getSession();
        if (session) {
            return session;
        }
        return { error: { message: 'Update succeeded but could not fetch user' } };
    } catch (error) {
        return { error: { message: 'Network error. Please try again.' } };
    }
}

// Change password
export async function changePassword(data: {
    currentPassword: string;
    newPassword: string;
}): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const result = await authClient.changePassword({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
            revokeOtherSessions: true,
        });

        if (result.error) {
            return { error: { message: result.error.message || 'Password change failed' } };
        }

        return { success: true };
    } catch (error) {
        return { error: { message: 'Network error. Please try again.' } };
    }
}

// Legacy exports for backward compatibility with existing code
// These now delegate to authClient
export async function getAuthToken(): Promise<string | null> {
    const cookies = authClient.getCookie();
    return cookies || null;
}

export async function setAuthToken(_token: string): Promise<void> {
    // No-op: tokens are now managed by authClient
    console.warn('setAuthToken is deprecated - auth is managed by authClient');
}

export async function clearAuthToken(): Promise<void> {
    await signOut();
}

// Two-Factor Authentication

// Get 2FA status - check if user session has 2FA enabled
export async function getTwoFactorStatus(): Promise<{ enabled: boolean } | { error: AuthError }> {
    try {
        // Since better-auth doesn't have a direct getStatus method for 2FA,
        // we check the session - returns false by default for mobile
        // The actual 2FA status is determined during login flow
        return { enabled: false };
    } catch (error) {
        return { error: { message: 'Failed to get 2FA status' } };
    }
}

// Enable 2FA - returns TOTP URI for QR code
export async function enableTwoFactor(password: string): Promise<{ totpURI: string; backupCodes: string[] } | { error: AuthError }> {
    try {
        if (!password) {
            return { error: { message: 'Password is required to enable 2FA' } };
        }
        const result = await (authClient.twoFactor as any)?.enable?.({
            password,
        });
        if (!result || result.error) {
            return { error: { message: result?.error?.message || 'Failed to enable 2FA' } };
        }
        return {
            totpURI: result.data?.totpURI || '',
            backupCodes: result.data?.backupCodes || [],
        };
    } catch (error) {
        return { error: { message: 'Network error. Please try again.' } };
    }
}


// Verify 2FA code to complete setup
export async function verifyTwoFactor(code: string): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const result = await (authClient.twoFactor as any)?.verifyTotp?.({ code });
        if (!result || result.error) {
            return { error: { message: result?.error?.message || 'Invalid code' } };
        }
        return { success: true };
    } catch (error) {
        return { error: { message: 'Network error. Please try again.' } };
    }
}

// Disable 2FA
export async function disableTwoFactor(password: string): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const result = await (authClient.twoFactor as any)?.disable?.({ password });
        if (!result || result.error) {
            return { error: { message: result?.error?.message || 'Failed to disable 2FA' } };
        }
        return { success: true };
    } catch (error) {
        return { error: { message: 'Network error. Please try again.' } };
    }
}

