import { Controller, Post, Put, Patch, Delete, Param, Body, Req, UnauthorizedException } from '@nestjs/common';
import { PrioritiesService } from './priorities.service';
import { Request } from 'express';

@Controller('api')
export class PrioritiesController {
    constructor(private readonly prioritiesService: PrioritiesService) { }

    private getUserIdFromRequest(req: Request): string {
        const userId = (req as any).userId;
        if (!userId) {
            throw new UnauthorizedException('Not authenticated');
        }
        return userId;
    }

    @Post('days/:date/priorities')
    async createPriority(
        @Param('date') date: string,
        @Body() body: { title: string; lifeAreaId?: string },
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.prioritiesService.createPriority(userId, date, body.title, body.lifeAreaId);
    }

    @Put('priorities/:id')
    async updatePriority(
        @Param('id') id: string,
        @Body() body: { title?: string; completed?: boolean },
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.prioritiesService.updatePriority(id, userId, body);
    }

    @Patch('priorities/:id/complete')
    async togglePriority(@Param('id') id: string, @Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.prioritiesService.togglePriority(id, userId);
    }

    @Delete('priorities/:id')
    async deletePriority(@Param('id') id: string, @Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.prioritiesService.deletePriority(id, userId);
    }
}
