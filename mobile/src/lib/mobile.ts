/**
 * Mobile-specific utilities and helpers
 * Deep link handling, biometric auth, push notifications
 */

import { Linking, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import type { User, AuthError } from './types';
import { getInitials } from './utils';

// ============ Deep Link Handling ============

/**
 * Deep link URL schemes supported by the app
 */
export const DEEP_LINK_SCHEMES = {
    MOBILE: 'mobile://',
    EXP: 'exp://',
    // Add your custom schemes here
} as const;

/**
 * Open deep link URL
 *
 * @param url - The URL to open
 * @returns Promise resolving to true if successful
 */
export async function openDeepLink(url: string): Promise<boolean> {
    try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

/**
 * Get initial URL from deep link
 *
 * @returns Promise resolving to the initial URL or null
 */
export async function getInitialURL(): Promise<string | null> {
    try {
        const initialUrl = await Linking.getInitialURL();
        return initialUrl;
    } catch {
        return null;
    }
}

/**
 * Subscribe to deep link events
 *
 * @param callback - Function to call when deep link received
 * @returns Object with remove function to unsubscribe
 */
export function subscribeToDeepLinks(callback: (url: string) => void): {
    remove: () => void;
} {
    const subscription = Linking.addEventListener('url', ({ url }) => {
        callback(url);
    });

    return {
        remove: () => subscription.remove(),
    };
}

/**
 * Parse email verification deep link
 */
export interface EmailVerificationParams {
    email: string;
    otp: string;
}

/**
 * Parse email verification link
 *
 * @param url - The deep link URL to parse
 * @returns Parsed email verification parameters or null
 */
export function parseEmailVerificationLink(url: string): EmailVerificationParams | null {
    try {
        const parsed = new URL(url);
        const email = parsed.searchParams.get('email');
        const otp = parsed.searchParams.get('otp');

        if (email && otp) {
            return { email, otp };
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Parse organization invitation deep link
 */
export interface InvitationParams {
    invitationId: string;
    token: string;
}

/**
 * Parse invitation link
 *
 * @param url - The deep link URL to parse
 * @returns Parsed invitation parameters or null
 */
export function parseInvitationLink(url: string): InvitationParams | null {
    try {
        const parsed = new URL(url);
        const invitationId = parsed.searchParams.get('invitationId');
        const token = parsed.searchParams.get('token');

        if (invitationId && token) {
            return { invitationId, token };
        }
        return null;
    } catch {
        return null;
    }
}

// ============ Biometric Authentication ============

/**
 * Check if biometric authentication is available
 *
 * @returns Promise resolving to true if biometric auth is available and enrolled
 */
export async function isBiometricAvailable(): Promise<boolean> {
    try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        return compatible && enrolled;
    } catch {
        return false;
    }
}

/**
 * Get biometric authentication type
 *
 * @returns Promise resolving to biometric type or null
 */
export async function getBiometricType(): Promise<'face' | 'fingerprint' | null> {
    try {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            return 'face';
        }
        if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            return 'fingerprint';
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Authenticate with biometrics
 *
 * @param promptMessage - Message to show in biometric prompt
 * @returns Promise resolving to true if authentication succeeded
 */
export async function authenticateWithBiometrics(
    promptMessage: string = 'Authenticate to continue'
): Promise<boolean> {
    try {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage,
            fallbackLabel: 'Use password',
            cancelLabel: 'Cancel',
        });

        return result.success;
    } catch {
        return false;
    }
}

/**
 * Backward-compatible alias aligned with mobile-features.ts naming.
 */
export async function authenticateBiometric(
    promptMessage: string = 'Authenticate to continue'
): Promise<boolean> {
    return authenticateWithBiometrics(promptMessage);
}

// ============ Push Notifications ============

/**
 * Push notification types
 */
export enum PushNotificationType {
    SIGN_IN = 'sign_in',
    SECURITY_ALERT = 'security_alert',
    EMAIL_VERIFICATION = 'email_verification',
    PASSWORD_CHANGE = 'password_change',
    TWO_FACTOR_ENABLED = '2fa_enabled',
    TWO_FACTOR_DISABLED = '2fa_disabled',
    NEW_DEVICE = 'new_device',
    ORGANIZATION_INVITE = 'org_invite',
    ROLE_CHANGE = 'role_change',
}

/**
 * Push notification data structure
 */
export interface PushNotificationData {
    type: PushNotificationType;
    userId: string;
    organizationId?: string;
    timestamp: number;
    data?: Record<string, unknown>;
}

/**
 * Parse push notification data
 *
 * @param data - The notification data to parse
 * @returns Parsed notification data or null
 */
export function parsePushNotificationData(data: Record<string, unknown>): PushNotificationData | null {
    try {
        const type = data.type as PushNotificationType;
        const userId = data.userId as string;

        if (!type || !userId) {
            return null;
        }

        return {
            type,
            userId,
            organizationId: data.organizationId as string | undefined,
            timestamp: data.timestamp as number || Date.now(),
            data: data.data as Record<string, unknown> | undefined,
        };
    } catch {
        return null;
    }
}

// ============ Secure Storage Helpers ============

/**
 * Storage keys for secure storage
 */
export const STORAGE_KEYS = {
    SESSION_TOKEN: 'auth_session_token',
    REFRESH_TOKEN: 'auth_refresh_token',
    USER_ID: 'auth_user_id',
    BIOMETRIC_ENABLED: 'auth_biometric_enabled',
    LAST_ACTIVE_ORG: 'auth_last_active_org',
    DEVICE_ID: 'auth_device_id',
} as const;

// ============ Platform Detection ============

/**
 * Check if running on iOS
 *
 * @returns true if running on iOS
 */
export function isIOS(): boolean {
    return Platform.OS === 'ios';
}

/**
 * Check if running on Android
 *
 * @returns true if running on Android
 */
export function isAndroid(): boolean {
    return Platform.OS === 'android';
}

/**
 * Check if running on web
 *
 * @returns true if running on web
 */
export function isWeb(): boolean {
    return Platform.OS === 'web';
}

// ============ Error Handling ============

/**
 * Format auth error for display
 *
 * @param error - The error to format
 * @returns User-friendly error message
 */
export function formatAuthError(error: AuthError): string {
    if (error.status === 401) {
        return 'Invalid email or password';
    }
    if (error.status === 409) {
        return 'An account with this email already exists';
    }
    if (error.status === 429) {
        return 'Too many attempts. Please try again later';
    }
    if (error.status && error.status >= 500) {
        return 'Server error. Please try again later';
    }
    return error.message || 'An error occurred';
}

/**
 * Check if error is network error
 *
 * @param error - The error to check
 * @returns true if the error appears to be network-related
 */
export function isNetworkError(error: AuthError): boolean {
    return !error.status && error.message.includes('Network');
}

// ============ Session Helpers ============

/**
 * Check if session is expired
 *
 * @param expiresAt - Session expiration date
 * @returns true if session has expired
 */
export function isSessionExpired(expiresAt: Date | string): boolean {
    const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    return expiry.getTime() < Date.now();
}

/**
 * Get session time remaining in milliseconds
 *
 * @param expiresAt - Session expiration date
 * @returns Milliseconds remaining until expiration
 */
export function getSessionTimeRemaining(expiresAt: Date | string): number {
    const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    return Math.max(0, expiry.getTime() - Date.now());
}

/**
 * Format session time remaining for display
 *
 * @param expiresAt - Session expiration date
 * @returns Human-readable time remaining string
 */
export function formatSessionTimeRemaining(expiresAt: Date | string): string {
    const ms = getSessionTimeRemaining(expiresAt);
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''}`;
    }
    if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return 'Less than a minute';
}

// ============ User Display Helpers ============

/**
 * Get user display name
 *
 * @param user - User object
 * @returns Display name (name or email)
 */
export function getUserDisplayName(user: User): string {
    return user.name || user.email;
}

/**
 * Get user avatar text (initials)
 *
 * @param user - User object
 * @returns One or two character initials
 */
export function getUserAvatarText(user: User): string {
    return getInitials(user.name);
}
