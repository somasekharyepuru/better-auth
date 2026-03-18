import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../common/prisma.service';
import { createChildLogger } from '../common/logger.service';

/**
 * Middleware to check if the active organization is banned
 * If banned, block access to organization-specific routes
 */
@Injectable()
export class OrganizationBanMiddleware implements NestMiddleware {
    private logger = createChildLogger('org-ban-middleware');

    constructor(private readonly prisma: PrismaService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        // Extract organization ID from session or route params
        const session = (req as any).session;
        // Security: Better Auth attaches session directly, not nested
        const activeOrgId = session?.activeOrganizationId;

        // Also check route params
        const paramOrgId = req.params?.id || req.params?.organizationId;

        const orgId = activeOrgId || paramOrgId;

        // If no org context, allow the request
        if (!orgId) {
            return next();
        }

        try {
            const organization = await this.prisma.organization.findUnique({
                where: { id: orgId },
                select: {
                    id: true,
                    banned: true,
                    banReason: true,
                    name: true,
                },
            });

            if (organization?.banned) {
                this.logger.warn('Access attempted to banned organization', {
                    orgId,
                    userId: session?.user?.id,
                });

                throw new ForbiddenException({
                    message: 'This organization has been suspended',
                    reason: organization.banReason || 'Contact support for more information',
                    code: 'ORGANIZATION_BANNED',
                });
            }

            next();
        } catch (error) {
            if (error instanceof ForbiddenException) {
                throw error;
            }

            // Unexpected errors should be logged and thrown
            this.logger.error('Unexpected error in ban middleware', { error, orgId });
            throw error;
        }
    }
}
