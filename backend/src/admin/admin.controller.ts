import { Controller, Get, Post, Delete, Patch, UseGuards, ForbiddenException, Body, Query, Param, NotFoundException, BadRequestException, Req, Headers } from '@nestjs/common';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { auditService } from '../audit/audit.service';
import { fromNodeHeaders } from 'better-auth/node';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

const allowedRoles = ['admin', 'owner'];

@Controller('api/admin')
@UseGuards(AdminGuard) // Ensure ThrottlerGuard is applied globally or added here if not global
@Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    private checkRole(session: UserSession) {
        const userRole = (session?.user as any)?.role;
        if (!userRole || !allowedRoles.includes(userRole)) {
            throw new ForbiddenException('Requires admin or owner role');
        }
    }

    private checkNotSelf(currentUserId: string, targetUserId: string, action: string) {
        if (currentUserId === targetUserId) {
            throw new ForbiddenException(`You cannot ${action} yourself`);
        }
    }

    @Get('stats/dashboard')
    async getDashboardStats() {

        return this.adminService.getDashboardStats();
    }

    @Get('stats/users')
    async getUserStats() {

        return this.adminService.getUserStats();
    }

    @Get('stats/organizations')
    async getOrganizationStats() {

        return this.adminService.getOrganizationStats();
    }

    @Post('create-user')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // Stricter limit for creation
    async createUser(@Session() session: UserSession, @Body() body: { email: string; name: string; role?: string; forcePasswordChange?: boolean }, @Req() req: any) {

        const headers = fromNodeHeaders(req.headers);
        const result = await this.adminService.createUser(body, headers);

        const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers?.['x-real-ip'] || 'unknown';
        const userAgent = req.headers?.['user-agent'] || 'unknown';

        await auditService.logAdminAction(
            session.user.id,
            'admin.user.created',
            {
                targetUserId: result.user.id,
                email: result.user.email,
                role: result.user.role,
                forcePasswordChange: body.forcePasswordChange,
            },
            session.session?.id,
            ipAddress,
            userAgent,
        );

        return result;
    }

    /**
     * List ALL organizations (admin only)
     */
    @Get('organizations')
    async listAllOrganizations(
        @Session() session: UserSession,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('banned') banned?: "all" | "true" | "false",
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
        @Query('sortBy') sortBy?: "createdAt" | "name" | "memberCount",
        @Query('sortOrder') sortOrder?: "asc" | "desc",
    ) {

        return this.adminService.listAllOrganizations({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 50,
            search,
            banned,
            dateFrom,
            dateTo,
            sortBy,
            sortOrder,
        });
    }

    /**
     * Get organization details (admin only)
     */
    @Get('organizations/:id')
    async getOrganization(
        @Session() session: UserSession,
        @Param('id') id: string,
    ) {

        const org = await this.adminService.getOrganizationDetails(id);
        if (!org) {
            throw new NotFoundException('Organization not found');
        }
        return org;
    }

    /**
     * Ban an organization (admin only)
     */
    @Post('organizations/:id/ban')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    async banOrganization(
        @Session() session: UserSession,
        @Param('id') id: string,
        @Body() body: { reason?: string },
        @Req() req: any,
    ) {

        try {
            const result = await this.adminService.banOrganization(id, body.reason);

            const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.headers?.['x-real-ip'] || 'unknown';
            const userAgent = req.headers?.['user-agent'] || 'unknown';

            await auditService.logAdminAction(
                session.user.id,
                'admin.organization.banned',
                {
                    organizationId: id,
                    reason: body.reason || 'Banned by administrator',
                },
                session.session?.id,
                ipAddress,
                userAgent,
            );

            return result;
        } catch (error: any) {
            throw new BadRequestException(error.message);
        }
    }

    /**
     * Unban an organization (admin only)
     */
    @Post('organizations/:id/unban')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    async unbanOrganization(
        @Session() session: UserSession,
        @Param('id') id: string,
        @Req() req: any,
    ) {

        try {
            const result = await this.adminService.unbanOrganization(id);

            const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.headers?.['x-real-ip'] || 'unknown';
            const userAgent = req.headers?.['user-agent'] || 'unknown';

            await auditService.logAdminAction(
                session.user.id,
                'admin.organization.unbanned',
                {
                    organizationId: id,
                },
                session.session?.id,
                ipAddress,
                userAgent,
            );

            return result;
        } catch (error: any) {
            throw new BadRequestException(error.message);
        }
    }

    /**
     * Delete an organization (admin only)
     */
    @Delete('organizations/:id')
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // Very strict limit for deletion
    async deleteOrganization(
        @Session() session: UserSession,
        @Param('id') id: string,
        @Req() req: any,
    ) {

        try {
            const result = await this.adminService.deleteOrganization(id);

            const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.headers?.['x-real-ip'] || 'unknown';
            const userAgent = req.headers?.['user-agent'] || 'unknown';

            await auditService.logAdminAction(
                session.user.id,
                'admin.organization.deleted',
                {
                    organizationId: id,
                    organizationName: result.name,
                },
                session.session?.id,
                ipAddress,
                userAgent,
            );

            return { success: true, message: 'Organization deleted' };
        } catch (error: any) {
            throw new BadRequestException(error.message);
        }
    }

    /**
     * Ban a user (admin only) - Uses Better Auth
     */
    @Post('users/:id/ban')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    async banUser(
        @Session() session: UserSession,
        @Param('id') id: string,
        @Body() body: { reason?: string },
        @Req() req: any,
    ) {

        this.checkNotSelf(session.user.id, id, 'ban');
        try {
            const headers = fromNodeHeaders(req.headers);
            const result = await this.adminService.banUser(id, body.reason, headers);

            const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.headers?.['x-real-ip'] || 'unknown';
            const userAgent = req.headers?.['user-agent'] || 'unknown';

            await auditService.logAdminAction(
                session.user.id,
                'admin.user.ban',
                {
                    targetUserId: id,
                    reason: body.reason || 'Banned by administrator',
                },
                session.session?.id,
                ipAddress,
                userAgent,
            );

            return result;
        } catch (error: any) {
            throw new BadRequestException(error.message);
        }
    }

    /**
     * Unban a user (admin only) - Uses Better Auth
     */
    @Post('users/:id/unban')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    async unbanUser(
        @Session() session: UserSession,
        @Param('id') id: string,
        @Req() req: any,
    ) {

        this.checkNotSelf(session.user.id, id, 'unban');
        try {
            const headers = fromNodeHeaders(req.headers);
            const result = await this.adminService.unbanUser(id, headers);

            const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.headers?.['x-real-ip'] || 'unknown';
            const userAgent = req.headers?.['user-agent'] || 'unknown';

            await auditService.logAdminAction(
                session.user.id,
                'admin.user.unban',
                {
                    targetUserId: id,
                },
                session.session?.id,
                ipAddress,
                userAgent,
            );

            return result;
        } catch (error: any) {
            throw new BadRequestException(error.message);
        }
    }

    /**
     * Change user role (admin only) - Uses Better Auth
     */
    @Post('users/:id/role')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    async changeUserRole(
        @Session() session: UserSession,
        @Param('id') id: string,
        @Body() body: { role: string },
        @Req() req: any,
    ) {

        this.checkNotSelf(session.user.id, id, 'change the role of');
        try {
            const headers = fromNodeHeaders(req.headers);
            const result = await this.adminService.changeUserRole(id, body.role, headers);

            const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.headers?.['x-real-ip'] || 'unknown';
            const userAgent = req.headers?.['user-agent'] || 'unknown';

            await auditService.logAdminAction(
                session.user.id,
                'admin.user.role.changed',
                {
                    targetUserId: id,
                    newRole: body.role,
                },
                session.session?.id,
                ipAddress,
                userAgent,
            );

            return result;
        } catch (error: any) {
            throw new BadRequestException(error.message);
        }
    }

    /**
     * Reset user password (admin only) - Uses Better Auth
     */
    @Post('users/:id/reset-password')
    @Throttle({ default: { limit: 3, ttl: 60000 } })
    async resetUserPassword(
        @Session() session: UserSession,
        @Param('id') id: string,
        @Req() req: any,
    ) {

        try {
            const headers = fromNodeHeaders(req.headers);
            const result = await this.adminService.resetUserPassword(id, headers);

            const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.headers?.['x-real-ip'] || 'unknown';
            const userAgent = req.headers?.['user-agent'] || 'unknown';

            await auditService.logAdminAction(
                session.user.id,
                'admin.user.password.reset',
                {
                    targetUserId: id,
                },
                session.session?.id,
                ipAddress,
                userAgent,
            );

            return result;
        } catch (error: any) {
            throw new BadRequestException(error.message);
        }
    }

    /**
     * Revoke all user sessions (admin only) - Uses Better Auth
     */
    @Delete('users/:id/sessions')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    async revokeUserSessions(
        @Session() session: UserSession,
        @Param('id') id: string,
        @Req() req: any,
    ) {

        this.checkNotSelf(session.user.id, id, 'revoke sessions of');
        try {
            const headers = fromNodeHeaders(req.headers);
            const result = await this.adminService.revokeUserSessions(id, headers);

            const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.headers?.['x-real-ip'] || 'unknown';
            const userAgent = req.headers?.['user-agent'] || 'unknown';

            await auditService.logAdminAction(
                session.user.id,
                'admin.session.revoke.all',
                {
                    targetUserId: id,
                },
                session.session?.id,
                ipAddress,
                userAgent,
            );

            return result;
        } catch (error: any) {
            throw new BadRequestException(error.message);
        }
    }

    /**
     * Delete a user (admin only) - Uses Better Auth
     */
    @Delete('users/:id')
    @Throttle({ default: { limit: 3, ttl: 60000 } })
    async deleteUser(
        @Session() session: UserSession,
        @Param('id') id: string,
        @Req() req: any,
    ) {

        this.checkNotSelf(session.user.id, id, 'delete');
        try {
            const headers = fromNodeHeaders(req.headers);
            const result = await this.adminService.deleteUser(id, headers);

            const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.headers?.['x-real-ip'] || 'unknown';
            const userAgent = req.headers?.['user-agent'] || 'unknown';

            await auditService.logAdminAction(
                session.user.id,
                'admin.user.deleted',
                {
                    targetUserId: id,
                },
                session.session?.id,
                ipAddress,
                userAgent,
            );

            return { success: true, message: 'User deleted' };
        } catch (error: any) {
            throw new BadRequestException(error.message);
        }
    }

    /**
     * Change organization member role (admin only)
     */
    @Patch('organizations/:id/members/:memberId/role')
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    async changeOrganizationMemberRole(
        @Session() session: UserSession,
        @Param('id') organizationId: string,
        @Param('memberId') memberId: string,
        @Body() body: { role: string },
        @Req() req: any,
    ) {
        try {
            const result = await this.adminService.changeOrganizationMemberRole(
                organizationId,
                memberId,
                body.role,
            );

            const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.headers?.['x-real-ip'] || 'unknown';
            const userAgent = req.headers?.['user-agent'] || 'unknown';

            await auditService.logAdminAction(
                session.user.id,
                'admin.org.member.role.changed',
                {
                    organizationId,
                    memberId,
                    newRole: body.role,
                },
                session.session?.id,
                ipAddress,
                userAgent,
            );

            return result;
        } catch (error: any) {
            throw new BadRequestException(error.message);
        }
    }

    /**
     * Get organization ban status (admin only)
     */
    @Get('organizations/:id/ban-status')
    async getOrganizationBanStatus(
        @Session() session: UserSession,
        @Param('id') id: string,
    ) {

        const status = await this.adminService.getOrganizationBanStatus(id);
        if (!status) {
            throw new NotFoundException('Organization not found');
        }
        return status;
    }
}
