import { Controller, Get, Post, Put, Delete, Body, Param, Req, UnauthorizedException } from '@nestjs/common';
import { EisenhowerService, CreateEisenhowerTaskDto, UpdateEisenhowerTaskDto } from './eisenhower.service';
import { Request } from 'express';

@Controller('api/eisenhower')
export class EisenhowerController {
    constructor(private readonly eisenhowerService: EisenhowerService) { }

    private getUserIdFromRequest(req: Request): string {
        const userId = (req as any).userId;
        if (!userId) {
            throw new UnauthorizedException('Not authenticated');
        }
        return userId;
    }

    @Get()
    async getAllTasks(@Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.eisenhowerService.getAllTasks(userId);
    }

    @Post()
    async createTask(@Body() body: CreateEisenhowerTaskDto, @Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.eisenhowerService.createTask(userId, body);
    }

    @Put(':id')
    async updateTask(@Param('id') id: string, @Body() body: UpdateEisenhowerTaskDto, @Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.eisenhowerService.updateTask(id, userId, body);
    }

    @Delete(':id')
    async deleteTask(@Param('id') id: string, @Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.eisenhowerService.deleteTask(id, userId);
    }

    @Post(':id/promote')
    async promoteToDaily(@Param('id') id: string, @Body() body: { date: string }, @Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.eisenhowerService.promoteToDaily(id, userId, body.date);
    }
}
