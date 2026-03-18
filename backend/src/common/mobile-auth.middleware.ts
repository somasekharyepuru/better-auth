import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createChildLogger } from './logger.service';
import { timingSafeEqual } from 'crypto';

const mobileAuthLogger = createChildLogger('mobile-auth');

// Paths that should bypass mobile auth (health checks only)
// Note: Auth endpoints should NOT bypass - mobile clients must authenticate
const BYPASS_PATHS = [
    '/health',
    '/ready',
    '/queue-stats',
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
        // Check for exact bypass paths only (no prefix matching)
        if (BYPASS_PATHS.includes(req.path)) {
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
