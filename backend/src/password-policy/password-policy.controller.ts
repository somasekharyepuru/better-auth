import { Controller, Get, Put, Param, Body, Req, ForbiddenException } from '@nestjs/common';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiCookieAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { PasswordPolicyService, PasswordPolicy } from './password-policy.service';
import { createChildLogger } from '../common/logger.service';
import { auditService } from '../audit/audit.service';
import { UpdatePasswordPolicyDto, PasswordPolicyDto } from '../common/dto';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from '../common/prisma.service';

const logger = createChildLogger('password-policy');

@ApiTags('Password Policy')
@ApiBearerAuth('bearerAuth')
@ApiCookieAuth('cookieAuth')
@Controller('password-policy')
export class PasswordPolicyController {
    constructor(
        private readonly passwordPolicyService: PasswordPolicyService,
        private readonly prisma: PrismaService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Get global password policy', description: 'Get the global password policy settings (admin only)' })
    @ApiResponse({ status: 200, description: 'Policy retrieved', type: PasswordPolicyDto })
    @ApiResponse({ status: 401, description: 'Not authenticated' })
    @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
    async getGlobalPolicy(@Session() session: UserSession): Promise<PasswordPolicy> {
        if (!session?.user?.role || session.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can view password policies');
        }

        return this.passwordPolicyService.getGlobalPolicy();
    }

    @Put()
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @ApiOperation({ summary: 'Update global password policy', description: 'Update the global password policy settings (admin only)' })
    @ApiBody({ type: UpdatePasswordPolicyDto })
    @ApiResponse({ status: 200, description: 'Policy updated', type: PasswordPolicyDto })
    @ApiResponse({ status: 401, description: 'Not authenticated' })
    @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
    async updateGlobalPolicy(
        @Session() session: UserSession,
        @Req() req: any,
        @Body() data: UpdatePasswordPolicyDto,
    ): Promise<PasswordPolicy> {
        if (!session?.user?.role || session.user.role !== 'admin') {
            throw new ForbiddenException('Only admins can update password policies');
        }

        logger.info('Updating global password policy', { updatedBy: session.user.id, data });
        const result = await this.passwordPolicyService.updateGlobalPolicy(data);

        const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers?.['x-real-ip'] || 'unknown';
        const userAgent = req.headers?.['user-agent'] || 'unknown';

        await auditService.logAdminAction(
            session.user.id,
            'password.policy.changed',
            {
                changes: data,
            },
            session.session?.id,
            ipAddress,
            userAgent,
        );

        return result;
    }

    @Get('organization/:id')
    @ApiOperation({ summary: 'Get organization password policy', description: 'Get password policy for a specific organization' })
    @ApiParam({ name: 'id', description: 'Organization ID' })
    @ApiResponse({ status: 200, description: 'Policy retrieved', type: PasswordPolicyDto })
    @ApiResponse({ status: 401, description: 'Not authenticated' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Organization not found' })
    async getOrganizationPolicy(
        @Session() session: UserSession,
        @Param('id') organizationId: string,
    ): Promise<PasswordPolicy> {
        if (!session?.user) {
            throw new ForbiddenException('Authentication required');
        }

        if (session.user.role !== 'admin') {
            const member = await this.prisma.member.findFirst({
                where: { organizationId, userId: session.user.id },
            });
            if (!member || !['owner', 'admin', 'manager'].includes(member.role)) {
                throw new ForbiddenException('Insufficient permissions to view this organization\'s password policy');
            }
        }

        return this.passwordPolicyService.getOrganizationPolicy(organizationId);
    }

    @Put('organization/:id')
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @ApiOperation({ summary: 'Update organization password policy', description: 'Update password policy for a specific organization (admin only)' })
    @ApiParam({ name: 'id', description: 'Organization ID' })
    @ApiBody({ type: UpdatePasswordPolicyDto })
    @ApiResponse({ status: 200, description: 'Policy updated', type: PasswordPolicyDto })
    @ApiResponse({ status: 401, description: 'Not authenticated' })
    @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
    @ApiResponse({ status: 404, description: 'Organization not found' })
    async updateOrganizationPolicy(
        @Session() session: UserSession,
        @Req() req: any,
        @Param('id') organizationId: string,
        @Body() data: UpdatePasswordPolicyDto,
    ): Promise<PasswordPolicy> {
        if (!session?.user) {
            throw new ForbiddenException('Authentication required');
        }

        if (session.user.role !== 'admin') {
            const member = await this.prisma.member.findFirst({
                where: { organizationId, userId: session.user.id },
            });
            if (!member || !['owner', 'admin'].includes(member.role)) {
                throw new ForbiddenException('Only organization owners or admins can update password policies');
            }
        }

        logger.info('Updating organization password policy', {
            organizationId,
            updatedBy: session.user.id,
            data
        });

        const result = await this.passwordPolicyService.updateOrganizationPolicy(organizationId, data);

        const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers?.['x-real-ip'] || 'unknown';
        const userAgent = req.headers?.['user-agent'] || 'unknown';

        await auditService.logAdminAction(
            session.user.id,
            'password.policy.org.changed',
            {
                organizationId,
                changes: data,
            },
            session.session?.id,
            ipAddress,
            userAgent,
        );

        return result;
    }
}
