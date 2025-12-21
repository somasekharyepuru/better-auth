import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UnauthorizedException } from '@nestjs/common';
import { DecisionLogService, CreateDecisionDto, UpdateDecisionDto } from './decision-log.service';
import { Request } from 'express';

@Controller('api/decisions')
export class DecisionLogController {
    constructor(private readonly decisionLogService: DecisionLogService) { }

    private getUserIdFromRequest(req: Request): string {
        const userId = (req as any).userId;
        if (!userId) {
            throw new UnauthorizedException('Not authenticated');
        }
        return userId;
    }

    @Get()
    async getAllDecisions(@Query('search') search: string, @Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.decisionLogService.getAllDecisions(userId, search);
    }

    @Get(':id')
    async getDecision(@Param('id') id: string, @Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.decisionLogService.getDecision(id, userId);
    }

    @Post()
    async createDecision(@Body() body: CreateDecisionDto, @Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.decisionLogService.createDecision(userId, body);
    }

    @Put(':id')
    async updateDecision(@Param('id') id: string, @Body() body: UpdateDecisionDto, @Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.decisionLogService.updateDecision(id, userId, body);
    }

    @Delete(':id')
    async deleteDecision(@Param('id') id: string, @Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.decisionLogService.deleteDecision(id, userId);
    }
}
