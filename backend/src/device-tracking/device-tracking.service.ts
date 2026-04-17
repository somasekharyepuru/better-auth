import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EmailQueueService } from '../email-queue/email-queue.service';
import { createHash } from 'crypto';
import { createChildLogger } from '../common/logger.service';
import { parseUserAgent } from '../common/user-agent-parser';

const logger = createChildLogger('device-tracking');

@Injectable()
export class DeviceTrackingService {
    constructor(
        private prisma: PrismaService,
        private emailQueue: EmailQueueService,
    ) { }

    /**
     * Generate a unique fingerprint for a device based on IP and User-Agent
     * This is a simple approach - could be enhanced with browser fingerprinting
     */
    generateFingerprint(ip: string, userAgent: string): string {
        const data = `${ip}:${userAgent}`;
        return createHash('sha256').update(data).digest('hex');
    }

    /**
     * Generate a user-friendly device name from user agent
     */
    getDeviceName(userAgent: string): string {
        const parsed = parseUserAgent(userAgent);
        return `${parsed.browser} on ${parsed.os}`;
    }

    /**
     * Track a login and send notification if it's a new device
     * Returns true if this was a new device
     */
    async trackLogin(
        userId: string,
        userEmail: string,
        ip: string,
        userAgent: string,
    ): Promise<boolean> {
        const fingerprint = this.generateFingerprint(ip, userAgent);
        const deviceName = this.getDeviceName(userAgent);

        try {
            // Try to find an existing known device
            const existingDevice = await this.prisma.knownDevice.findUnique({
                where: {
                    userId_fingerprint: { userId, fingerprint },
                },
            });

            if (existingDevice) {
                // Device is known - update last seen timestamp
                await this.prisma.knownDevice.update({
                    where: { id: existingDevice.id },
                    data: { lastSeen: new Date() },
                });
                logger.debug('Known device login', { userId, deviceName });
                return false;
            }

            // New device - create record
            await this.prisma.knownDevice.create({
                data: {
                    userId,
                    fingerprint,
                    name: deviceName,
                },
            });

            logger.info('New device detected', { userId, deviceName, ip });

            // Send notification email
            await this.sendNewDeviceNotification(userEmail, deviceName, ip);

            return true;
        } catch (error: any) {
            // Handle race condition where device was created between check and create
            if (error.code === 'P2002') {
                logger.debug('Device already registered (race condition)', { userId });
                return false;
            }
            logger.error('Error tracking device login', { error, userId });
            throw error;
        }
    }

    /**
     * Send notification email about new device login
     */
    private async sendNewDeviceNotification(
        email: string,
        deviceName: string,
        ip: string,
    ): Promise<void> {
        try {
            // Format the data for the email template
            const data = JSON.stringify({
                device: deviceName,
                ip: ip,
                time: new Date().toISOString(),
            });

            await this.emailQueue.addEmailJob(email, data, 'new-device-login');
            logger.info('New device notification email queued', { email, deviceName });
        } catch (error) {
            logger.error('Failed to queue new device notification email', { error, email });
            // Don't throw - notification failure shouldn't block login
        }
    }

    /**
     * Get all known devices for a user
     */
    async getKnownDevices(userId: string) {
        return this.prisma.knownDevice.findMany({
            where: { userId },
            orderBy: { lastSeen: 'desc' },
            select: {
                id: true,
                name: true,
                firstSeen: true,
                lastSeen: true,
            },
        });
    }

    /**
     * Remove a known device (revoke trust)
     */
    async removeDevice(userId: string, deviceId: string): Promise<void> {
        await this.prisma.knownDevice.deleteMany({
            where: {
                id: deviceId,
                userId, // Ensure user can only delete their own devices
            },
        });
        logger.info('Device removed', { userId, deviceId });
    }

    /**
     * Remove all known devices for a user (useful when password changes)
     */
    async removeAllDevices(userId: string): Promise<void> {
        await this.prisma.knownDevice.deleteMany({
            where: { userId },
        });
        logger.info('All devices removed', { userId });
    }
}
