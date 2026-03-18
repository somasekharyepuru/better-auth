import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import * as nodemailer from 'nodemailer';
import { createChildLogger } from '../common/logger.service';

interface EmailJobData {
    email: string;
    otp: string;
    type: string;
}

export interface EmailQueueStats {
    queueSize: number;
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
}

// ============================================================
// SECURITY: HTML ESCAPE UTILITIES
// ============================================================

/**
 * HTML escape utility to prevent XSS in email templates
 * Escapes: <, >, &, ", '
 */
function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * URL validation - ensures URL contains only safe characters
 * Used for href attributes in email templates
 */
function isValidUrlString(url: string): boolean {
    // Allow only safe URL characters: letters, digits, and URL-safe symbols
    return /^[\w\-._~:/?#[\]@!$&'()*+,;=%]+$/.test(url);
}

// ============================================================
// EMAIL TEMPLATES
// ============================================================

const EMAIL_TEMPLATES: Record<string, { subject: string; getHtml: (otp: string, appName: string) => string }> = {
    'email-verification': {
        subject: 'Verify your email address',
        getHtml: (otp, appName) => {
            const safeAppName = escapeHtml(appName);
            const safeOtp = escapeHtml(otp);
            return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Welcome to ${safeAppName}!</h2>
                <p>Please verify your email address by entering the code below:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #333;">${safeOtp}</span>
                </div>
                <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
                <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            </div>
        `;
        },
    },
    'sign-in': {
        subject: 'Your sign-in code',
        getHtml: (otp, appName) => {
            const safeAppName = escapeHtml(appName);
            const safeOtp = escapeHtml(otp);
            return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Sign in to ${safeAppName}</h2>
                <p>Use the code below to complete your sign-in:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #333;">${safeOtp}</span>
                </div>
                <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
                <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            </div>
        `;
        },
    },
    // Alias for canonical template name
    'forget-password': undefined as any,

    'forgot-password': {
        subject: 'Reset your password',
        getHtml: (otp, appName) => {
            const safeAppName = escapeHtml(appName);
            const safeOtp = escapeHtml(otp);
            return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Reset your ${safeAppName} password</h2>
                <p>We received a request to reset your password. Use the code below:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #333;">${safeOtp}</span>
                </div>
                <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
                <p style="color: #666; font-size: 14px;">If you didn't request a password reset, please ignore this email.</p>
            </div>
        `;
        },
    },
    'reset-password': {
        subject: 'Password reset successful',
        getHtml: (otp, appName) => {
            const safeAppName = escapeHtml(appName);
            const safeOtp = escapeHtml(otp);
            return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Password Reset Confirmation</h2>
                <p>Your ${safeAppName} password has been successfully reset.</p>
                <p>If you did not make this change, please contact support immediately.</p>
                <p style="color: #666; font-size: 14px;">Your verification code: <strong>${safeOtp}</strong></p>
            </div>
        `;
        },
    },
    'signup-email': {
        subject: 'Welcome! Verify your email',
        getHtml: (otp, appName) => {
            const safeAppName = escapeHtml(appName);
            const safeOtp = escapeHtml(otp);
            return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Welcome to ${safeAppName}!</h2>
                <p>Thank you for signing up. Please verify your email address:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #333;">${safeOtp}</span>
                </div>
                <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
            </div>
        `;
        },
    },
    'organization-invitation': {
        subject: 'You have been invited to join an organization',
        getHtml: (otp, appName) => {
            const frontendUrl = process.env.APP_URL || 'http://localhost:3001';
            // Security: Validate OTP is a valid CUID before using in URL
            const safeOtp = /^[a-z0-9]{25}$/i.test(otp) ? otp : 'invalid';
            const acceptUrl = `${frontendUrl}/organizations/invite?id=${safeOtp}`;
            // Security: Escape URL for HTML embedding to prevent XSS
            const safeAcceptUrl = escapeHtml(acceptUrl);
            // Security: Escape appName for HTML text content
            const safeAppName = escapeHtml(appName);
            return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">🏢 Organization Invitation</h2>
                <p>You have been invited to join an organization on ${safeAppName}.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${safeAcceptUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Accept Invitation</a>
                </div>
                <p style="color: #666; font-size: 14px; text-align: center;">Or use this code manually:</p>
                <div style="background: #f5f5f5; padding: 15px; text-align: center; margin: 15px 0; border-radius: 8px;">
                    <span style="font-size: 18px; font-weight: bold; letter-spacing: 2px; color: #333; font-family: monospace;">${safeOtp}</span>
                </div>
                <p style="color: #666; font-size: 14px;">This invitation expires in 7 days.</p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">Or copy and paste this link: ${safeAcceptUrl}</p>
            </div>
            `;
        },
    },
    'account-deletion-confirm': {
        subject: 'Confirm your account deletion',
        getHtml: (otp, appName) => {
            const safeAppName = escapeHtml(appName);
            let data;
            try {
                data = JSON.parse(otp);
            } catch (error) {
                console.error('Failed to parse account deletion confirmation data', { error, otp });
                // Fallback to safe default
                return `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #d32f2f;">Confirm Account Deletion</h2>
                    <p>We received a request to permanently delete your ${safeAppName} account.</p>
                    <p>Please check your email for the confirmation link.</p>
                </div>
                `;
            }
            // Security: Escape the token and other user data
            const safeToken = data?.token ? escapeHtml(String(data.token)) : 'invalid';
            return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #d32f2f;">Confirm Account Deletion</h2>
                <p>We received a request to permanently delete your ${safeAppName} account.</p>
                <p><strong>This action cannot be undone.</strong> All your data will be permanently deleted.</p>
                <p>To confirm, please use the confirmation token below:</p>
                <div style="background: #ffebee; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; border: 2px solid #d32f2f;">
                    <span style="font-size: 14px; font-weight: bold; letter-spacing: 2px; color: #d32f2f; word-break: break-all;">${safeToken}</span>
                </div>
                <p style="color: #666; font-size: 14px;">This confirmation expires on: ${new Date(data?.expiresAt || 0).toLocaleDateString()}</p>
                <p style="color: #666; font-size: 14px;">If you did not request this, please ignore this email or contact support.</p>
            </div>
            `;
        },
    },
    'account-deletion-confirmed': {
        subject: 'Account deletion confirmed',
        getHtml: (otp, appName) => {
            const safeAppName = escapeHtml(appName);
            return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #d32f2f;">Account Deletion Confirmed</h2>
                <p>Your ${safeAppName} account deletion has been confirmed.</p>
                <p>Your account will be permanently deleted in 30 days.</p>
                <p>If you change your mind, you can log in and cancel the deletion request within the next 30 days.</p>
                <p style="color: #666; font-size: 14px;">After 30 days, all your data will be permanently removed and cannot be recovered.</p>
            </div>
        `;
        },
    },
    'new-device-login': {
        subject: 'New device login detected',
        getHtml: (otp, appName) => {
            // Parse the JSON data passed through the otp field
            let data = { device: 'Unknown', ip: 'Unknown', time: new Date().toISOString() };
            try {
                data = JSON.parse(otp);
            } catch (e) {
                // Use defaults if parsing fails
            }
            const formattedTime = new Date(data.time).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short',
            });
            // Security: Escape user-provided data
            const safeDevice = escapeHtml(String(data.device));
            const safeIp = escapeHtml(String(data.ip));
            return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #ff9800;">🔔 New Device Login Detected</h2>
                <p>A new device just logged into your ${escapeHtml(appName)} account:</p>
                <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
                    <p style="margin: 5px 0;"><strong>Device:</strong> ${safeDevice}</p>
                    <p style="margin: 5px 0;"><strong>IP Address:</strong> ${safeIp}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> ${formattedTime}</p>
                </div>
                <p style="color: #333;">If this was you, no action is needed.</p>
                <p style="color: #d32f2f; font-weight: bold;">If this wasn't you, please secure your account immediately by:</p>
                <ul style="color: #666;">
                    <li>Changing your password</li>
                    <li>Enabling two-factor authentication</li>
                    <li>Reviewing your active sessions</li>
                </ul>
                <p style="color: #666; font-size: 14px;">This notification was sent to protect your account security.</p>
            </div>
            `;
        },
    },
    'user-created-by-admin': {
        subject: 'Your account has been created',
        getHtml: (otp, appName) => {
            let credentials;
            try {
                credentials = JSON.parse(otp);
            } catch (error) {
                // Return safe fallback if JSON parsing fails
                return `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Welcome to ${escapeHtml(appName)}!</h1>
                    <p style="color: #666; font-size: 16px; line-height: 1.5;">An administrator has created an account for you. Please contact your administrator for your credentials.</p>
                </div>
                `;
            }
            // Security: Escape all user-provided data
            const safeEmail = escapeHtml(String(credentials.email || ''));
            const safePassword = escapeHtml(String(credentials.password || ''));
            const rawLoginUrl = String(credentials.loginUrl || '');
            // Only allow http/https URLs to prevent javascript: injection
            const isValidUrl = /^https?:\/\//i.test(rawLoginUrl);
            const safeLoginUrl = isValidUrl ? rawLoginUrl : '#';
            const displayLoginUrl = escapeHtml(isValidUrl ? rawLoginUrl : 'the login page');
            const safeAppName = escapeHtml(appName);

            return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Welcome to ${safeAppName}!</h1>
                <p style="color: #666; font-size: 16px; line-height: 1.5;">An administrator has created an account for you. Below are your login credentials:</p>

                <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 30px 0;">
                    <p style="margin: 0 0 5px 0; color: #495057; font-size: 14px; font-weight: bold;">EMAIL ADDRESS</p>
                    <p style="margin: 0 0 20px 0; color: #212529; font-size: 18px; font-weight: bold;">${safeEmail}</p>

                    <p style="margin: 0 0 5px 0; color: #495057; font-size: 14px; font-weight: bold;">PASSWORD</p>
                    <p style="margin: 0 0 20px 0; color: #212529; font-size: 18px; font-weight: bold;">${safePassword}</p>
                </div>

                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0; color: #856404; font-weight: bold;">🔒 Security Notice:</p>
                    <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                        For your security, please <strong>change your password immediately after your first login</strong>.
                    </p>
                </div>

                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    You can log in at: <a href="${safeLoginUrl}" style="color: #007bff; text-decoration: none; font-weight: bold;">${displayLoginUrl}</a>
                </p>

                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    If you have any trouble logging in, please contact your administrator.<br>
                    This is an automated message, please do not reply.
                </p>
            </div>
            `;
        },
    },
    'ownership-transfer': {
        subject: 'Organization ownership transfer request',
        getHtml: (otp, appName) => {
            const data = JSON.parse(otp);
            const expiresDate = new Date(data.expiresAt).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">🔑 Organization Ownership Transfer</h2>
                <p>You have been selected as the new owner of <strong>${data.organizationName}</strong> on ${appName}.</p>
                <p>The current owner has initiated a transfer of ownership to you. If you accept, you will become the owner with full administrative privileges.</p>
                <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #1565c0;">What this means:</p>
                    <ul style="margin: 0; color: #333;">
                        <li>You will become the organization owner</li>
                        <li>The current owner will be demoted to admin</li>
                        <li>You will have full control over the organization</li>
                    </ul>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.confirmUrl}" style="display: inline-block; background: #2196f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept Transfer</a>
                </div>
                <p style="color: #666; font-size: 14px;">This transfer request expires on: <strong>${expiresDate}</strong></p>
                <p style="color: #666; font-size: 14px;">If you don't want to accept this transfer, simply ignore this email.</p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">Or copy and paste this link: ${data.confirmUrl}</p>
            </div>
            `;
        },
    },
};

// ============================================================
// EMAIL QUEUE SERVICE (Injectable)
// ============================================================
// Manages single Redis connection, queue, and worker instance
// Handles proper lifecycle, error recovery, and graceful shutdown
// Uses SMTP (Mailhog/any SMTP server) for email delivery
// ============================================================

@Injectable()
export class EmailQueueService extends EventEmitter implements OnModuleDestroy {
    private logger = createChildLogger('email-queue');

    private redis: Redis | null = null;
    private queue: Queue<EmailJobData> | null = null;
    private worker: Worker<EmailJobData> | null = null;
    private transporter: nodemailer.Transporter | null = null;
    private isShuttingDown = false;
    private workerReady = false;

    constructor() {
        super();
    }

    async onModuleDestroy() {
        await this.shutdown();
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================

    async initialize(): Promise<void> {
        if (this.redis) {
            return; // Already initialized
        }

        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

            this.redis = new Redis(redisUrl, {
                maxRetriesPerRequest: null,
                retryStrategy: (times) => Math.min(times * 50, 2000),
                enableReadyCheck: true,
                lazyConnect: false,
            });

            // Wait for connection to be ready before testing
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Redis connection timeout after 5 seconds'));
                }, 5000);

                this.redis!.once('ready', () => {
                    clearTimeout(timeout);
                    resolve();
                });

                this.redis!.once('error', (err) => {
                    clearTimeout(timeout);
                    reject(err);
                });
            });

            // Test connection
            await this.redis.ping();
            this.logger.info('Redis connection established');

            // Initialize SMTP transporter
            await this.initializeSmtpTransporter();

            // Create queue
            this.queue = new Queue<EmailJobData>('emails', {
                connection: this.redis as any,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                    removeOnComplete: {
                        count: 1000,
                        age: 24 * 3600, // 24 hours
                    },
                    removeOnFail: {
                        count: 5000,
                        age: 7 * 24 * 3600, // 7 days
                    },
                },
            });

            // Set up queue event listeners for monitoring
            this.setupQueueListeners();

            // Create worker
            await this.createWorker();

            // Handle Redis errors
            this.redis.on('error', (error) => {
                this.logger.error('Redis connection error', { error });
                this.emit('error', { source: 'redis', error });
            });

            this.redis.on('close', () => {
                this.logger.warn('Redis connection closed');
                this.emit('redis:disconnected');
            });

            this.redis.on('reconnecting', () => {
                this.logger.info('Redis reconnecting...');
                this.emit('redis:reconnecting');
            });

            this.redis.on('connect', () => {
                this.logger.info('Redis reconnected');
                this.emit('redis:connected');
            });

            this.logger.info('Email queue system initialized successfully');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error('Failed to initialize email queue', {
                error: errorMessage,
                stack: errorStack,
                type: error instanceof Error ? error.constructor.name : typeof error
            });
            this.emit('error', { source: 'initialization', error });
            throw error;
        }
    }

    // ============================================================
    // SMTP TRANSPORTER INITIALIZATION
    // ============================================================

    private async initializeSmtpTransporter(): Promise<void> {
        const smtpHost = process.env.SMTP_HOST || 'mailhog';
        const smtpPort = Number(process.env.SMTP_PORT || 1025);
        const smtpSecure = process.env.SMTP_SECURE === 'true';
        const smtpUser = process.env.SMTP_USER || '';
        const smtpPass = process.env.SMTP_PASS || '';

        const transportConfig: nodemailer.TransportOptions = {
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
        } as any;

        // Only add auth if credentials are provided
        if (smtpUser && smtpPass) {
            (transportConfig as any).auth = {
                user: smtpUser,
                pass: smtpPass,
            };
        }

        this.transporter = nodemailer.createTransport(transportConfig);

        // Verify SMTP connection
        try {
            await this.transporter.verify();
            this.logger.info('SMTP connection verified', { host: smtpHost, port: smtpPort });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn('SMTP verification failed, will retry on send', { error: errorMessage });
            // Don't throw - we'll retry when sending
        }
    }

    // ============================================================
    // WORKER CREATION
    // ============================================================

    private async createWorker(): Promise<void> {
        if (!this.redis) {
            throw new Error('Redis not initialized. Call initialize() first.');
        }

        // Close existing worker if any
        if (this.worker) {
            await this.worker.close();
        }

        try {
            this.worker = new Worker<EmailJobData>(
                'emails',
                async (job: Job<EmailJobData>) => {
                    const { email, otp, type } = job.data;

                    // Update job progress
                    await job.updateProgress(10);

                    try {
                        await this.sendEmailViaSMTP(email, otp, type);

                        // Mark job as successful
                        await job.updateProgress(100);
                        this.logger.info(`Email sent successfully`, { type, email });

                    } catch (error) {
                        // Mark job as failed but don't throw - let BullMQ handle retries
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        this.logger.error('Failed to send email', {
                            error: errorMessage,
                            type: error instanceof Error ? error.constructor.name : typeof error
                        });
                        throw error;
                    }
                },
                {
                    connection: this.redis as any,
                    concurrency: 5, // Process up to 5 emails concurrently
                    limiter: {
                        max: 10, // Max 10 emails per second
                        duration: 1000,
                    },
                }
            );

            // Set up worker event listeners
            this.worker.on('completed', (job: Job<EmailJobData>) => {
                this.logger.info(`Job completed`, { jobId: job.id, email: job.data.email, type: job.data.type });
            });

            this.worker.on('failed', (job: Job<EmailJobData> | undefined, err: Error) => {
                const jobId = job?.id;
                const email = job?.data?.email || 'unknown';
                this.logger.error('Job failed', { jobId, email, error: err.message });
            });

            this.worker.on('progress', (job: Job<EmailJobData>) => {
                const progress = job.progress as number;
                if (progress % 20 === 0) {
                    this.logger.debug(`Job progress`, { jobId: job.id, progress });
                }
            });

            // Wait for worker to be ready
            await this.worker.waitUntilReady();
            this.workerReady = true;
            this.logger.info('Email worker ready and processing jobs');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error('Failed to create email worker', {
                error: errorMessage,
                stack: errorStack,
                type: error instanceof Error ? error.constructor.name : typeof error
            });
            this.emit('error', { source: 'worker', error });
            throw error;
        }
    }

    // ============================================================
    // QUEUE EVENT LISTENERS (for monitoring)
    // ============================================================

    private setupQueueListeners(): void {
        if (!this.queue) return;

        const queue = this.queue as any;

        queue.on('waiting', (job: any) => {
            this.logger.debug('Job is waiting', { jobId: job.id });
        });

        queue.on('active', (job: any) => {
            this.logger.debug('Job is now active', { jobId: job.id });
        });

        queue.on('completed', (job: any) => {
            this.logger.debug('Job completed', { jobId: job.id });
        });

        queue.on('failed', (job: any, err: any) => {
            this.logger.error('Job failed permanently', { jobId: job?.id, error: err?.message });
        });

        queue.on('stalled', (job: any) => {
            this.logger.warn('Job stalled (timeout)', { jobId: job.id });
        });

        queue.on('error', (error: any) => {
            this.logger.error('Queue error', { error });
        });
    }

    // ============================================================
    // EMAIL SENDING VIA SMTP (with retry logic)
    // ============================================================

    private async sendEmailViaSMTP(email: string, otp: string, type: string): Promise<boolean> {
        if (!this.transporter) {
            await this.initializeSmtpTransporter();
        }

        if (!this.transporter) {
            throw new Error('SMTP transporter not initialized');
        }

        const appName = process.env.APP_NAME || 'Auth Service';
        const fromEmail = process.env.SMTP_FROM || `noreply@${appName.toLowerCase().replace(/\s+/g, '')}.com`;
        const fromName = process.env.SMTP_FROM_NAME || appName;

        // Get email template
        const template = EMAIL_TEMPLATES[type];
        if (!template) {
            this.logger.warn('Unknown email type, using default template', { type });
        }

        const subject = template?.subject || `Your verification code from ${appName}`;
        const html = template?.getHtml(otp, appName) || `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">${appName}</h2>
                <p>Your verification code:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #333;">${otp}</span>
                </div>
                <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
            </div>
        `;

        const maxRetries = Number(process.env.MAIL_MAX_RETRIES || 3);
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const info = await this.transporter.sendMail({
                    from: `"${fromName}" <${fromEmail}>`,
                    to: email,
                    subject: subject,
                    html: html,
                    text: `Your ${type} code is: ${otp}. This code expires in 10 minutes.`,
                });

                this.logger.info('Email sent via SMTP', {
                    messageId: info.messageId,
                    type,
                    email,
                });

                return true;

            } catch (error) {
                lastError = error as Error;
                const errorMessage = error instanceof Error ? error.message : String(error);

                if (attempt < maxRetries) {
                    const backoff = Math.pow(2, attempt - 1) * 1000;
                    this.logger.warn('SMTP send attempt failed, retrying', {
                        attempt,
                        maxRetries,
                        backoff,
                        error: errorMessage,
                    });
                    await new Promise(resolve => setTimeout(resolve, backoff));

                    // Reinitialize transporter on retry
                    await this.initializeSmtpTransporter();
                }
            }
        }

        throw lastError || new Error('Failed to send email after retries');
    }

    // ============================================================
    // PUBLIC API
    // ============================================================

    /**
     * Add an email job to the queue
     */
    async addEmailJob(email: string, otp: string, type: string): Promise<void> {
        if (this.isShuttingDown) {
            throw new Error('Email queue is shutting down, cannot accept new jobs');
        }

        if (!this.queue) {
            await this.initialize();
        }

        // Queue should be initialized now
        if (!this.queue) {
            throw new Error('Failed to initialize email queue');
        }

        // Sanitize email for job ID (remove special chars)
        const safeEmail = email.replace(/[^a-zA-Z0-9@._-]/g, '_');
        const uniqueId = `${safeEmail}_${type}_${Date.now()}`;

        await this.queue.add('send-email', { email, otp, type }, {
            jobId: uniqueId,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        });

        this.logger.info('Email queued', { type, email });
    }

    /**
     * Get queue statistics
     */
    async getStats(): Promise<EmailQueueStats> {
        if (!this.queue) {
            throw new Error('Queue not initialized');
        }

        const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
            this.queue.getWaitingCount(),
            this.queue.getActiveCount(),
            this.queue.getCompletedCount(),
            this.queue.getFailedCount(),
            this.queue.getDelayedCount(),
            this.queue.isPaused(),
        ]);

        return {
            queueSize: waiting + active + delayed,
            waiting,
            active,
            completed,
            failed,
            delayed,
            paused,
        };
    }

    /**
     * Check if queue system is healthy
     */
    async isHealthy(): Promise<boolean> {
        try {
            if (!this.redis) {
                return false;
            }

            // Check Redis connection
            await this.redis.ping();

            // Check if worker is ready
            if (!this.workerReady) {
                return false;
            }

            // Check if queue is not overwhelmed
            const stats = await this.getStats();
            if (stats.queueSize > 1000) {
                this.logger.warn('Queue size is very high', { queueSize: stats.queueSize });
            }

            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Email queue health check failed', { error: errorMessage });
            return false;
        }
    }

    // ============================================================
    // GRACEFUL SHUTDOWN
    // ============================================================

    async shutdown(): Promise<void> {
        if (this.isShuttingDown) {
            this.logger.info('Already shutting down...');
            return;
        }

        this.isShuttingDown = true;
        this.logger.info('Starting graceful shutdown of email queue...');

        const shutdownTimeout = 10000;
        const startTime = Date.now();

        try {
            let activeJobs = 0;
            if (this.queue) {
                activeJobs = await this.queue.getActiveCount();
            }

            if (this.queue) {
                await this.queue.close();
                this.logger.info('Queue closed (no new jobs accepted)');
            }

            if (this.worker) {
                if (activeJobs > 0) {
                    this.logger.info('Waiting for active jobs to finish...', { activeJobs });

                    while ((Date.now() - startTime < shutdownTimeout)) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        this.logger.debug('Waiting for jobs to finish...');
                    }
                }

                await this.worker.close();
                this.logger.info('Worker closed');
            }

            if (this.transporter) {
                this.transporter.close();
                this.logger.info('SMTP transporter closed');
            }

            if (this.redis) {
                await this.redis.quit();
                this.logger.info('Redis connection closed');
            }

            this.logger.info('Email queue shutdown complete');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Error during shutdown', { error: errorMessage });
        } finally {
            this.redis = null;
            this.queue = null;
            this.worker = null;
            this.transporter = null;
            this.workerReady = false;
            this.isShuttingDown = false;
        }
    }

    // ============================================================
    // CONNECTION MANAGEMENT
    // ============================================================

    async reconnect(): Promise<void> {
        this.logger.info('Reconnecting to Redis...');

        try {
            if (this.worker) {
                await this.worker.close();
            }
            if (this.queue) {
                await this.queue.close();
            }
            if (this.transporter) {
                this.transporter.close();
            }
            if (this.redis) {
                await this.redis.quit();
            }

            this.redis = null;
            this.queue = null;
            this.worker = null;
            this.transporter = null;
            this.workerReady = false;

            await this.initialize();
            this.logger.info('Reconnected to Redis successfully');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error('Failed to reconnect', {
                error: errorMessage,
                stack: errorStack,
                type: error instanceof Error ? error.constructor.name : typeof error
            });
            throw error;
        }
    }
}

// Singleton instance for use in auth.config.ts (Better Auth hooks)
export const emailQueueService = new EmailQueueService();
