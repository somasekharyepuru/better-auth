import { Controller, Get, Param, Query, UseGuards, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiCookieAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { AuditService } from './audit.service';
import { AdminGuard } from '../admin/admin.guard';
import { startOfDay, subDays } from 'date-fns';
import { AuditStatsDto, PaginatedAuditLogsDto } from '../common/dto';
import { PrismaService } from '../common/prisma.service';

const allowedRoles = ['admin', 'owner'];

@ApiTags('Audit')
@ApiBearerAuth('bearerAuth')
@ApiCookieAuth('cookieAuth')
@Controller('api/audit')
export class AuditController {
    constructor(
        private readonly auditService: AuditService,
        private readonly prisma: PrismaService,
    ) { }

    private checkRole(session: UserSession) {
        const userRole = (session?.user as any)?.role;
        if (!userRole || !allowedRoles.includes(userRole)) {
            throw new ForbiddenException('Requires admin or owner role');
        }
    }

    @Get('stats')
    @UseGuards(AdminGuard)
    @ApiOperation({ summary: 'Get audit statistics', description: 'Returns overall audit log statistics (admin/owner only)' })
    @ApiResponse({ status: 200, description: 'Statistics retrieved', type: AuditStatsDto })
    @ApiResponse({ status: 403, description: 'Forbidden - requires admin or owner role' })
    async getStats(@Session() session: UserSession): Promise<AuditStatsDto> {

        const now = new Date();
        const todayStart = startOfDay(now);
        const weekStart = subDays(todayStart, 7);

        const [total, success, failed, today, thisWeek] = await Promise.all([
            this.prisma.auditLog.count(),
            this.prisma.auditLog.count({ where: { success: true } }),
            this.prisma.auditLog.count({ where: { success: false } }),
            this.prisma.auditLog.count({ where: { createdAt: { gte: todayStart } } }),
            this.prisma.auditLog.count({ where: { createdAt: { gte: weekStart } } }),
        ]);

        return { total, success, failed, today, thisWeek };
    }

    @Get('logs')
    @UseGuards(AdminGuard)
    @ApiOperation({ summary: 'Query audit logs', description: 'Query audit logs with filters (admin/owner only)' })
    @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
    @ApiQuery({ name: 'userIds', required: false, description: 'Filter by multiple user IDs (comma-separated)' })
    @ApiQuery({ name: 'action', required: false, description: 'Filter by action' })
    @ApiQuery({ name: 'actions', required: false, description: 'Filter by multiple actions (comma-separated)' })
    @ApiQuery({ name: 'resourceType', required: false, description: 'Filter by resource type' })
    @ApiQuery({ name: 'resourceTypes', required: false, description: 'Filter by multiple resource types (comma-separated)' })
    @ApiQuery({ name: 'resourceId', required: false, description: 'Filter by resource ID' })
    @ApiQuery({ name: 'organizationId', required: false, description: 'Filter by organization ID' })
    @ApiQuery({ name: 'sessionId', required: false, description: 'Filter by session ID' })
    @ApiQuery({ name: 'success', required: false, description: 'Filter by success status (true/false)' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO format)' })
    @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO format)' })
    @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field (createdAt, action)' })
    @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (asc, desc)' })
    @ApiQuery({ name: 'limit', required: false, description: 'Max results (1-1000, default: 100)' })
    @ApiQuery({ name: 'offset', required: false, description: 'Pagination offset (default: 0)' })
    @ApiResponse({ status: 200, description: 'Logs retrieved', type: PaginatedAuditLogsDto })
    @ApiResponse({ status: 403, description: 'Forbidden - requires admin or owner role' })
    async getLogs(
        @Session() session: UserSession,
        @Query('userId') userId?: string,
        @Query('userIds') userIds?: string,
        @Query('action') action?: string,
        @Query('actions') actions?: string,
        @Query('resourceType') resourceType?: string,
        @Query('resourceTypes') resourceTypes?: string,
        @Query('resourceId') resourceId?: string,
        @Query('organizationId') organizationId?: string,
        @Query('sessionId') sessionId?: string,
        @Query('success') success?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: string,
        @Query('limit') limitStr?: string,
        @Query('offset') offsetStr?: string,
    ): Promise<PaginatedAuditLogsDto> {
        this.checkRole(session);

        // Security: Validate and parse limit/offset with proper bounds checking
        const parsedLimit = parseInt(limitStr || '100', 10);
        const parsedOffset = parseInt(offsetStr || '0', 10);

        if (isNaN(parsedLimit) || isNaN(parsedOffset)) {
            throw new BadRequestException('Invalid limit or offset parameters');
        }

        const limit = Math.max(1, Math.min(1000, parsedLimit));
        const offset = Math.max(0, parsedOffset);

        let orderBy: { [key: string]: 'asc' | 'desc' } = { createdAt: 'desc' };
        if (sortBy === 'createdAt' || sortBy === 'action') {
            orderBy = { [sortBy]: (sortOrder === 'asc' || sortOrder === 'desc') ? sortOrder : 'desc' };
        }

        return this.auditService.queryLogs({
            userId,
            userIds: userIds ? userIds.split(',') : undefined,
            actions: actions ? actions.split(',') : (action ? [action] : undefined),
            resourceTypes: resourceTypes ? resourceTypes.split(',') : (resourceType ? [resourceType] : undefined),
            resourceId,
            organizationId,
            sessionId,
            success: success === 'true' ? true : success === 'false' ? false : undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            orderBy,
            limit,
            offset,
        });
    }

    @Get('logs/user/:userId')
    @UseGuards(AdminGuard)
    @ApiOperation({ summary: 'Get logs for user', description: 'Get audit logs for a specific user (admin/owner only)' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    @ApiQuery({ name: 'limit', required: false, description: 'Max results (default: 100)' })
    @ApiQuery({ name: 'offset', required: false, description: 'Pagination offset (default: 0)' })
    @ApiResponse({ status: 200, description: 'User logs retrieved', type: PaginatedAuditLogsDto })
    @ApiResponse({ status: 403, description: 'Forbidden - requires admin or owner role' })
    async getUserLogs(
        @Session() session: UserSession,
        @Param('userId') userId: string,
        @Query('limit') limitStr?: string,
        @Query('offset') offsetStr?: string,
    ): Promise<PaginatedAuditLogsDto> {
        this.checkRole(session);

        // Security: Validate and parse limit/offset with proper bounds checking
        const limit = Math.max(1, Math.min(1000, parseInt(limitStr || '100', 10)));
        const offset = Math.max(0, parseInt(offsetStr || '0', 10));

        if (isNaN(limit) || isNaN(offset)) {
            throw new BadRequestException('Invalid limit or offset parameters');
        }

        return this.auditService.queryLogs({
            userId,
            limit,
            offset,
        });
    }

    @Get('logs/org/:orgId')
    @UseGuards(AdminGuard)
    @ApiOperation({ summary: 'Get logs for organization', description: 'Get audit logs for an organization (admin/owner only)' })
    @ApiParam({ name: 'orgId', description: 'Organization ID' })
    @ApiQuery({ name: 'limit', required: false, description: 'Max results (default: 100)' })
    @ApiQuery({ name: 'offset', required: false, description: 'Pagination offset (default: 0)' })
    @ApiResponse({ status: 200, description: 'Organization logs retrieved', type: PaginatedAuditLogsDto })
    @ApiResponse({ status: 403, description: 'Forbidden - requires admin or owner role' })
    async getOrgLogs(
        @Session() session: UserSession,
        @Param('orgId') orgId: string,
        @Query('limit') limitStr?: string,
        @Query('offset') offsetStr?: string,
    ): Promise<PaginatedAuditLogsDto> {
        this.checkRole(session);

        // Security: Validate and parse limit/offset with proper bounds checking
        const limit = Math.max(1, Math.min(1000, parseInt(limitStr || '100', 10)));
        const offset = Math.max(0, parseInt(offsetStr || '0', 10));

        if (isNaN(limit) || isNaN(offset)) {
            throw new BadRequestException('Invalid limit or offset parameters');
        }

        return this.auditService.queryLogs({
            organizationId: orgId,
            limit,
            offset,
        });
    }

    @Get('logs/action/:action')
    @UseGuards(AdminGuard)
    @ApiOperation({ summary: 'Get logs by action', description: 'Get audit logs filtered by action type (admin/owner only)' })
    @ApiParam({ name: 'action', description: 'Action type (e.g., user.login, org.create)' })
    @ApiQuery({ name: 'limit', required: false, description: 'Max results (default: 100)' })
    @ApiQuery({ name: 'offset', required: false, description: 'Pagination offset (default: 0)' })
    @ApiResponse({ status: 200, description: 'Action logs retrieved', type: PaginatedAuditLogsDto })
    @ApiResponse({ status: 403, description: 'Forbidden - requires admin or owner role' })
    async getActionLogs(
        @Session() session: UserSession,
        @Param('action') action: string,
        @Query('limit') limitStr?: string,
        @Query('offset') offsetStr?: string,
    ): Promise<PaginatedAuditLogsDto> {
        this.checkRole(session);

        // Security: Validate and parse limit/offset with proper bounds checking
        const limit = Math.max(1, Math.min(1000, parseInt(limitStr || '100', 10)));
        const offset = Math.max(0, parseInt(offsetStr || '0', 10));

        if (isNaN(limit) || isNaN(offset)) {
            throw new BadRequestException('Invalid limit or offset parameters');
        }

        return this.auditService.queryLogs({
            action,
            limit,
            offset,
        });
    }

    @Get('logs/:id')
    @UseGuards(AdminGuard)
    @ApiOperation({ summary: 'Get single log entry', description: 'Get a specific audit log entry by ID (admin/owner only)' })
    @ApiParam({ name: 'id', description: 'Log entry ID' })
    @ApiResponse({ status: 200, description: 'Log entry retrieved', type: Object })
    @ApiResponse({ status: 403, description: 'Forbidden - requires admin or owner role' })
    @ApiResponse({ status: 404, description: 'Log entry not found' })
    async getLog(
        @Session() session: UserSession,
        @Param('id') id: string,
    ): Promise<any> {
        this.checkRole(session);

        const log = await this.prisma.auditLog.findUnique({
            where: { id },
        });

        if (!log) {
            throw new NotFoundException('Audit log not found');
        }

        return log;
    }

    @Get('me/timeline')
    @ApiOperation({ summary: 'Get my audit timeline', description: 'Get personal audit timeline for authenticated user' })
    @ApiQuery({ name: 'action', required: false, description: 'Filter by exact action type' })
    @ApiQuery({ name: 'actionPrefix', required: false, description: 'Filter by action prefix (e.g. user.login matches user.login.*)' })
    @ApiQuery({ name: 'search', required: false, description: 'Search in action and IP address' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Filter from date (ISO format)' })
    @ApiQuery({ name: 'endDate', required: false, description: 'Filter to date (ISO format)' })
    @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (asc, desc). Default: desc' })
    @ApiQuery({ name: 'limit', required: false, description: 'Max results (1-200, default: 20)' })
    @ApiQuery({ name: 'offset', required: false, description: 'Pagination offset (default: 0)' })
    @ApiResponse({ status: 200, description: 'Timeline retrieved', type: PaginatedAuditLogsDto })
    @ApiResponse({ status: 401, description: 'Not authenticated' })
    async getMyTimeline(
        @Session() session: UserSession,
        @Query('action') action?: string,
        @Query('actionPrefix') actionPrefix?: string,
        @Query('search') search?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('sortOrder') sortOrder?: string,
        @Query('limit') limitStr?: string,
        @Query('offset') offsetStr?: string,
    ): Promise<PaginatedAuditLogsDto> {
        const userId = (session?.user as any)?.id;
        if (!userId) {
            throw new ForbiddenException('Not authenticated');
        }

        // Security: Validate and parse limit/offset with proper bounds checking
        const parsedLimit = parseInt(limitStr || '20', 10);
        const parsedOffset = parseInt(offsetStr || '0', 10);

        if (isNaN(parsedLimit) || isNaN(parsedOffset)) {
            throw new BadRequestException('Invalid limit or offset parameters');
        }

        const limit = Math.max(1, Math.min(200, parsedLimit));
        const offset = Math.max(0, parsedOffset);

        const order: 'asc' | 'desc' = sortOrder === 'asc' ? 'asc' : 'desc';

        return this.auditService.queryLogs({
            userId,
            action,
            actionPrefix,
            search: search?.trim() || undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            limit,
            offset,
            orderBy: { createdAt: order },
        });
    }
}
