import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Query,
    Req,
    HttpCode,
    HttpStatus,
    UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { FocusSuiteAnalyticsService } from './focus-suite-analytics.service';
import { FocusSuiteMatrixService, CreateFocusBlockFromMatrixInput } from './focus-suite-matrix.service';

@Controller('api/focus-suite')
export class FocusSuiteController {
    constructor(
        private readonly analyticsService: FocusSuiteAnalyticsService,
        private readonly matrixService: FocusSuiteMatrixService,
    ) { }

    private getUserIdFromRequest(req: Request): string {
        const userId = (req as any).userId;
        if (!userId) {
            throw new UnauthorizedException('Not authenticated');
        }
        return userId;
    }

    // ==========================================
    // Analytics Endpoints
    // ==========================================

    /**
     * GET /api/focus-suite/analytics
     * Get complete Focus Suite analytics for date range
     */
    @Get('analytics')
    async getAnalytics(
        @Req() req: Request,
        @Query('start') start: string,
        @Query('end') end: string,
    ) {
        const userId = this.getUserIdFromRequest(req);
        const startDate = new Date(start);
        const endDate = new Date(end);
        return this.analyticsService.getFullAnalytics(userId, startDate, endDate);
    }

    /**
     * GET /api/focus-suite/analytics/quadrant-time
     * Get time tracked per Matrix quadrant
     */
    @Get('analytics/quadrant-time')
    async getTimeByQuadrant(
        @Req() req: Request,
        @Query('start') start: string,
        @Query('end') end: string,
    ) {
        const userId = this.getUserIdFromRequest(req);
        const startDate = new Date(start);
        const endDate = new Date(end);
        return this.analyticsService.getTimeByQuadrant(userId, startDate, endDate);
    }

    /**
     * GET /api/focus-suite/analytics/life-area-time
     * Get time tracked per Life Area
     */
    @Get('analytics/life-area-time')
    async getTimeByLifeArea(
        @Req() req: Request,
        @Query('start') start: string,
        @Query('end') end: string,
    ) {
        const userId = this.getUserIdFromRequest(req);
        const startDate = new Date(start);
        const endDate = new Date(end);
        return this.analyticsService.getTimeByLifeArea(userId, startDate, endDate);
    }

    /**
     * GET /api/focus-suite/analytics/weekly-decisions
     * Get weekly decision summary
     */
    @Get('analytics/weekly-decisions')
    async getWeeklyDecisions(
        @Req() req: Request,
        @Query('weekStart') weekStart: string,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.analyticsService.getWeeklyDecisionSummary(userId, new Date(weekStart));
    }

    /**
     * GET /api/focus-suite/analytics/session-stats
     * Get focus session statistics
     */
    @Get('analytics/session-stats')
    async getSessionStats(
        @Req() req: Request,
        @Query('start') start: string,
        @Query('end') end: string,
    ) {
        const userId = this.getUserIdFromRequest(req);
        const startDate = new Date(start);
        const endDate = new Date(end);
        return this.analyticsService.getFocusSessionStats(userId, startDate, endDate);
    }

    // ==========================================
    // Matrix Integration Endpoints
    // ==========================================

    /**
     * POST /api/focus-suite/matrix/:taskId/focus-block
     * Create a focus block from a Matrix task
     */
    @Post('matrix/:taskId/focus-block')
    @HttpCode(HttpStatus.CREATED)
    async createFocusBlockFromTask(
        @Req() req: Request,
        @Param('taskId') taskId: string,
        @Body() input: CreateFocusBlockFromMatrixInput,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.matrixService.createFocusBlockFromTask(userId, taskId, input);
    }

    /**
     * POST /api/focus-suite/matrix/:taskId/decisions/:decisionId
     * Attach a decision to a Matrix task
     */
    @Post('matrix/:taskId/decisions/:decisionId')
    @HttpCode(HttpStatus.OK)
    async attachDecisionToTask(
        @Req() req: Request,
        @Param('taskId') taskId: string,
        @Param('decisionId') decisionId: string,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.matrixService.attachDecisionToTask(userId, taskId, decisionId);
    }

    /**
     * GET /api/focus-suite/matrix/:taskId/sessions
     * Get focus sessions for a Matrix task
     */
    @Get('matrix/:taskId/sessions')
    async getSessionsForTask(
        @Req() req: Request,
        @Param('taskId') taskId: string,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.matrixService.getSessionsForTask(userId, taskId);
    }

    /**
     * GET /api/focus-suite/matrix/:taskId/decisions
     * Get decisions linked to a Matrix task
     */
    @Get('matrix/:taskId/decisions')
    async getDecisionsForTask(
        @Req() req: Request,
        @Param('taskId') taskId: string,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.matrixService.getDecisionsForTask(userId, taskId);
    }

    /**
     * PATCH /api/focus-suite/matrix/:taskId/unschedule
     * Unschedule a focus block from a Matrix task
     */
    @Patch('matrix/:taskId/unschedule')
    async unscheduleFocusBlock(
        @Req() req: Request,
        @Param('taskId') taskId: string,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.matrixService.unscheduleFocusBlock(userId, taskId);
    }
}
