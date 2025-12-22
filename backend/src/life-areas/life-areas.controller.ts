import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Req,
    UnauthorizedException,
} from '@nestjs/common';
import { LifeAreasService, CreateLifeAreaDto, UpdateLifeAreaDto } from './life-areas.service';
import { Request } from 'express';

@Controller('api/life-areas')
export class LifeAreasController {
    constructor(private lifeAreasService: LifeAreasService) { }

    /**
     * Get user ID from request (set by auth middleware)
     */
    private getUserIdFromRequest(req: Request): string {
        const userId = (req as any).userId;
        if (!userId) {
            throw new UnauthorizedException('Not authenticated');
        }
        return userId;
    }

    @Get()
    async getLifeAreas(@Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.lifeAreasService.getLifeAreas(userId);
    }

    @Get('default')
    async getDefaultLifeArea(@Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.lifeAreasService.getDefaultLifeArea(userId);
    }

    @Get(':id')
    async getLifeArea(
        @Param('id') id: string,
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.lifeAreasService.getLifeArea(id, userId);
    }

    @Post()
    async createLifeArea(
        @Body() data: CreateLifeAreaDto,
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.lifeAreasService.createLifeArea(userId, data);
    }

    @Patch(':id')
    async updateLifeArea(
        @Param('id') id: string,
        @Body() data: UpdateLifeAreaDto,
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.lifeAreasService.updateLifeArea(id, userId, data);
    }

    @Delete(':id')
    async archiveLifeArea(
        @Param('id') id: string,
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.lifeAreasService.archiveLifeArea(id, userId);
    }

    @Post(':id/restore')
    async restoreLifeArea(
        @Param('id') id: string,
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.lifeAreasService.restoreLifeArea(id, userId);
    }

    @Post('reorder')
    async reorderLifeAreas(
        @Body() body: { orderedIds: string[] },
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.lifeAreasService.reorderLifeAreas(userId, body.orderedIds);
    }
}
