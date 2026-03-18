import {
    Controller,
    Get,
    Post,
    Delete,
    Patch,
    Param,
    Body,
    Req,
    UseGuards,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiCookieAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { OrganizationService } from './organization.service';
import { auditService } from '../audit/audit.service';
import { fromNodeHeaders } from 'better-auth/node';
import { OrgPermissionGuard } from '../auth/guards/org-permission.guard';
import { RequireOrgPermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/require-permission.decorator';
import { InitiateTransferDto, UpdateTeamDto, SuccessResponseDto } from '../common/dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Organizations')
@ApiBearerAuth('bearerAuth')
@ApiCookieAuth('cookieAuth')
@Controller('api/organizations')
@UseGuards(OrgPermissionGuard)
export class OrganizationController {
    constructor(private readonly organizationService: OrganizationService) {}

    @Post(':id/transfer')
    @RequireOrgPermission('organization', 'delete')
    @Throttle({ default: { limit: 2, ttl: 360000 } })
    @ApiOperation({ summary: 'Initiate ownership transfer', description: 'Initiate organization ownership transfer to another user (owner only). Creates a 7-day transfer window.' })
    @ApiParam({ name: 'id', description: 'Organization ID' })
    @ApiBody({ type: InitiateTransferDto })
    @ApiResponse({ status: 200, description: 'Transfer initiated' })
    @ApiResponse({ status: 400, description: 'Invalid request (e.g., target not a member)' })
    @ApiResponse({ status: 401, description: 'Not authenticated' })
    @ApiResponse({ status: 403, description: 'Forbidden - not organization owner' })
    @ApiResponse({ status: 404, description: 'Organization not found' })
    async initiateTransfer(
        @Param('id') orgId: string,
        @Body() body: InitiateTransferDto,
        @Session() session: UserSession,
        @Req() req: any,
    ): Promise<Object> {
        if (!session?.user?.id) {
            throw new ForbiddenException('Authentication required');
        }

        const result = await this.organizationService.initiateTransfer(
            orgId,
            session.user.id,
            body.newOwnerId,
        );

        const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers?.['x-real-ip'] || 'unknown';
        const userAgent = req.headers?.['user-agent'] || 'unknown';

        await auditService.logOrganizationAction(
            orgId,
            session.user.id,
            'org.transfer.initiated',
            {
                newOwnerId: body.newOwnerId,
                transferId: result.transferId,
                expiresAt: result.expiresAt,
            },
            session.session?.id,
            ipAddress,
            userAgent,
        );

        return result;
    }

    @Get(':id/transfer')
    @RequireOrgPermission('organization', 'update')
    @ApiOperation({ summary: 'Get pending transfer', description: 'Get pending ownership transfer for an organization' })
    @ApiParam({ name: 'id', description: 'Organization ID' })
    @ApiResponse({ status: 200, description: 'Transfer details', type: Object })
    @ApiResponse({ status: 401, description: 'Not authenticated' })
    @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
    @ApiResponse({ status: 404, description: 'No pending transfer' })
    async getPendingTransfer(
        @Param('id') orgId: string,
        @Session() session: UserSession,
    ): Promise<Object | null> {
        if (!session?.user?.id) {
            throw new ForbiddenException('Authentication required');
        }
        return this.organizationService.getPendingTransfer(orgId);
    }

    @Delete('transfer/:transferId')
    @ApiOperation({ summary: 'Cancel pending transfer', description: 'Cancel a pending ownership transfer (current owner only)' })
    @ApiParam({ name: 'transferId', description: 'Transfer ID' })
    @ApiResponse({ status: 200, description: 'Transfer cancelled', type: SuccessResponseDto })
    @ApiResponse({ status: 401, description: 'Not authenticated' })
    @ApiResponse({ status: 403, description: 'Forbidden - not the transfer initiator' })
    @ApiResponse({ status: 404, description: 'Transfer not found' })
    async cancelTransfer(
        @Param('transferId') transferId: string,
        @Session() session: UserSession,
        @Req() req: any,
    ): Promise<SuccessResponseDto> {
        if (!session?.user?.id) {
            throw new ForbiddenException('Authentication required');
        }

        const result = await this.organizationService.cancelTransfer(transferId, session.user.id);

        const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers?.['x-real-ip'] || 'unknown';
        const userAgent = req.headers?.['user-agent'] || 'unknown';

        await auditService.logAction({
            userId: session.user.id,
            action: 'org.transfer.cancelled',
            resourceType: 'organization',
            resourceId: transferId,
            sessionId: session.session?.id || undefined,
            details: { transferId },
            ipAddress,
            userAgent,
        });

        return result;
    }

    @Get('transfer/confirm/:token')
    @ApiOperation({ summary: 'Get transfer info by token', description: 'Get ownership transfer information using confirmation token' })
    @ApiParam({ name: 'token', description: 'Confirmation token' })
    @ApiResponse({ status: 200, description: 'Transfer details' })
    @ApiResponse({ status: 401, description: 'Not authenticated' })
    @ApiResponse({ status: 404, description: 'Transfer not found or expired' })
    async getTransferInfo(
        @Param('token') token: string,
        @Session() session: UserSession,
    ): Promise<Object> {
        if (!session?.user?.id) {
            throw new ForbiddenException('Authentication required');
        }
        const transfer = await this.organizationService.getTransferByToken(token);
        if (!transfer) {
            throw new NotFoundException('Transfer not found');
        }
        return transfer;
    }

    @Public()
    @Post('transfer/confirm/:token')
    @ApiOperation({ summary: 'Confirm ownership transfer', description: 'Confirm ownership transfer as the new owner' })
    @ApiParam({ name: 'token', description: 'Confirmation token from email' })
    @ApiResponse({ status: 200, description: 'Transfer confirmed' })
    @ApiResponse({ status: 400, description: 'Transfer expired or already confirmed' })
    @ApiResponse({ status: 401, description: 'Not authenticated' })
    @ApiResponse({ status: 403, description: 'Forbidden - not the intended new owner' })
    @ApiResponse({ status: 404, description: 'Transfer not found' })
    async confirmTransfer(
        @Param('token') token: string,
        @Session() session: UserSession,
        @Req() req: any,
    ): Promise<Object> {
        if (!session?.user?.id) {
            throw new ForbiddenException('Authentication required');
        }

        const result = await this.organizationService.confirmTransfer(token, session.user.id);

        const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers?.['x-real-ip'] || 'unknown';
        const userAgent = req.headers?.['user-agent'] || 'unknown';

        await auditService.logOrganizationAction(
            result.organizationId,
            session.user.id,
            'org.transfer.confirmed',
            {
                organizationName: result.organizationName,
            },
            session.session?.id,
            ipAddress,
            userAgent,
        );

        return result;
    }

    @Public()
    @Post('transfer/decline/:token')
    @ApiOperation({ summary: 'Decline ownership transfer', description: 'Decline ownership transfer as the new owner' })
    @ApiParam({ name: 'token', description: 'Confirmation token from email' })
    @ApiResponse({ status: 200, description: 'Transfer declined', type: Object })
    @ApiResponse({ status: 401, description: 'Not authenticated' })
    @ApiResponse({ status: 404, description: 'Transfer not found' })
    async declineTransfer(
        @Param('token') token: string,
        @Session() session: UserSession,
        @Req() req: any,
    ) {
        if (!session?.user?.id) {
            throw new ForbiddenException('Authentication required');
        }

        const result = await this.organizationService.declineTransfer(token, session.user.id);

        const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers?.['x-real-ip'] || 'unknown';
        const userAgent = req.headers?.['user-agent'] || 'unknown';

        await auditService.logAction({
            userId: session.user.id,
            action: 'org.transfer.declined',
            resourceType: 'organization',
            resourceId: result.organizationId,
            sessionId: session.session?.id || undefined,
            details: {
                organizationName: result.organizationName,
            },
            ipAddress,
            userAgent,
        });

        return result;
    }

    @Post('invitations/:id/resend')
    @ApiOperation({ summary: 'Resend invitation email', description: 'Resend organization invitation email' })
    @ApiParam({ name: 'id', description: 'Invitation ID' })
    @ApiResponse({ status: 200, description: 'Invitation resent' })
    @ApiResponse({ status: 401, description: 'Not authenticated' })
    @ApiResponse({ status: 403, description: 'Forbidden - not a member of the organization' })
    @ApiResponse({ status: 404, description: 'Invitation not found' })
    async resendInvitation(
        @Param('id') invitationId: string,
        @Session() session: UserSession,
        @Req() req: any,
    ): Promise<Object> {
        if (!session?.user?.id) {
            throw new ForbiddenException('Authentication required');
        }

        const result = await this.organizationService.resendInvitation(invitationId, session.user.id);

        const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers?.['x-real-ip'] || 'unknown';
        const userAgent = req.headers?.['user-agent'] || 'unknown';

        await auditService.logOrganizationAction(
            result.organizationId,
            session.user.id,
            'org.member.invite.resent',
            {
                invitationId,
                email: result.email,
            },
            session.session?.id,
            ipAddress,
            userAgent,
        );

        return result;
    }

    @Patch(':id/teams/:teamId')
    @RequireOrgPermission('team', 'update')
    @ApiOperation({ summary: 'Update team', description: 'Update team name and description' })
    @ApiParam({ name: 'id', description: 'Organization ID' })
    @ApiParam({ name: 'teamId', description: 'Team ID' })
    @ApiBody({ type: UpdateTeamDto })
    @ApiResponse({ status: 200, description: 'Team updated', type: Object })
    @ApiResponse({ status: 401, description: 'Not authenticated' })
    @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Team not found' })
    async updateTeam(
        @Param('id') orgId: string,
        @Param('teamId') teamId: string,
        @Body() body: UpdateTeamDto,
        @Session() session: UserSession,
        @Req() req: any,
    ) {
        const headers = fromNodeHeaders(req.headers);
        const result = await this.organizationService.updateTeam(teamId, body, headers);

        const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers?.['x-real-ip'] || 'unknown';
        const userAgent = req.headers?.['user-agent'] || 'unknown';

        await auditService.logOrganizationAction(
            result.organizationId,
            session.user.id,
            'org.team.updated',
            {
                teamId,
                name: result.name,
            },
            session.session?.id,
            ipAddress,
            userAgent,
        );

        return result;
    }

    @Delete(':id/teams/:teamId')
    @RequireOrgPermission('team', 'delete')
    @ApiOperation({ summary: 'Delete team', description: 'Delete a team from the organization' })
    @ApiParam({ name: 'id', description: 'Organization ID' })
    @ApiParam({ name: 'teamId', description: 'Team ID' })
    @ApiResponse({ status: 200, description: 'Team deleted', type: SuccessResponseDto })
    @ApiResponse({ status: 401, description: 'Not authenticated' })
    @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Team not found' })
    async deleteTeam(
        @Param('id') orgId: string,
        @Param('teamId') teamId: string,
        @Session() session: UserSession,
        @Req() req: any,
    ): Promise<SuccessResponseDto> {
        const headers = fromNodeHeaders(req.headers);
        const result = await this.organizationService.deleteTeam(orgId, teamId, headers);

        const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers?.['x-real-ip'] || 'unknown';
        const userAgent = req.headers?.['user-agent'] || 'unknown';

        await auditService.logOrganizationAction(
            result.organizationId,
            session.user.id,
            'org.team.deleted',
            {
                teamId,
                teamName: result.name,
            },
            session.session?.id,
            ipAddress,
            userAgent,
        );

        return { success: true, message: 'Team deleted' };
    }

    @Get(':id/teams-with-members')
    @RequireOrgPermission('team', 'read')
    @ApiOperation({ summary: 'List teams with members', description: 'Get all teams with their member details' })
    @ApiParam({ name: 'id', description: 'Organization ID' })
    @ApiResponse({ status: 200, description: 'Teams retrieved' })
    @ApiResponse({ status: 401, description: 'Not authenticated' })
    @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
    async listTeamsWithMembers(
        @Param('id') orgId: string,
        @Session() session: UserSession,
    ): Promise<Object[]> {
        if (!session?.user?.id) {
            throw new ForbiddenException('Authentication required');
        }
        return this.organizationService.listTeamsWithMembers(orgId, session.user.id);
    }
}
