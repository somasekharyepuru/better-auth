/**
 * Standalone password policy utility for use in auth.config.ts
 * Uses PrismaClient directly instead of NestJS DI
 */
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { createChildLogger } from '../common/logger.service';

const logger = createChildLogger('password-policy');
const prisma = new PrismaClient();

interface PasswordPolicy {
    id: string;
    organizationId: string | null;
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    preventReuse: number;
    expirationDays: number | null;
}

/**
 * Hash a password for comparison with history
 * Uses HMAC-SHA256 with BETTER_AUTH_SECRET for proper security
 */
function hashPassword(password: string, userId: string): string {
    const crypto = require('crypto');
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) {
        throw new Error('BETTER_AUTH_SECRET environment variable is required for password hashing');
    }
    // Combine userId with password, then HMAC with server secret
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${userId}:${password}`);
    return hmac.digest('hex');
}

/**
 * Get the effective password policy
 */
async function getEffectivePolicy(organizationId?: string): Promise<PasswordPolicy> {
    // First, try to get organization-specific policy
    if (organizationId) {
        const orgPolicy = await prisma.passwordPolicy.findUnique({
            where: { organizationId },
        });
        if (orgPolicy) {
            return orgPolicy;
        }
    }

    // Fall back to global policy (organizationId = null)
    const globalPolicy = await prisma.passwordPolicy.findFirst({
        where: { organizationId: null },
    });

    if (globalPolicy) {
        return globalPolicy;
    }

    // Return defaults if no policy exists
    return {
        id: 'default',
        organizationId: null,
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        preventReuse: 5,
        expirationDays: null,
    };
}

/**
 * Validate a password against the effective policy
 * Throws an error with message if validation fails
 */
export async function validatePasswordPolicy(
    password: string,
    userId?: string,
): Promise<void> {
    const policy = await getEffectivePolicy();
    const errors: string[] = [];

    // Check minimum length
    if (password.length < policy.minLength) {
        errors.push(`Password must be at least ${policy.minLength} characters long`);
    }

    // Check for uppercase letters
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    // Check for lowercase letters
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    // Check for numbers
    if (policy.requireNumbers && !/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    // Check for special characters
    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    // Check password history for reuse
    if (userId && policy.preventReuse > 0) {
        const newHash = hashPassword(password, userId);
        const recentPasswords = await prisma.passwordHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: policy.preventReuse,
            select: { hash: true },
        });

        if (recentPasswords.some((p: { hash: string }) => p.hash === newHash)) {
            errors.push(`Cannot reuse your last ${policy.preventReuse} passwords`);
        }
    }

    if (errors.length > 0) {
        throw new Error(errors.join('. '));
    }
}

/**
 * Record a password change in the history
 */
export async function recordPasswordInHistory(userId: string, password: string): Promise<void> {
    const hash = hashPassword(password, userId);

    try {
        await prisma.passwordHistory.create({
            data: {
                userId,
                hash,
            },
        });
        logger.info('Password recorded in history', { userId });
    } catch (error: any) {
        // Ignore unique constraint violations (same password hash already exists)
        if (error.code === 'P2002') {
            logger.debug('Password hash already in history', { userId });
            return;
        }
        logger.error('Failed to record password in history', { error, userId });
        // Don't throw - recording failure shouldn't block the operation
    }
}

/**
 * Check if a user's password has expired based on the effective policy
 * @returns Object with { expired: boolean, passwordAgeInDays: number, policyDays: number | null }
 */
export async function checkPasswordExpiration(userId: string): Promise<{
    expired: boolean;
    passwordAgeInDays: number;
    policyExpirationDays: number | null;
    lastPasswordChange: Date | null;
}> {
    // Get the most recent password history entry
    const lastPassword = await prisma.passwordHistory.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });

    if (!lastPassword) {
        // No password history found - user may have been created before history tracking
        return {
            expired: false,
            passwordAgeInDays: 0,
            policyExpirationDays: null,
            lastPasswordChange: null,
        };
    }

    const policy = await getEffectivePolicy();
    const passwordAgeInDays = Math.floor(
        (Date.now() - lastPassword.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const expired =
        policy.expirationDays !== null && policy.expirationDays > 0 &&
        passwordAgeInDays >= policy.expirationDays;

    return {
        expired,
        passwordAgeInDays,
        policyExpirationDays: policy.expirationDays,
        lastPasswordChange: lastPassword.createdAt,
    };
}
