import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';
import { emailOTP, admin, twoFactor, organization, haveIBeenPwned } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import { createAuthMiddleware } from 'better-auth/api';
import { expo } from '@better-auth/expo';
import { emailQueueService } from '../email-queue/email-queue.service';
import { auditService } from '../audit/audit.service';
import { createChildLogger } from '../common/logger.service';
import { trackDeviceLogin } from '../device-tracking/device-tracking.util';
import { validatePasswordPolicy, recordPasswordInHistory } from '../password-policy/password-policy.util';
import { APIError } from 'better-auth/api';

const logger = createChildLogger('auth');

/**
 * Security: Validate IP address format to prevent injection attacks
 * Matches IPv4 (x.x.x.x) and IPv6 formats, rejects invalid formats
 */
function isValidIpAddress(ip: string | null | undefined): boolean {
    if (!ip || ip === 'unknown') return false;
    // IPv4 with optional port, IPv6, reject overly long values
    const ipRegex = /^((?:[0-9]{1,3}\.){3}[0-9]{1,3})(?::\d+)?$|^::1$|^::ffff:(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^[a-fA-F0-9:]+$/;
    return ipRegex.test(ip) && ip.length < 46;
}

/**
 * Security: Extract and validate IP address from headers
 * Returns validated IP or 'unknown' if invalid
 */
function getSafeIpAddress(headers: Headers | null): string {
    if (!headers) return 'unknown';

    // Try x-forwarded-for (leftmost is client IP when trusted proxy is configured)
    const forwardedFor = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwardedFor && isValidIpAddress(forwardedFor)) {
        return forwardedFor;
    }

    // Try x-real-ip
    const realIp = headers.get('x-real-ip')?.trim();
    if (realIp && isValidIpAddress(realIp)) {
        return realIp;
    }

    // Try cf-connecting-ip (Cloudflare)
    const cfIp = headers.get('cf-connecting-ip')?.trim();
    if (cfIp && isValidIpAddress(cfIp)) {
        return cfIp;
    }

    return 'unknown';
}

// Track OTP sends to handle Better Auth's duplicate callback issue
// Better Auth calls sendVerificationOTP multiple times with different OTPs
// We need to send only the LAST OTP (the one stored in database)
const otpSendCache = new Map<string, { otp: string; timestamp: number; timeout: NodeJS.Timeout }>();
const OTP_DEBOUNCE_MS = 100; // Wait for all rapid calls to complete
const OTP_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

let otpCacheCleanupInterval: NodeJS.Timeout | null = null;

function cleanupStaleOtpCacheEntries() {
    const now = Date.now();
    for (const [key, value] of otpSendCache.entries()) {
        if (now - value.timestamp > OTP_CACHE_TTL_MS) {
            clearTimeout(value.timeout);
            otpSendCache.delete(key);
        }
    }
}

function startOtpCacheCleaner() {
    if (otpCacheCleanupInterval) {
        return otpCacheCleanupInterval;
    }

    otpCacheCleanupInterval = setInterval(cleanupStaleOtpCacheEntries, OTP_CACHE_TTL_MS);
    return otpCacheCleanupInterval;
}

export function stopOtpCacheCleaner() {
    if (otpCacheCleanupInterval) {
        clearInterval(otpCacheCleanupInterval);
        otpCacheCleanupInterval = null;
    }

    for (const [key, value] of otpSendCache.entries()) {
        clearTimeout(value.timeout);
        otpSendCache.delete(key);
    }
}

// Backward-compatible alias for callers/tests that prefer an explicit "clear" name
export const clearOtpCleanupInterval = stopOtpCacheCleaner;

// Register shutdown hooks once per process so cleaner is stopped on app teardown/hot-reload.
const OTP_CLEANUP_HOOKS_REGISTERED_KEY = '__authOtpCleanupHooksRegistered__';
const otpCleanerHookGlobal = globalThis as typeof globalThis & {
    [OTP_CLEANUP_HOOKS_REGISTERED_KEY]?: boolean;
};
if (!otpCleanerHookGlobal[OTP_CLEANUP_HOOKS_REGISTERED_KEY]) {
    process.once('SIGINT', stopOtpCacheCleaner);
    process.once('SIGTERM', stopOtpCacheCleaner);
    process.once('beforeExit', stopOtpCacheCleaner);
    otpCleanerHookGlobal[OTP_CLEANUP_HOOKS_REGISTERED_KEY] = true;
}

startOtpCacheCleaner();

const prisma = new PrismaClient();

// Create access control for organization permissions
const statement = {
    user: ['create', 'read', 'update', 'delete'],
    organization: ['update', 'delete'],
    member: ['create', 'read', 'update', 'delete'],
    invitation: ['create', 'read', 'cancel'],
    team: ['create', 'read', 'update', 'delete'],
    ac: ['create', 'read', 'update', 'delete'], // Role management permissions
} as const;

const ac = createAccessControl(statement);

// Define roles with permissions
const owner = ac.newRole({
    user: ['create', 'read', 'update', 'delete'],
    organization: ['update', 'delete'],
    member: ['create', 'read', 'update', 'delete'],
    invitation: ['create', 'read', 'cancel'],
    team: ['create', 'read', 'update', 'delete'],
    ac: ['create', 'read', 'update', 'delete'], // Full role management
});

const adminRole = ac.newRole({
    user: ['create', 'read', 'update', 'delete'],
    organization: ['update'],
    member: ['create', 'read', 'update', 'delete'],
    invitation: ['create', 'read', 'cancel'],
    team: ['create', 'read', 'update', 'delete'],
    ac: ['create', 'read', 'update', 'delete'], // Full role management
});

const member = ac.newRole({
    user: ['read'],
    organization: [],
    member: ['read'],
    invitation: [],
    team: ['read'],
    ac: ['read'], // Can view roles only
});

// Custom role example: Manager
const manager = ac.newRole({
    user: ['read', 'update'],
    organization: ['update'],
    member: ['create', 'read', 'update', 'delete'],
    invitation: ['create', 'read', 'cancel'],
    team: ['create', 'read', 'update'],
    ac: ['read'], // Can view roles only
});

// Custom role example: Viewer (read-only)
const viewer = ac.newRole({
    user: ['read'],
    organization: [],
    member: [],
    invitation: [],
    team: ['read'],
    ac: [], // No role access
});

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3002',
    basePath: '/api/auth',
    trustedOrigins: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
        : [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:5173',
            'http://localhost:4173',
            'http://localhost:8080',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:4173',
            'http://127.0.0.1:8080',
            `mobile://${process.env.MOBILE_APP_SCHEME || 'auth-service'}`, // Specific app scheme only
            ...(process.env.NODE_ENV === 'development' ? [
                process.env.EXPO_DEV_URL || 'exp://localhost:8081', // Expo Go dev server
            ] : []),
        ],
    // Advanced settings for mobile app support
    advanced: {
        // Use CSRF protection but allow mobile clients with proper header
        // Mobile clients should include X-Mobile-Auth: true header
        // 
        // ⚠️  WARNING: NEVER set disableCSRFCheck to true in production!
        // ⚠️  This would expose the application to Cross-Site Request Forgery attacks.
        // ⚠️  Mobile apps should use the X-Mobile-Auth header instead.
        disableCSRFCheck: false,
        // Cross-subdomain cookies disabled for security
        // If needed for mobile deep linking, enable with explicit domain restrictions
        crossSubDomainCookies: {
            enabled: false,
        },
    },

    database: prismaAdapter(prisma, {
        provider: 'postgresql',
    }),
    // Note: Removed auto-add to default organization.
    // Users must explicitly create or be invited to organizations.
    user: {
        additionalFields: {
            role: {
                type: 'string',
                required: false,
                defaultValue: 'user',
                input: false,
                returned: true,
            },
        },
        changeEmail: {
            enabled: true,
            updateEmailWithoutVerification: false,
        },
    },
    // Database hooks for entity lifecycle events (user, session, account)
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    // Log user signup
                    await auditService.logUserAction(user.id, 'user.signup', {
                        email: user.email,
                        method: 'email',
                        name: user.name,
                    });
                    logger.info('User signup audited', { userId: user.id, email: user.email });
                }
            },
            update: {
                after: async (user) => {
                    // Log user profile update
                    await auditService.logUserAction(user.id, 'user.update', {
                        email: user.email,
                    });
                }
            }
        },
        session: {
            create: {
                after: async (session) => {
                    // Log user login (session creation = successful login)
                    await auditService.logUserAction(session.userId, 'user.login', {
                        sessionId: session.id,
                        expiresAt: session.expiresAt,
                    });
                    logger.info('User login audited', { userId: session.userId, sessionId: session.id });
                }
            }
        }
    },
    // HTTP request/response hooks for events not covered by databaseHooks
    hooks: {
        // Before hook: Validate password against policy before signup or any password change
        // Also captures session data before logout (since session is destroyed in after hook)
        before: createAuthMiddleware(async (ctx) => {
            const path = ctx.path;
            const password = ctx.body?.password || ctx.body?.newPassword;

            // Extract IP and User Agent from request
            // Security: Use validated IP extraction to prevent injection
            const ipAddress = getSafeIpAddress(ctx.headers ?? null);
            const userAgent = ctx.headers?.get('user-agent') || 'unknown';

            // All paths that accept a new password
            const passwordPaths = [
                '/sign-up/email',       // New user signup
                '/reset-password',      // Forgot password flow
                '/change-password',     // Authenticated user changing password
            ];

            if (passwordPaths.includes(path) && password) {
                try {
                    // For change-password, we can check history since user is authenticated
                    const session = (ctx.context as any)?.session;
                    const userId = session?.userId;
                    await validatePasswordPolicy(password, userId);
                } catch (error: any) {
                    throw new APIError('BAD_REQUEST', {
                        message: error.message || 'Password does not meet policy requirements',
                    });
                }
            }

            // Log sign-out events in BEFORE hook to capture session before destruction
            // NOTE: The /sign-out endpoint doesn't use sessionMiddleware, so ctx.context.session is NOT populated
            // We need to manually fetch the session from the database using the session token from cookies
            if (path === '/sign-out') {
                try {
                    // Get session token from signed cookie
                    const sessionTokenName = ctx.context?.authCookies?.sessionToken?.name || 'better-auth.session_token';
                    const sessionToken = await ctx.getSignedCookie(sessionTokenName, ctx.context?.secret);

                    if (sessionToken) {
                        // Fetch session from database before it's deleted
                        const session = await prisma.session.findUnique({
                            where: { token: sessionToken },
                            select: { id: true, userId: true, expiresAt: true },
                        });

                        if (session) {
                            await auditService.logUserAction(session.userId, 'user.logout.completed', {
                                sessionId: session.id,
                                expiresAt: session.expiresAt,
                            }, session.id, ipAddress, userAgent);
                            logger.info('User logout audited', { userId: session.userId, sessionId: session.id });
                        } else {
                            logger.warn('Sign-out called but session not found in database');
                        }
                    } else {
                        logger.warn('Sign-out called but no session token in cookies');
                    }
                } catch (error) {
                    logger.error('Failed to audit sign-out', { error });
                }
            }
        }),
        // After hook: Audit logging, device tracking, password history
        after: createAuthMiddleware(async (ctx) => {
            const path = ctx.path;
            const returned = ctx.context?.returned as any;

            // Extract IP and User Agent from request
            // Security: Use validated IP extraction to prevent injection
            const ipAddress = getSafeIpAddress(ctx.headers ?? null);
            const userAgent = ctx.headers?.get('user-agent') || 'unknown';

            // Log forgot password OTP requests (Email OTP plugin path)
            // NOTE: The endpoint returns { success: true } on success
            if (path === '/email-otp/send-verification-otp' && returned?.success) {
                const email = ctx.body?.email;
                const type = ctx.body?.type;

                // Only log for forget-password type
                if (type === 'forget-password' && email) {
                    const session = (ctx.context as any)?.session;

                    if (session?.userId) {
                        // Authenticated user requesting password reset
                        await auditService.logUserAction(session.userId, 'user.password.reset.otp.request', {
                            email: session.user?.email || email,
                            type,
                        }, session.id, ipAddress, userAgent);
                        logger.info('Password reset OTP request audited (authenticated)', { userId: session.userId });
                    } else {
                        // Anonymous user requesting password reset - try to find user by email
                        try {
                            const user = await prisma.user.findUnique({
                                where: { email },
                                select: { id: true },
                            });

                            if (user) {
                                await auditService.logUserAction(user.id, 'user.password.reset.otp.request', {
                                    email,
                                    type,
                                }, undefined, ipAddress, userAgent);
                                logger.info('Password reset OTP request audited', { userId: user.id, email });
                            } else {
                                // User not found (might not exist yet)
                                await auditService.logAction({
                                    userId: 'anonymous',
                                    action: 'user.password.reset.otp.request',
                                    details: { email, type },
                                    ipAddress,
                                    userAgent,
                                });
                                logger.info('Password reset OTP request audited (anonymous)', { email });
                            }
                        } catch (error) {
                            logger.error('Failed to audit OTP request', { error, email });
                        }
                    }
                }
            }

            // Also log traditional forgot-password requests for link-based flow
            if (path === '/forgot-password') {
                const session = (ctx.context as any)?.session;
                const email = ctx.body?.email;

                if (session?.userId) {
                    await auditService.logUserAction(session.userId, 'user.password.reset.request', {
                        email: session.user?.email || email,
                    }, session.id, ipAddress, userAgent);
                    logger.info('Password reset request audited (authenticated)', { userId: session.userId });
                } else if (email) {
                    await auditService.logAction({
                        userId: 'anonymous',
                        action: 'user.password.reset.request',
                        details: { email },
                        ipAddress,
                        userAgent,
                    });
                    logger.info('Password reset request audited (anonymous)', { email });
                }
            }

            // Log Email OTP password reset completion and record in history
            // NOTE: The Email OTP resetPassword endpoint only returns { success: true }
            // We need to look up the user by email to get the userId for audit logging
            if (path === '/email-otp/reset-password' && returned?.success) {
                const email = ctx.body?.email;

                if (email) {
                    try {
                        // Look up user by email since the endpoint doesn't return user data
                        const user = await prisma.user.findUnique({
                            where: { email },
                            select: { id: true },
                        });

                        if (user) {
                            await auditService.logUserAction(user.id, 'user.password.reset.otp', {
                                success: true,
                                email,
                            }, undefined, ipAddress, userAgent);
                            logger.info('Password reset via OTP audited', { userId: user.id, email });

                            // Record password in history to prevent reuse
                            const password = ctx.body?.password;
                            if (password) {
                                await recordPasswordInHistory(user.id, password);
                            }
                        } else {
                            // User not found (shouldn't happen if reset succeeded)
                            await auditService.logAction({
                                userId: 'unknown',
                                action: 'user.password.reset.otp',
                                details: { success: true, email, warning: 'user_not_found' },
                                ipAddress,
                                userAgent,
                            });
                            logger.warn('Password reset succeeded but user not found for audit', { email });
                        }
                    } catch (error) {
                        logger.error('Failed to audit OTP password reset', { error, email });
                    }
                }
            }

            // Also handle traditional reset-password path for link-based flow
            if (path === '/reset-password' && returned) {
                const userId = returned?.user?.id;
                if (userId) {
                    await auditService.logUserAction(userId, 'user.password.reset', {
                        success: true,
                    }, undefined, ipAddress, userAgent);
                    logger.info('Password reset audited', { userId });

                    const password = ctx.body?.password;
                    if (password) {
                        await recordPasswordInHistory(userId, password);
                    }
                }
            }

            // Log change password (authenticated user) and record in history
            if (path === '/change-password' && returned) {
                const session = (ctx.context as any)?.session;
                if (session?.userId) {
                    await auditService.logUserAction(session.userId, 'user.password.change', {
                        success: true,
                    }, session.id, ipAddress, userAgent);
                    logger.info('Password change audited', { userId: session.userId });

                    // Record password in history to prevent reuse
                    const newPassword = ctx.body?.newPassword;
                    if (newPassword) {
                        await recordPasswordInHistory(session.userId, newPassword);
                    }
                }
            }

            // Log OTP verification
            if (path === '/verify-otp' && returned) {
                const userId = returned?.user?.id;
                if (userId) {
                    await auditService.logUserAction(userId, 'user.otp.verify', {
                        success: true,
                    }, undefined, ipAddress, userAgent);
                }
            }

            // Log 2FA enable
            if (path === '/two-factor/enable' && returned) {
                const session = (ctx.context as any)?.session;
                if (session?.userId) {
                    await auditService.logUserAction(session.userId, 'user.2fa.enable', {
                        success: true,
                    }, session.id, ipAddress, userAgent);
                }
            }

            // Log 2FA disable
            if (path === '/two-factor/disable' && returned) {
                const session = (ctx.context as any)?.session;
                if (session?.userId) {
                    await auditService.logUserAction(session.userId, 'user.2fa.disable', {
                        success: true,
                    }, session.id, ipAddress, userAgent);
                }
            }

            // Log 2FA authentication
            if (path === '/two-factor/authenticate' && returned) {
                const userId = returned?.user?.id;
                if (userId) {
                    await auditService.logUserAction(userId, 'user.2fa.authenticate', {
                        success: true,
                    }, undefined, ipAddress, userAgent);
                }
            }

            // Log email verification
            if (path === '/verify-email' && returned) {
                const userId = returned?.user?.id;
                if (userId) {
                    await auditService.logUserAction(userId, 'user.email.verify', {
                        success: true,
                    }, undefined, ipAddress, userAgent);
                    logger.info('Email verification audited', { userId });
                }
            }

            // Log social login
            if (path === '/sign-in/social' && returned) {
                const user = returned?.user;
                const provider = ctx.query?.provider || ctx.body?.provider;
                if (user?.id && provider) {
                    await auditService.logUserAction(user.id, `user.social.login.${provider}`, {
                        provider,
                    }, undefined, ipAddress, userAgent);
                    logger.info('Social login audited', { userId: user.id, provider });
                }
            }

            // Track device login for successful sign-ins
            // This covers regular email login, OTP login, and 2FA authentication
            if ((path === '/sign-in/email' || path === '/verify-otp' || path === '/two-factor/authenticate') && returned) {
                const user = returned?.user;
                if (user?.id && user?.email) {
                    try {
                        await trackDeviceLogin(user.id, user.email, ipAddress, userAgent);
                    } catch (error) {
                        logger.error('Device tracking failed', { error, userId: user.id });
                        // Don't block login if device tracking fails
                    }
                }
            }
        }),
        // Error hook: Log failed authentication attempts
        error: createAuthMiddleware(async (ctx) => {
            const path = ctx.path;
            const error = ctx.context?.error;
            const headers = ctx.headers;

            // Security: Use validated IP extraction to prevent injection
            const ipAddress = getSafeIpAddress(headers ?? null);
            const userAgent = headers?.get('user-agent') || 'unknown';

            // Log failed sign-in attempts
            if (path === '/sign-in/email' && error) {
                const email = ctx.body?.email;
                await auditService.logFailedAction(
                    'anonymous',
                    'user.login.failed',
                    error.message || 'Authentication failed',
                    { email, path },
                    ipAddress,
                    userAgent,
                );
                logger.warn('Failed login attempt', { email, error: error.message });
            }

            // Log failed sign-up attempts
            if (path === '/sign-up/email' && error) {
                const email = ctx.body?.email;
                await auditService.logFailedAction(
                    'anonymous',
                    'user.signup.failed',
                    error.message || 'Registration failed',
                    { email, path },
                    ipAddress,
                    userAgent,
                );
            }

            // Log failed Email OTP password reset attempts
            if (path === '/email-otp/reset-password' && error) {
                const email = ctx.body?.email;
                await auditService.logFailedAction(
                    'anonymous',
                    'user.password.reset.otp.failed',
                    error.message || 'OTP password reset failed',
                    { path, email },
                    ipAddress,
                    userAgent,
                );
            }

            // Log failed traditional password reset attempts
            if (path === '/reset-password' && error) {
                await auditService.logFailedAction(
                    'anonymous',
                    'user.password.reset.failed',
                    error.message || 'Password reset failed',
                    { path },
                    ipAddress,
                    userAgent,
                );
            }

            // Log failed OTP verification
            if (path === '/verify-otp' && error) {
                await auditService.logFailedAction(
                    'anonymous',
                    'user.otp.verify.failed',
                    error.message || 'OTP verification failed',
                    { path },
                    ipAddress,
                    userAgent,
                );
            }
        })
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        sendResetPasswordToken: true,
        sendVerificationEmail: false, // Custom emailOTP plugin handles this via email queue
        passwordSigningKey: process.env.BETTER_AUTH_SECRET,
    },
    socialProviders: {
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && {
            google: {
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            },
        }),
        ...(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET && {
            microsoft: {
                clientId: process.env.MICROSOFT_CLIENT_ID,
                clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
            },
        }),
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 2, // 2 hours (reduced from 1 day)
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5, // 5 minutes (reduced from 7 days)
        },
    },
    // Built-in rate limiting
    rateLimit: {
        enabled: true,
        window: 60, // 60 seconds
        max: 100, // 100 requests per window
        // Stricter limits for sensitive endpoints
        customRules: {
            '/sign-in/email': {
                window: 60,
                max: 5, // Allow normal retries without frequent lockouts
            },
            '/sign-up/email': {
                window: 60,
                max: 6,
            },
            '/forgot-password': {
                window: 60,
                max: 5,
            },
            '/verify-otp': {
                window: 30,
                max: 5, // Keep protection while reducing false rate-limit hits
            },
        },
        // Use database for persistent rate limiting across restarts
        storage: 'database',
        modelName: 'rateLimit',
    },
    plugins: [
        emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
                try {
                    const cacheKey = `${email}_${type}`;

                    // Clear any existing timeout for this key
                    const existing = otpSendCache.get(cacheKey);
                    if (existing?.timeout) {
                        clearTimeout(existing.timeout);
                    }

                    // Debounce: wait for all rapid calls, then send the LAST OTP
                    const timeout = setTimeout(async () => {
                        // Map Better Auth types to email types
                        const emailTypeMap: Record<string, string> = {
                            'email-verification': 'signup-email',
                            'sign-up': 'signup-email',
                            'forgot-password': 'forgot-password',
                            'reset-password': 'reset-password',
                        };

                        const emailType = emailTypeMap[type] || type;
                        await emailQueueService.addEmailJob(email, otp, emailType);
                        logger.info('Email queued (debounced)', { emailType, email, originalType: type });

                        // Clean up cache after sending
                        otpSendCache.delete(cacheKey);
                    }, OTP_DEBOUNCE_MS);

                    // Store the latest OTP and timeout
                    otpSendCache.set(cacheKey, { otp, timestamp: Date.now(), timeout });
                    logger.info('OTP received (debouncing)', { email, type });
                } catch (error) {
                    logger.error('Failed to queue email', { error });
                    throw error;
                }
            },
            sendVerificationOnSignUp: false,
            otpLength: 8,
        }),
        expo(), // Expo mobile app support
        haveIBeenPwned(), // Check passwords against haveibeenpwned.com database
        admin(),
        twoFactor({
            issuer: process.env.APP_NAME || 'Auth Service',
        }),
        organization({
            ac,
            // Enable teams feature
            teams: {
                enabled: true,
                maximumTeams: 50,
            },
            roles: {
                owner,
                admin: adminRole,
                member,
                manager,  // Custom role
                viewer,   // Custom role
            },
            // Only system admins can create organizations
            // Better Auth user-level roles are 'admin' and 'user'; 'owner' is org-level only
            allowUserToCreateOrganization: async (user) => {
                const userRole = (user as any)?.role;
                return userRole === 'admin';
            },
            // Send invitation emails via webhook
            async sendInvitationEmail(data) {
                try {
                    await emailQueueService.addEmailJob(
                        data.email,
                        data.id,
                        'organization-invitation'
                    );

                    logger.info('Invitation email queued', { email: data.email, organization: data.organization.name });
                } catch (error) {
                    logger.error('Failed to queue invitation email', { error });
                    throw error;
                }
            },
            // Audit hooks for organization events
            organizationHooks: {
                afterCreateOrganization: async ({ organization, user }) => {
                    await auditService.logOrganizationAction(organization.id, user.id, 'org.create', {
                        organizationName: organization.name,
                        organizationSlug: organization.slug,
                    });
                },
                afterUpdateOrganization: async ({ organization, user }: any) => {
                    await auditService.logOrganizationAction(organization.id, user.id, 'org.update', {
                        organizationName: organization.name,
                    });
                },
                afterDeleteOrganization: async ({ organization, user }: any) => {
                    await auditService.logOrganizationAction(organization.id, user.id, 'org.delete', {
                        organizationName: organization.name,
                    });
                },
                afterAddMember: async ({ member, user, organization }) => {
                    await auditService.logOrganizationAction(organization.id, user.id, 'org.member.add', {
                        targetUserId: member.userId,
                        role: member.role,
                        addedBy: user.email,
                    });
                },
                afterRemoveMember: async ({ member, organization, user }: any) => {
                    await auditService.logOrganizationAction(organization.id, user.id, 'org.member.remove', {
                        targetUserId: member.userId,
                        previousRole: member.role,
                    });
                },
                afterUpdateMember: async ({ member, organization, user }: any) => {
                    await auditService.logOrganizationAction(organization.id, user.id, 'org.member.role', {
                        targetUserId: member.userId,
                        newRole: member.role,
                    });
                },
                afterCreateInvitation: async ({ invitation, organization, inviter }: any) => {
                    // Note: The hook provides 'inviter' not 'user'
                    const userId = inviter?.id || invitation?.inviterId || 'unknown';
                    await auditService.logOrganizationAction(organization.id, userId, 'org.invite.create', {
                        invitationId: invitation.id,
                        email: invitation.email,
                        role: invitation.role,
                    });
                },
                afterCancelInvitation: async ({ invitation, organization, user }: any) => {
                    const userId = user?.id || 'unknown';
                    await auditService.logOrganizationAction(organization.id, userId, 'org.invite.cancel', {
                        invitationId: invitation.id,
                        email: invitation.email,
                    });
                },
                afterAcceptInvitation: async ({ member, user, organization }: any) => {
                    await auditService.logOrganizationAction(organization.id, user.id, 'org.invite.accept', {
                        memberId: member.id,
                        role: member.role,
                    });
                },
            },
        }),
    ],
});

// Export for use in guards and other modules
export { statement, ac, owner, adminRole, manager, member, viewer };
