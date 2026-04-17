/**
 * Standalone device tracking utility for use in auth.config.ts
 * Uses PrismaClient directly instead of NestJS DI
 */
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { emailQueueService } from '../email-queue/email-queue.service';
import { createChildLogger } from '../common/logger.service';
import { parseUserAgent } from '../common/user-agent-parser';

const logger = createChildLogger('device-tracking');
const prisma = new PrismaClient();

/**
 * Generate a unique fingerprint for a device based on IP and User-Agent
 */
function generateFingerprint(ip: string, userAgent: string): string {
    const data = `${ip}:${userAgent}`;
    return createHash('sha256').update(data).digest('hex');
}

/**
 * Generate a user-friendly device name from user agent
 */
function getDeviceName(userAgent: string): string {
    const parsed = parseUserAgent(userAgent);
    return `${parsed.browser} on ${parsed.os}`;
}

/**
 * Track a login and send notification if it's a new device
 * For use in auth.config.ts hooks
 */
export async function trackDeviceLogin(
    userId: string,
    userEmail: string,
    ip: string,
    userAgent: string,
): Promise<boolean> {
    const fingerprint = generateFingerprint(ip, userAgent);
    const deviceName = getDeviceName(userAgent);

    try {
        // Try to find an existing known device
        const existingDevice = await prisma.knownDevice.findUnique({
            where: {
                userId_fingerprint: { userId, fingerprint },
            },
        });

        if (existingDevice) {
            // Device is known - update last seen timestamp
            await prisma.knownDevice.update({
                where: { id: existingDevice.id },
                data: { lastSeen: new Date() },
            });
            logger.debug('Known device login', { userId, deviceName });
            return false;
        }

        // New device - create record
        await prisma.knownDevice.create({
            data: {
                userId,
                fingerprint,
                name: deviceName,
            },
        });

        logger.info('New device detected', { userId, deviceName, ip });

        // Send notification email
        try {
            const emailData = JSON.stringify({
                device: deviceName,
                ip: ip,
                time: new Date().toISOString(),
            });
            await emailQueueService.addEmailJob(userEmail, emailData, 'new-device-login');
            logger.info('New device notification email queued', { email: userEmail, deviceName });
        } catch (emailError) {
            logger.error('Failed to queue new device notification email', { error: emailError, email: userEmail });
            // Don't throw - notification failure shouldn't block login
        }

        return true;
    } catch (error: any) {
        // Handle race condition where device was created between check and create
        if (error.code === 'P2002') {
            logger.debug('Device already registered (race condition)', { userId });
            return false;
        }
        logger.error('Error tracking device login', { error, userId });
        // Don't throw - device tracking failure shouldn't block login
        return false;
    }
}
