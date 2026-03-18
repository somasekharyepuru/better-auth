import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { createChildLogger } from './logger.service';

interface RequestContext {
    requestId: string;
    startTime: number;
}

declare global {
    namespace Express {
        interface Request {
            context?: RequestContext;
            requestId?: string;
        }
    }
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void {
        // Validate X-Request-ID header format (must be valid UUID)
        const clientRequestId = req.headers['x-request-id'] as string;
        const requestId = this.isValidUuid(clientRequestId) ? clientRequestId : randomUUID();
        const startTime = Date.now();

        req.context = {
            requestId,
            startTime,
        };
        req.requestId = requestId;

        res.setHeader('X-Request-ID', requestId);

        const logger = createChildLogger('http', { requestId });

        res.on('finish', () => {
            const duration = Date.now() - startTime;
            const { statusCode } = res;

            const logData = {
                method: req.method,
                path: req.path,
                statusCode,
                duration,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            };

            if (statusCode >= 500) {
                logger.error('Request failed', logData);
            } else if (statusCode >= 400) {
                logger.warn('Request error', logData);
            } else if (statusCode >= 300) {
                logger.debug('Request redirected', logData);
            } else if (statusCode >= 200) {
                logger.debug('Request completed', logData);
            }
        });

        next();
    }

    /**
     * Validate if a string is a valid UUID format
     * Prevents log injection and ensures request traceability
     */
    private isValidUuid(value: string | undefined): boolean {
        if (!value) return false;
        // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value);
    }
}

export function getLoggerForRequest(req: Request) {
    return createChildLogger('http', { requestId: req.requestId });
}
