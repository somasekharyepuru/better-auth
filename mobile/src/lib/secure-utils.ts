/**
 * Secure utility functions
 * Cryptographically secure random generation
 */

/**
 * Generate cryptographically secure random string
 * Uses Web Crypto API for better security than Math.random()
 */
export function generateSecureRandomString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint32Array(length);

    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(array);
    } else {
        // Fallback for environments without crypto (should not happen in modern React Native)
        for (let i = 0; i < length; i++) {
            array[i] = Math.floor(Math.random() * 0xFFFFFFFF);
        }
    }

    return Array.from(array, (x) => chars[x % chars.length]).join('');
}

/**
 * Validate email format more strictly
 */
export function isValidEmail(email: string): boolean {
    // More comprehensive email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate password strength
 */
export interface PasswordValidationResult {
    isValid: boolean;
    reasons: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
    const reasons: string[] = [];

    if (password.length < 8) {
        reasons.push('Password must be at least 8 characters');
    }
    if (password.length > 128) {
        reasons.push('Password must be less than 128 characters');
    }
    if (!/[A-Z]/.test(password)) {
        reasons.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        reasons.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        reasons.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        reasons.push('Password must contain at least one special character');
    }

    return {
        isValid: reasons.length === 0,
        reasons,
    };
}
