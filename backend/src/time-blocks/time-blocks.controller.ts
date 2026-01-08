import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Patch,
    Param,
    Body,
    Query,
    Req,
    UnauthorizedException,
} from '@nestjs/common';
import {
    TimeBlocksService,
    CreateTimeBlockInput,
    UpdateTimeBlockInput,
    TimeBlockCategory,
    TIME_BLOCK_CATEGORIES,
} from './time-blocks.service';
import { Request } from 'express';

@Controller('api')
export class TimeBlocksController {
    constructor(private readonly timeBlocksService: TimeBlocksService) { }

    private getUserIdFromRequest(req: Request): string {
        const userId = (req as any).userId;
        if (!userId) {
            throw new UnauthorizedException('Not authenticated');
        }
        return userId;
    }

    /**
     * Get time blocks for a specific date
     */
    @Get('days/:date/time-blocks')
    async getTimeBlocksForDate(
        @Param('date') date: string,
        @Query('lifeAreaId') lifeAreaId: string,
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.timeBlocksService.getTimeBlocksForDate(userId, date, lifeAreaId);
    }

    /**
     * Get time blocks for a date range (for calendar views)
     */
    @Get('time-blocks/range')
    async getTimeBlocksForRange(
        @Query('start') start: string,
        @Query('end') end: string,
        @Query('lifeAreaId') lifeAreaId: string,
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        const startDate = new Date(start);
        const endDate = new Date(end);
        return this.timeBlocksService.getTimeBlocksForRange(userId, startDate, endDate, lifeAreaId);
    }

    /**
     * Get focus blocks for a date range
     */
    @Get('time-blocks/focus')
    async getFocusBlocks(
        @Query('start') start: string,
        @Query('end') end: string,
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        const startDate = new Date(start);
        const endDate = new Date(end);
        return this.timeBlocksService.getFocusBlocks(userId, startDate, endDate);
    }

    /**
     * Get time blocks by category
     */
    @Get('time-blocks/category/:category')
    async getTimeBlocksByCategory(
        @Param('category') category: TimeBlockCategory,
        @Query('start') start: string,
        @Query('end') end: string,
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        const startDate = new Date(start);
        const endDate = new Date(end);
        return this.timeBlocksService.getTimeBlocksByCategory(userId, category, startDate, endDate);
    }

    /**
     * Get time block statistics
     */
    @Get('time-blocks/stats')
    async getTimeBlockStats(
        @Query('start') start: string,
        @Query('end') end: string,
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        const startDate = new Date(start);
        const endDate = new Date(end);
        return this.timeBlocksService.getTimeBlockStats(userId, startDate, endDate);
    }

    /**
     * Get available categories
     */
    @Get('time-blocks/categories')
    getCategories() {
        return {
            categories: TIME_BLOCK_CATEGORIES,
            descriptions: {
                focus: 'Focused work time - blocks external calendar as busy',
                meeting: 'Meetings and calls',
                break: 'Short breaks',
                'deep-work': 'Extended focus time for complex tasks',
                personal: 'Personal time and errands',
            },
        };
    }

    /**
     * Check for conflicts with a proposed time range
     */
    @Post('time-blocks/check-conflicts')
    async checkConflicts(
        @Body() body: { startTime: string; endTime: string; excludeBlockId?: string },
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        const startTime = new Date(body.startTime);
        const endTime = new Date(body.endTime);
        return this.timeBlocksService.checkConflicts(userId, startTime, endTime, body.excludeBlockId);
    }

    /**
     * Create a new time block
     */
    @Post('days/:date/time-blocks')
    async createTimeBlock(
        @Param('date') date: string,
        @Body() body: CreateTimeBlockInput & { lifeAreaId?: string },
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        const { lifeAreaId, ...data } = body;
        return this.timeBlocksService.createTimeBlock(userId, date, data, lifeAreaId);
    }

    /**
     * Update a time block
     */
    @Put('time-blocks/:id')
    async updateTimeBlock(
        @Param('id') id: string,
        @Body() body: UpdateTimeBlockInput,
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.timeBlocksService.updateTimeBlock(id, userId, body);
    }

    /**
     * Delete a time block
     */
    @Delete('time-blocks/:id')
    async deleteTimeBlock(@Param('id') id: string, @Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.timeBlocksService.deleteTimeBlock(id, userId);
    }

    /**
     * Link a time block to a priority
     */
    @Patch('time-blocks/:id/link-priority')
    async linkToPriority(
        @Param('id') id: string,
        @Body() body: { priorityId: string },
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.timeBlocksService.linkToPriority(id, userId, body.priorityId);
    }

    /**
     * Unlink a time block from its priority
     */
    @Patch('time-blocks/:id/unlink-priority')
    async unlinkFromPriority(
        @Param('id') id: string,
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.timeBlocksService.unlinkFromPriority(id, userId);
    }
}
