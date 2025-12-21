import { Controller, Get, Param, Req, UnauthorizedException } from '@nestjs/common';
import { DaysService } from './days.service';
import { Request } from 'express';

@Controller('api/days')
export class DaysController {
    constructor(private readonly daysService: DaysService) { }

    private getUserIdFromRequest(req: Request): string {
        // Better Auth stores session in cookies, parsed by middleware
        const userId = (req as any).userId;
        if (!userId) {
            throw new UnauthorizedException('Not authenticated');
        }
        return userId;
    }

    @Get(':date')
    async getDay(@Param('date') date: string, @Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.daysService.getOrCreateDay(userId, date);
    }

    @Get(':date/progress')
    async getDayProgress(@Param('date') date: string, @Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.daysService.getDayProgress(userId, date);
    }
}
