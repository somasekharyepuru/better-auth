import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuthCompatMiddleware implements NestMiddleware {
    private readonly logger = new Logger('AuthCompat');

    constructor(private readonly prisma: PrismaService) {}

    async use(req: Request, _res: Response, next: NextFunction) {
        try {
            const cookies = req.headers.cookie || '';
            const sessionTokenMatch = cookies.match(
                /better-auth\.session_token=([^;]+)/,
            );

            if (!sessionTokenMatch) {
                return next();
            }

            const rawToken = decodeURIComponent(sessionTokenMatch[1]);
            const sessionToken = rawToken.split('.')[0];

            const session = await this.prisma.session.findUnique({
                where: { token: sessionToken },
                include: { user: true },
            });

            if (session && session.expiresAt > new Date()) {
                (req as any).userId = session.userId;
                (req as any).user = session.user;
                (req as any).session = session;
            }
        } catch (error) {
            this.logger.error('Auth compat middleware error:', error);
        }

        next();
    }
}
