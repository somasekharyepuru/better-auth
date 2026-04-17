import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { createHash } from 'crypto';
import { createChildLogger } from '../common/logger.service';

const logger = createChildLogger('password-policy');

export interface PasswordPolicy {
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

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

@Injectable()
export class PasswordPolicyService {
    constructor(private prisma: PrismaService) { }

    /**
     * Hash a password for storage in password history
     * Uses HMAC-SHA256 with userId as salt for proper security
     */
    hashPassword(password: string, userId: string): string {
        const crypto = require('crypto');
        const secret = process.env.BETTER_AUTH_SECRET;
        if (!secret) {
            throw new Error('BETTER_AUTH_SECRET environment variable is required for password hashing');
        }
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(`${userId}:${password}`);
        return hmac.digest('hex');
    }

    /**
     * Get the effective password policy for a user
     * Falls back to global policy, then to defaults if none exists
     */
    async getEffectivePolicy(organizationId?: string): Promise<PasswordPolicy> {
        // First, try to get organization-specific policy
        if (organizationId) {
            const orgPolicy = await this.prisma.passwordPolicy.findUnique({
                where: { organizationId },
            });
            if (orgPolicy) {
                return orgPolicy;
            }
        }

        // Fall back to global policy (organizationId = null)
        const globalPolicy = await this.prisma.passwordPolicy.findFirst({
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
            requireUppercase: true, // Updated to true to match util
            requireLowercase: true, // Updated to true to match util
            requireNumbers: true,   // Updated to true to match util
            requireSpecialChars: false,
            preventReuse: 5,
            expirationDays: null,
        };
    }

    /**
     * Validate a password against the effective policy
     */
    async validatePassword(
        password: string,
        userId?: string,
        organizationId?: string,
    ): Promise<ValidationResult> {
        const policy = await this.getEffectivePolicy(organizationId);
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
            const newHash = this.hashPassword(password, userId);
            const recentPasswords = await this.prisma.passwordHistory.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: policy.preventReuse,
                select: { hash: true },
            });

            if (recentPasswords.some((p: { hash: string }) => p.hash === newHash)) {
                errors.push(`Cannot reuse your last ${policy.preventReuse} passwords`);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Record a password change in the history
     */
    async recordPasswordChange(userId: string, password: string): Promise<void> {
        const hash = this.hashPassword(password, userId);

        try {
            await this.prisma.passwordHistory.create({
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
            throw error;
        }
    }

    /**
     * Get the global password policy
     */
    async getGlobalPolicy(): Promise<PasswordPolicy> {
        return this.getEffectivePolicy();
    }

    /**
     * Create or update the global password policy
     */
    async updateGlobalPolicy(data: Partial<PasswordPolicy>): Promise<PasswordPolicy> {
        const existing = await this.prisma.passwordPolicy.findFirst({
            where: { organizationId: null },
        });

        if (existing) {
            return this.prisma.passwordPolicy.update({
                where: { id: existing.id },
                data: {
                    minLength: data.minLength,
                    requireUppercase: data.requireUppercase,
                    requireLowercase: data.requireLowercase,
                    requireNumbers: data.requireNumbers,
                    requireSpecialChars: data.requireSpecialChars,
                    preventReuse: data.preventReuse,
                    expirationDays: data.expirationDays,
                },
            });
        }

        return this.prisma.passwordPolicy.create({
            data: {
                organizationId: null,
                minLength: data.minLength ?? 8,
                requireUppercase: data.requireUppercase ?? true,
                requireLowercase: data.requireLowercase ?? true,
                requireNumbers: data.requireNumbers ?? true,
                requireSpecialChars: data.requireSpecialChars ?? false,
                preventReuse: data.preventReuse ?? 5,
                expirationDays: data.expirationDays ?? null,
            },
        });
    }

    /**
     * Get password policy for an organization
     */
    async getOrganizationPolicy(organizationId: string): Promise<PasswordPolicy> {
        return this.getEffectivePolicy(organizationId);
    }

    /**
     * Create or update password policy for an organization
     */
    async updateOrganizationPolicy(
        organizationId: string,
        data: Partial<PasswordPolicy>,
    ): Promise<PasswordPolicy> {
        const existing = await this.prisma.passwordPolicy.findUnique({
            where: { organizationId },
        });

        if (existing) {
            return this.prisma.passwordPolicy.update({
                where: { id: existing.id },
                data: {
                    minLength: data.minLength,
                    requireUppercase: data.requireUppercase,
                    requireLowercase: data.requireLowercase,
                    requireNumbers: data.requireNumbers,
                    requireSpecialChars: data.requireSpecialChars,
                    preventReuse: data.preventReuse,
                    expirationDays: data.expirationDays,
                },
            });
        }

        return this.prisma.passwordPolicy.create({
            data: {
                organizationId,
                minLength: data.minLength ?? 8,
                requireUppercase: data.requireUppercase ?? true,
                requireLowercase: data.requireLowercase ?? true,
                requireNumbers: data.requireNumbers ?? true,
                requireSpecialChars: data.requireSpecialChars ?? false,
                preventReuse: data.preventReuse ?? 5,
                expirationDays: data.expirationDays ?? null,
            },
        });
    }

    /**
     * Delete organization-specific policy (falls back to global)
     */
    async deleteOrganizationPolicy(organizationId: string): Promise<void> {
        await this.prisma.passwordPolicy.deleteMany({
            where: { organizationId },
        });
    }
}
