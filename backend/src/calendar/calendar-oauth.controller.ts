import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { CalendarConnectionService } from './services/calendar-connection.service';

@Controller('api/calendar/oauth')
export class CalendarOAuthController {
  private readonly logger = new Logger(CalendarOAuthController.name);

  constructor(private readonly connectionService: CalendarConnectionService) {}

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (error) {
      this.logger.error(`Google OAuth error: ${error}`);
      return res.redirect(`${frontendUrl}/settings/calendars?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/settings/calendars?error=missing_params`);
    }

    try {
      const redirectUri = `${process.env.BETTER_AUTH_URL || 'http://localhost:3002'}/api/calendar/oauth/google/callback`;
      const { connectionId } = await this.connectionService.completeConnection(state, code, redirectUri);

      this.logger.log(`Google calendar connection completed: ${connectionId}`);
      return res.redirect(`${frontendUrl}/settings/calendars?success=true&provider=google`);
    } catch (err) {
      this.logger.error('Failed to complete Google connection:', err);
      return res.redirect(`${frontendUrl}/settings/calendars?error=connection_failed`);
    }
  }

  @Get('microsoft/callback')
  async microsoftCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (error) {
      this.logger.error(`Microsoft OAuth error: ${error} - ${errorDescription}`);
      return res.redirect(`${frontendUrl}/settings/calendars?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/settings/calendars?error=missing_params`);
    }

    try {
      const redirectUri = `${process.env.BETTER_AUTH_URL || 'http://localhost:3002'}/api/calendar/oauth/microsoft/callback`;
      const { connectionId } = await this.connectionService.completeConnection(state, code, redirectUri);

      this.logger.log(`Microsoft calendar connection completed: ${connectionId}`);
      return res.redirect(`${frontendUrl}/settings/calendars?success=true&provider=microsoft`);
    } catch (err) {
      this.logger.error('Failed to complete Microsoft connection:', err);
      return res.redirect(`${frontendUrl}/settings/calendars?error=connection_failed`);
    }
  }

  @Get('apple/callback')
  async appleCallback(@Query('state') state: string, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(
      `${frontendUrl}/settings/calendars/apple-setup?state=${state}`,
    );
  }
}
