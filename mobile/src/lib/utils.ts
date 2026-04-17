/**
 * Utility functions for mobile auth SDK
 * Re-exports from specialized modules for convenience
 */

export * from './secure-utils';
export * from './error-utils';
export * from './abort-utils';

/**
 * Get initials from name for avatar display
 *
 * @param name - The full name to get initials from
 * @returns One or two character initials string
 */
export function getInitials(name: string | null): string {
    if (!name) return '?';

    const parts = name.trim().split(' ');
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Format date for display
 *
 * @param date - Date or string to format
 * @returns Formatted date string (e.g., "Jan 15, 2026")
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format date with relative time
 *
 * @param date - Date or string to format
 * @returns Relative time string (e.g., "2h ago", "3d ago")
 */
export function formatRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return formatDate(d);
}

/**
 * Deep link handler interface for OAuth and email verification callbacks
 */
export interface DeepLinkHandler {
    handleDeepLink: (url: string) => Promise<boolean>;
}

/**
 * Parse OAuth callback from deep link
 *
 * @param url - The deep link URL to parse
 * @returns Parsed OAuth parameters or null if invalid
 */
export function parseOAuthCallback(url: string): {
    code?: string;
    state?: string;
    error?: string;
} | null {
    try {
        const parsed = new URL(url);
        return {
            code: parsed.searchParams.get('code') || undefined,
            state: parsed.searchParams.get('state') || undefined,
            error: parsed.searchParams.get('error') || undefined,
        };
    } catch {
        return null;
    }
}

/**
 * Parse email verification callback from deep link
 *
 * @param url - The deep link URL to parse
 * @returns Parsed email verification parameters or null if invalid
 */
export function parseEmailVerificationCallback(url: string): {
    email?: string;
    otp?: string;
    error?: string;
} | null {
    try {
        const parsed = new URL(url);
        return {
            email: parsed.searchParams.get('email') || undefined,
            otp: parsed.searchParams.get('otp') || undefined,
            error: parsed.searchParams.get('error') || undefined,
        };
    } catch {
        return null;
    }
}

/**
 * Safe JSON parse with fallback
 *
 * @param json - JSON string to parse
 * @param fallback - Value to return if parsing fails
 * @returns Parsed object or fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
    try {
        return JSON.parse(json) as T;
    } catch {
        return fallback;
    }
}

/**
 * Get user display name
 *
 * @param user - User object
 * @returns Display name (name or email)
 */
export function getUserDisplayName(user: { name: string | null; email: string }): string {
    return user.name || user.email;
}

/**
 * Get user avatar text (initials)
 *
 * @param user - User object
 * @returns One or two character initials
 */
export function getUserAvatarText(user: { name: string | null; email: string }): string {
    return getInitials(user.name);
}

/**
 * Convert hex color to RGBA string for React Native
 *
 * @param hex - Hex color string (e.g., "#FF0000" or "#F00")
 * @param alpha - Opacity value 0-1 (default 1)
 * @returns RGBA color string (e.g., "rgba(255, 0, 0, 0.5)")
 */
export function applyAlpha(hex: string, alpha: number = 1): string {
    const sanitized = hex.replace('#', '');
    const hasShortFormat = sanitized.length === 3;
    const hexR = hasShortFormat ? sanitized[0] + sanitized[0] : sanitized.substring(0, 2);
    const hexG = hasShortFormat ? sanitized[1] + sanitized[1] : sanitized.substring(2, 4);
    const hexB = hasShortFormat ? sanitized[2] + sanitized[2] : sanitized.substring(4, 6);

    const r = parseInt(hexR, 16);
    const g = parseInt(hexG, 16);
    const b = parseInt(hexB, 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
