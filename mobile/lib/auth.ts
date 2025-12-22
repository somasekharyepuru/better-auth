/**
 * Authentication client for mobile app
 * Uses better-auth backend with bearer token auth
 */

import * as SecureStore from 'expo-secure-store';
import { setAuthToken, clearAuthToken, getAuthToken } from './api';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';

// User type
export interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    createdAt: string;
    updatedAt: string;
}

// Session type
export interface Session {
    user: User;
    token: string;
    expiresAt: string;
}

// Auth response types
interface AuthResponse {
    user: User;
    session?: {
        token: string;
        expiresAt: string;
    };
    token?: string;
}

interface AuthError {
    message: string;
    code?: string;
}

// Sign up
export async function signUp(data: {
    name: string;
    email: string;
    password: string;
}): Promise<{ user: User } | { error: AuthError }> {
    try {
        const response = await fetch(`${API_BASE}/api/auth/sign-up/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            return { error: { message: result.message || 'Sign up failed' } };
        }

        // Store token if provided
        if (result.token) {
            await setAuthToken(result.token);
        } else if (result.session?.token) {
            await setAuthToken(result.session.token);
        }

        return { user: result.user };
    } catch (error) {
        return { error: { message: 'Network error. Please try again.' } };
    }
}

// Sign in
export async function signIn(data: {
    email: string;
    password: string;
}): Promise<{ user: User } | { error: AuthError }> {
    try {
        const response = await fetch(`${API_BASE}/api/auth/sign-in/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            return { error: { message: result.message || 'Sign in failed' } };
        }

        // Store token
        if (result.token) {
            await setAuthToken(result.token);
        } else if (result.session?.token) {
            await setAuthToken(result.session.token);
        }

        return { user: result.user };
    } catch (error) {
        return { error: { message: 'Network error. Please try again.' } };
    }
}

// Sign out
export async function signOut(): Promise<void> {
    try {
        const token = await getAuthToken();
        if (token) {
            await fetch(`${API_BASE}/api/auth/sign-out`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
        }
    } catch {
        // Ignore sign-out errors
    } finally {
        await clearAuthToken();
    }
}

// Get current session
export async function getSession(): Promise<{ user: User } | null> {
    try {
        const token = await getAuthToken();
        if (!token) return null;

        const response = await fetch(`${API_BASE}/api/auth/get-session`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            await clearAuthToken();
            return null;
        }

        const result = await response.json();
        return result.user ? { user: result.user } : null;
    } catch {
        return null;
    }
}

// Update user profile
export async function updateUser(data: {
    name?: string;
}): Promise<{ user: User } | { error: AuthError }> {
    try {
        const token = await getAuthToken();
        if (!token) {
            return { error: { message: 'Not authenticated' } };
        }

        const response = await fetch(`${API_BASE}/api/auth/update-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            return { error: { message: result.message || 'Update failed' } };
        }

        return { user: result.user || result };
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
        const token = await getAuthToken();
        if (!token) {
            return { error: { message: 'Not authenticated' } };
        }

        const response = await fetch(`${API_BASE}/api/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
                revokeOtherSessions: true,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            return { error: { message: result.message || 'Password change failed' } };
        }

        return { success: true };
    } catch (error) {
        return { error: { message: 'Network error. Please try again.' } };
    }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
    const token = await getAuthToken();
    return !!token;
}

// Two-Factor Authentication

// Get 2FA status
export async function getTwoFactorStatus(): Promise<{ enabled: boolean } | { error: AuthError }> {
    try {
        const token = await getAuthToken();
        if (!token) {
            return { error: { message: 'Not authenticated' } };
        }

        const response = await fetch(`${API_BASE}/api/auth/two-factor/status`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return { enabled: false };
        }

        const result = await response.json();
        return { enabled: result.enabled || false };
    } catch (error) {
        return { error: { message: 'Failed to get 2FA status' } };
    }
}

// Enable 2FA - returns TOTP URI for QR code
export async function enableTwoFactor(): Promise<{ totpURI: string; backupCodes: string[] } | { error: AuthError }> {
    try {
        const token = await getAuthToken();
        if (!token) {
            return { error: { message: 'Not authenticated' } };
        }

        const response = await fetch(`${API_BASE}/api/auth/two-factor/enable`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            return { error: { message: result.message || 'Failed to enable 2FA' } };
        }

        return {
            totpURI: result.totpURI,
            backupCodes: result.backupCodes || [],
        };
    } catch (error) {
        return { error: { message: 'Network error. Please try again.' } };
    }
}

// Verify 2FA code to complete setup
export async function verifyTwoFactor(code: string): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const token = await getAuthToken();
        if (!token) {
            return { error: { message: 'Not authenticated' } };
        }

        const response = await fetch(`${API_BASE}/api/auth/two-factor/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ code }),
        });

        const result = await response.json();

        if (!response.ok) {
            return { error: { message: result.message || 'Invalid code' } };
        }

        return { success: true };
    } catch (error) {
        return { error: { message: 'Network error. Please try again.' } };
    }
}

// Disable 2FA
export async function disableTwoFactor(password: string): Promise<{ success: boolean } | { error: AuthError }> {
    try {
        const token = await getAuthToken();
        if (!token) {
            return { error: { message: 'Not authenticated' } };
        }

        const response = await fetch(`${API_BASE}/api/auth/two-factor/disable`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ password }),
        });

        const result = await response.json();

        if (!response.ok) {
            return { error: { message: result.message || 'Failed to disable 2FA' } };
        }

        return { success: true };
    } catch (error) {
        return { error: { message: 'Network error. Please try again.' } };
    }
}

