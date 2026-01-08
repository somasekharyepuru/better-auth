import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Query,
    Req,
    UnauthorizedException,
} from '@nestjs/common';
import {
    FocusSessionService,
    StartSessionInput,
    EndSessionInput,
} from './focus-session.service';
import { Request } from 'express';

@Controller('api/focus-sessions')
export class FocusSessionController {
    constructor(private readonly focusSessionService: FocusSessionService) { }

    private getUserIdFromRequest(req: Request): string {
        const userId = (req as any).userId;
        if (!userId) {
            throw new UnauthorizedException('Not authenticated');
        }
        return userId;
    }

    /**
     * Get the currently active session (if any)
     */
    @Get('active')
    async getActiveSession(@Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.focusSessionService.getActiveSession(userId);
    }

    /**
     * Get today's sessions
     */
    @Get('today')
    async getTodaySessions(@Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.focusSessionService.getTodaySessions(userId);
    }

    /**
     * Get session statistics for a date range
     */
    @Get('stats')
    async getSessionStats(
        @Query('start') start: string,
        @Query('end') end: string,
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        const startDate = new Date(start);
        const endDate = new Date(end);
        return this.focusSessionService.getSessionStats(userId, startDate, endDate);
    }

    /**
     * Get sessions for a specific time block
     */
    @Get('time-block/:timeBlockId')
    async getSessionsForTimeBlock(
        @Param('timeBlockId') timeBlockId: string,
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.focusSessionService.getSessionsForTimeBlock(userId, timeBlockId);
    }

    /**
     * Start a new focus session
     */
    @Post('start')
    async startSession(
        @Body() body: StartSessionInput,
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.focusSessionService.startSession(userId, body);
    }

    /**
     * End an active session
     */
    @Post(':id/end')
    async endSession(
        @Param('id') id: string,
        @Body() body: EndSessionInput,
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.focusSessionService.endSession(userId, id, body);
    }

    /**
     * Start a focus session from a priority (creates Quick Focus time block)
     */
    @Post('priority/:priorityId/start')
    async startFromPriority(
        @Param('priorityId') priorityId: string,
        @Body() body: { durationMins?: number; sessionType?: string },
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.focusSessionService.startFromPriority(userId, {
            priorityId,
            durationMins: body.durationMins,
            sessionType: body.sessionType,
        });
    }

    /**
     * Start a standalone pomodoro session (not linked to any priority)
     */
    @Post('standalone/start')
    async startStandalone(
        @Body() body: { durationMins?: number; sessionType?: string },
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.focusSessionService.startStandalone(userId, {
            durationMins: body.durationMins,
            sessionType: body.sessionType,
        });
    }
}
