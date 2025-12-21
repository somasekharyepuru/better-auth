import { Controller, Post, Put, Delete, Param, Body, Req, UnauthorizedException } from '@nestjs/common';
import { TimeBlocksService } from './time-blocks.service';
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

    @Post('days/:date/time-blocks')
    async createTimeBlock(
        @Param('date') date: string,
        @Body() body: { title: string; startTime: string; endTime: string; type?: string },
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.timeBlocksService.createTimeBlock(userId, date, body);
    }

    @Put('time-blocks/:id')
    async updateTimeBlock(
        @Param('id') id: string,
        @Body() body: { title?: string; startTime?: string; endTime?: string; type?: string },
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.timeBlocksService.updateTimeBlock(id, userId, body);
    }

    @Delete('time-blocks/:id')
    async deleteTimeBlock(@Param('id') id: string, @Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.timeBlocksService.deleteTimeBlock(id, userId);
    }
}
