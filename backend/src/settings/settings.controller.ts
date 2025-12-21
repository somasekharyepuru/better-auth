import { Controller, Get, Put, Body, Req, UnauthorizedException } from '@nestjs/common';
import { SettingsService, UpdateSettingsDto } from './settings.service';
import { Request } from 'express';

@Controller('api/settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    private getUserIdFromRequest(req: Request): string {
        const userId = (req as any).userId;
        if (!userId) {
            throw new UnauthorizedException('Not authenticated');
        }
        return userId;
    }

    @Get()
    async getSettings(@Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.settingsService.getSettings(userId);
    }

    @Put()
    async updateSettings(@Body() body: UpdateSettingsDto, @Req() req: Request) {
        const userId = this.getUserIdFromRequest(req);
        return this.settingsService.updateSettings(userId, body);
    }
}
