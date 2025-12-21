import { Controller, Post, Put, Delete, Param, Body, Req, UnauthorizedException } from '@nestjs/common';
import { DiscussionItemsService } from './discussion-items.service';
import { Request } from 'express';

@Controller('api')
export class DiscussionItemsController {
    constructor(private readonly discussionItemsService: DiscussionItemsService) { }

    private getUserIdFromRequest(req: Request): string {
        const userId = (req as any).userId;
        if (!userId) {
            throw new UnauthorizedException('Not authenticated');
        }
        return userId;
    }

    @Post('days/:date/discussion-items')
    async createItem(
        @Param('date') date: string,
        @Body() body: { content: string },
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.discussionItemsService.createItem(userId, date, body.content);
    }

    @Put('discussion-items/:id')
    async updateItem(
        @Param('id') id: string,
        @Body() body: { content: string },
        @Req() req: Request,
    ) {
        const userId = this.getUserIdFromRequest(req);
        return this.discussionItemsService.updateItem(id, userId, body.content);
    }

    @Delete('discussion-items/:id')
    async deleteItem(@Param('id') id: string, @Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.discussionItemsService.deleteItem(id, userId);
    }
}
