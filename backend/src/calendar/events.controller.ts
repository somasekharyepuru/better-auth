import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Query,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import {
    CalendarEventsService,
    CalendarEventResponse,
    CreateCalendarEventInput,
    UpdateCalendarEventInput,
    WritableCalendarSource,
    BusyTimeSlot,
    ConflictCheckResult,
} from './services/events.service';

interface AuthenticatedRequest extends Request {
    user?: { id: string };
}

@Controller('api/calendar')
export class CalendarEventsController {
    constructor(private readonly eventsService: CalendarEventsService) { }

    /**
     * Get aggregated events from all connected calendars
     * Query params:
     *   - start: ISO date string for range start
     *   - end: ISO date string for range end
     *   - sourceIds: comma-separated list of calendar source IDs to filter
     */
    @Get('events')
    async getEvents(
        @Query('start') start: string,
        @Query('end') end: string,
        @Query('sourceIds') sourceIds: string,
        @Req() req: AuthenticatedRequest,
    ): Promise<CalendarEventResponse[]> {
        const userId = req.user?.id;
        if (!userId) throw new Error('Unauthorized');

        const startDate = new Date(start);
        const endDate = new Date(end);

        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Invalid date format. Use ISO date strings.');
        }

        const sourceIdArray = sourceIds
            ? sourceIds.split(',').filter((id) => id.trim())
            : undefined;

        return this.eventsService.getEvents(userId, startDate, endDate, sourceIdArray);
    }

    /**
     * Get a single event by ID
     */
    @Get('events/:id')
    async getEvent(
        @Param('id') id: string,
        @Req() req: AuthenticatedRequest,
    ): Promise<CalendarEventResponse> {
        const userId = req.user?.id;
        if (!userId) throw new Error('Unauthorized');

        return this.eventsService.getEvent(userId, id);
    }

    /**
     * Get writable calendar sources for event creation dropdown
     */
    @Get('writable-sources')
    async getWritableSources(
        @Req() req: AuthenticatedRequest,
    ): Promise<WritableCalendarSource[]> {
        const userId = req.user?.id;
        if (!userId) throw new Error('Unauthorized');

        return this.eventsService.getWritableSources(userId);
    }

    /**
     * Create a new event and sync to the selected calendar
     */
    @Post('events')
    async createEvent(
        @Body() body: CreateCalendarEventInput,
        @Req() req: AuthenticatedRequest,
    ): Promise<CalendarEventResponse> {
        const userId = req.user?.id;
        if (!userId) throw new Error('Unauthorized');

        // Validate required fields
        if (!body.sourceId) {
            throw new Error('sourceId is required');
        }
        if (!body.title || !body.title.trim()) {
            throw new Error('title is required');
        }
        if (!body.startTime || !body.endTime) {
            throw new Error('startTime and endTime are required');
        }

        return this.eventsService.createEvent(userId, {
            ...body,
            title: body.title.trim(),
        });
    }

    /**
     * Update an existing event
     */
    @Put('events/:id')
    async updateEvent(
        @Param('id') id: string,
        @Body() body: UpdateCalendarEventInput,
        @Req() req: AuthenticatedRequest,
    ): Promise<CalendarEventResponse> {
        const userId = req.user?.id;
        if (!userId) throw new Error('Unauthorized');

        return this.eventsService.updateEvent(userId, id, body);
    }

    /**
     * Delete an event and sync the deletion to the calendar
     */
    @Delete('events/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteEvent(
        @Param('id') id: string,
        @Req() req: AuthenticatedRequest,
    ): Promise<void> {
        const userId = req.user?.id;
        if (!userId) throw new Error('Unauthorized');

        await this.eventsService.deleteEvent(userId, id);
    }

    /**
     * Get busy time slots from ALL connected calendars
     * Used for cross-calendar blocking visualization
     */
    @Get('busy-times')
    async getBusyTimes(
        @Query('start') start: string,
        @Query('end') end: string,
        @Req() req: AuthenticatedRequest,
    ): Promise<BusyTimeSlot[]> {
        const userId = req.user?.id;
        if (!userId) throw new Error('Unauthorized');

        const startDate = new Date(start);
        const endDate = new Date(end);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Invalid date format. Use ISO date strings.');
        }

        return this.eventsService.getBusyTimes(userId, startDate, endDate);
    }

    /**
     * Check if a proposed time range conflicts with existing events
     * Returns all conflicting events from any calendar source
     */
    @Post('check-conflicts')
    async checkConflicts(
        @Body() body: { startTime: string; endTime: string; excludeEventId?: string },
        @Req() req: AuthenticatedRequest,
    ): Promise<ConflictCheckResult> {
        const userId = req.user?.id;
        if (!userId) throw new Error('Unauthorized');

        const startTime = new Date(body.startTime);
        const endTime = new Date(body.endTime);

        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            throw new Error('Invalid date format. Use ISO date strings.');
        }

        return this.eventsService.checkConflicts(userId, startTime, endTime, body.excludeEventId);
    }
}
