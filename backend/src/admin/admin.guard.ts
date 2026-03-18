import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { auditService } from '../audit/audit.service';
import { createChildLogger } from '../common/logger.service';

const ALLOWED_ROLES = ['admin', 'owner'];
const adminGuardLogger = createChildLogger('admin-guard');

/**
 * Guard to protect admin-only routes.
 * Checks if the authenticated user has admin or owner role.
 * Apply at controller level: @UseGuards(AdminGuard)
 */
@Injectable()
export class AdminGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const session = request.session;

        if (!session?.user?.role || !ALLOWED_ROLES.includes(session.user.role)) {
            const reason = !session?.user?.role
                ? 'Missing session role'
                : `Role "${session.user.role}" is not allowed`;

            try {
                await auditService.logAction({
                    userId: session?.user?.id ?? 'anonymous',
                    action: 'admin.access.denied',
                    resourceType: 'admin',
                    resourceId: request.path,
                    sessionId: session?.session?.id,
                    details: {
                        userId: session?.user?.id,
                        path: request.path,
                        timestamp: new Date().toISOString(),
                        reason,
                    },
                    ipAddress: request.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
                        request.headers?.['x-real-ip'] ||
                        request.ip,
                    userAgent: request.headers?.['user-agent'],
                    success: false,
                    errorMessage: reason,
                });
            } catch (error) {
                adminGuardLogger.error('Failed to persist denied admin access audit log', {
                    error,
                    userId: session?.user?.id,
                    path: request.path,
                });
            }

            throw new ForbiddenException('Admin access required');
        }

        return true;
    }
}
