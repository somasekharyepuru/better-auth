import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service';

interface AuthRequest extends Request {
    user?: { id: string };
    session?: { id: string; userId: string };
}

const ACTION_MAP: Record<string, string> = {
    // User authentication
    '/api/auth/sign-in/email': 'user.login',
    '/api/auth/sign-up/email': 'user.signup',
    '/api/auth/sign-out': 'user.logout',
    '/api/auth/forgot-password': 'user.password.reset.request',
    '/api/auth/reset-password': 'user.password.reset',
    '/api/auth/verify-otp': 'user.otp.verify',
    '/api/auth/verify-email': 'user.email.verify',
    // Two-factor authentication
    '/api/auth/two-factor/enable': 'user.2fa.enable',
    '/api/auth/two-factor/disable': 'user.2fa.disable',
    '/api/auth/two-factor/authenticate': 'user.2fa.authenticate',
    // Organizations
    '/api/auth/organization/create': 'org.create',
    '/api/auth/organization/update': 'org.update',
    '/api/auth/organization/delete': 'org.delete',
    '/api/auth/organization/member/add': 'org.member.add',
    '/api/auth/organization/member/remove': 'org.member.remove',
    '/api/auth/organization/member/update': 'org.member.role',
    '/api/auth/organization/invitation/create': 'org.invite.create',
    '/api/auth/organization/invitation/accept': 'org.invite.accept',
    '/api/auth/organization/invitation/cancel': 'org.invite.cancel',
    // Session management
    '/api/auth/get-session': 'user.session.get',
    '/api/auth/update-user': 'user.update',
    '/api/auth/change-email': 'user.email.change',
    // Admin (if implemented)
    '/api/auth/admin/users': 'admin.users.list',
    '/api/auth/admin/users/ban': 'admin.users.ban',
    '/api/auth/admin/users/unban': 'admin.users.unban',
    '/api/auth/admin/users/delete': 'admin.users.delete',
};

@Injectable()
export class AuditMiddleware implements NestMiddleware {
    use(req: AuthRequest, res: Response, next: NextFunction): void {
        const originalSend = res.send;
        const originalJson = res.json;
        const path = req.path;
        const method = req.method;

        // Security: Validate IP address format to prevent injection
        // Security: Validate IP address format to prevent injection
        const isValidIp = (ip: string): boolean => {
            if (!ip || ip === 'unknown' || ip.length > 45) return false;

            // IPv4 validation
            const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
            if (ipv4Regex.test(ip)) {
                const parts = ip.split('.');
                return parts.every(part => {
                    const num = parseInt(part, 10);
                    return num >= 0 && num <= 255;
                });
            }

            // IPv6 validation (basic check for valid characters and structure)
            const ipv6Regex = /^([0-9a-fA-F]{1,4}:){1,7}:?([0-9a-fA-F]{1,4}|:)?$/;
            // Also allow compressed IPv6 (::)
            const compressedIPv6Regex = /^([0-9a-fA-F]{1,4}:){0,7}:?(:[0-9a-fA-F]{1,4}){0,7}$/;

            return ip.includes(':') && (ipv6Regex.test(ip) || compressedIPv6Regex.test(ip));
        };

        let ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

        // If req.ip is not valid, try x-forwarded-for (only if trust proxy is configured)
        if (!isValidIp(ipAddress)) {
            const forwardedFor = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim();
            if (forwardedFor && isValidIp(forwardedFor)) {
                ipAddress = forwardedFor;
            } else {
                ipAddress = 'unknown';
            }
        }

        const userAgent = req.headers['user-agent'] || 'unknown';
        const isMobile = req.headers['x-mobile-auth'] === 'true' ||
            req.headers.origin?.startsWith('mobile://') ||
            req.headers.origin?.startsWith('exp://');

        let responseData: any;
        let statusCode = 200;

        res.send = function (this: Response, body: any) {
            // Limit response data size to prevent memory exhaustion (max 10KB)
            const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
            if (bodyStr && bodyStr.length > 10240) {
                responseData = bodyStr.substring(0, 10240) + '... (truncated)';
            } else {
                responseData = body;
            }
            statusCode = res.statusCode;
            return originalSend.call(this, body);
        } as any;

        res.json = function (this: Response, body: any) {
            // Limit response data size to prevent memory exhaustion (max 10KB)
            const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
            if (bodyStr && bodyStr.length > 10240) {
                responseData = bodyStr.substring(0, 10240) + '... (truncated)';
            } else {
                responseData = body;
            }
            statusCode = res.statusCode;
            return originalJson.call(this, body);
        } as any;

        res.on('finish', async () => {
            if (!path.startsWith('/api/auth')) return;

            const action = ACTION_MAP[path];
            if (!action) return;

            const userId = req.user?.id || req.session?.userId || 'anonymous';
            const sessionId = req.session?.id;

            const success = statusCode >= 200 && statusCode < 400;
            const errorMessage = !success && responseData ?
                (responseData.message || responseData.error || `Failed: ${statusCode}`) :
                undefined;

            const details: any = {
                method,
                path,
                statusCode,
                isMobile,
            };

            // Sanitize response data - remove sensitive fields before logging (recursive)
            const sanitizeResponseData = (data: any): any => {
                if (!data || typeof data !== 'object') return undefined;

                const sensitiveKeys = ['password', 'token', 'secret', 'accessToken', 'refreshToken', 'apiKey', 'otp', 'code'];
                const sanitized = Array.isArray(data) ? [...data] : { ...data };

                for (const key in sanitized) {
                    // Remove top-level sensitive keys
                    if (sensitiveKeys.includes(key)) {
                        delete sanitized[key];
                        continue;
                    }

                    // Recursively sanitize nested objects and arrays
                    if (sanitized[key] && typeof sanitized[key] === 'object' && !Buffer.isBuffer(sanitized[key])) {
                        sanitized[key] = sanitizeResponseData(sanitized[key]);

                        // Check if it became empty due to sanitization (original wasn't empty)
                        const isEmpty = !sanitized[key] || (typeof sanitized[key] === 'object' && Object.keys(sanitized[key]).length === 0);
                        const originalWasNotEmpty = data[key] && typeof data[key] === 'object' && Object.keys(data[key]).length > 0;

                        if (isEmpty && originalWasNotEmpty) {
                            delete sanitized[key];
                        }
                    }
                }

                return (typeof sanitized === 'object' && Object.keys(sanitized).length > 0) ? sanitized : undefined;
            };

            if (responseData && typeof responseData === 'object') {
                details.responseData = sanitizeResponseData(responseData);
            }

            if (success) {
                await auditService.logUserAction(
                    userId,
                    action,
                    details,
                    sessionId,
                    ipAddress,
                    userAgent,
                );
            } else {
                await auditService.logFailedAction(
                    userId,
                    action,
                    errorMessage || 'Unknown error',
                    details,
                    ipAddress,
                    userAgent,
                );
            }
        });

        next();
    }
}
