import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    private prisma = new PrismaClient();
    private readonly logger = new Logger('AuthMiddleware');

    async use(req: Request, _res: Response, next: NextFunction) {
        try {
            // Get session token from cookie
            const cookies = req.headers.cookie || '';
            const sessionTokenMatch = cookies.match(/better-auth\.session_token=([^;]+)/);

            if (!sessionTokenMatch) {
                this.logger.debug('No session token cookie found');
                return next();
            }

            const rawToken = decodeURIComponent(sessionTokenMatch[1]);
            // Better-auth cookie format is: token.signature
            // Database stores just the token part (before the dot)
            const sessionToken = rawToken.split('.')[0];

            this.logger.debug(`Looking up session with token: ${sessionToken.substring(0, 20)}...`);

            // Look up session in database
            const session = await this.prisma.session.findUnique({
                where: { token: sessionToken },
                include: { user: true },
            });

            if (session && session.expiresAt > new Date()) {
                this.logger.debug(`Session found for user: ${session.userId}`);
                // Attach userId to request
                (req as any).userId = session.userId;
                (req as any).user = session.user;
            } else if (session) {
                this.logger.debug('Session found but expired');
            } else {
                this.logger.debug('No session found in database');
            }
        } catch (error) {
            this.logger.error('Auth middleware error:', error);
        }

        next();
    }
}
