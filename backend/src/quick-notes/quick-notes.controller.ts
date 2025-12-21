import { Controller, Put, Param, Body, Req, UnauthorizedException } from '@nestjs/common';
import { QuickNotesService } from './quick-notes.service';
import { Request } from 'express';

@Controller('api')
export class QuickNotesController {
    constructor(private readonly quickNotesService: QuickNotesService) { }

    private getUserIdFromRequest(req: Request): string {
        const userId = (req as any).userId;
        if (!userId) {
            throw new UnauthorizedException('Not authenticated');
        }
        return userId;
    }

    @Put('days/:date/quick-note')
    async upsertQuickNote(
        @Param('date') date: string,
        @Body() body: { content: string },
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.quickNotesService.upsertQuickNote(userId, date, body.content);
    }
}
