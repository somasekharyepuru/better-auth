import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createChildLogger } from './logger.service';
import { timingSafeEqual } from 'crypto';

const mobileAuthLogger = createChildLogger('mobile-auth');

// Paths that should bypass mobile auth check.
// Email link clicks arrive with no Origin header (direct browser navigation),
// so they must be exempted or they get rejected as unauthenticated mobile clients.
const BYPASS_PATHS = [
    '/health',
    '/ready',
    '/queue-stats',
    '/api/auth/verify-email',      // email verification link from inbox
    '/api/auth/reset-password',    // password reset link from inbox
];

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  return timingSafeEqual(bufA, bufB);
}

@Injectable()
export class MobileAuthMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const fullPath = (req.originalUrl || req.url || '').split('?')[0];
        if (BYPASS_PATHS.some(p => fullPath === p || fullPath.startsWith(p + '?'))) {
            return next();
        }

        const origin = req.headers.origin;
        const clientApiKey = req.headers['x-mobile-auth'] as string | undefined;
        const mobileApiKey = process.env.MOBILE_API_KEY;

        if (!origin && mobileApiKey) {
            if (clientApiKey && constantTimeEqual(clientApiKey, mobileApiKey)) {
                req.headers.origin = 'mobile://';
                mobileAuthLogger.debug('Mobile client authenticated', { ip: req.ip });
            } else {
                mobileAuthLogger.warn('Rejected unauthenticated mobile request', { ip: req.ip });
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Valid X-Mobile-Auth header required for mobile clients',
                });
            }
        } else if (!origin && !mobileApiKey) {
            mobileAuthLogger.debug('Mobile request without API key or CSRF token', { ip: req.ip });
        }

        next();
    }
}
