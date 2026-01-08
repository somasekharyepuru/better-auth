import { Injectable, Logger } from '@nestjs/common';
import { google, calendar_v3 } from 'googleapis';
import { CalendarProvider } from '@prisma/client';
import { ICalendarProvider } from './calendar-provider.interface';
import {
  OAuthTokens,
  ExternalCalendar,
  ExternalEvent,
  EventsResult,
  TimeRange,
  CreateEventInput,
  UpdateEventInput,
  WebhookChannel,
  GetEventsOptions,
} from '../types/calendar.types';

@Injectable()
export class GoogleCalendarProvider implements ICalendarProvider {
  private readonly logger = new Logger(GoogleCalendarProvider.name);
  readonly providerType = CalendarProvider.GOOGLE;
  readonly supportsWebhooks = true;

  private readonly SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      redirectUri,
    );

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
      state,
      prompt: 'consent',
      include_granted_scopes: true,
    });
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      redirectUri,
    );

    const { tokens } = await oauth2Client.getToken(code);

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token ?? undefined,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      scopes: tokens.scope?.split(' ') || this.SCOPES,
      tokenType: tokens.token_type || 'Bearer',
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();

    return {
      accessToken: credentials.access_token!,
      refreshToken: credentials.refresh_token || refreshToken,
      expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
      scopes: credentials.scope?.split(' ') || this.SCOPES,
      tokenType: credentials.token_type || 'Bearer',
    };
  }

  async revokeAccess(accessToken: string): Promise<void> {
    const oauth2Client = new google.auth.OAuth2();
    await oauth2Client.revokeToken(accessToken);
  }

  async listCalendars(accessToken: string): Promise<ExternalCalendar[]> {
    const calendar = this.getCalendarClient(accessToken);
    const response = await calendar.calendarList.list();

    return (response.data.items || []).map((cal) => ({
      id: cal.id!,
      name: cal.summary || 'Unnamed Calendar',
      description: cal.description ?? undefined,
      color: cal.backgroundColor ?? undefined,
      timeZone: cal.timeZone ?? undefined,
      isPrimary: cal.primary || false,
      accessRole: this.mapAccessRole(cal.accessRole),
    }));
  }

  async getCalendar(accessToken: string, calendarId: string): Promise<ExternalCalendar> {
    const calendar = this.getCalendarClient(accessToken);
    const response = await calendar.calendarList.get({ calendarId });

    return {
      id: response.data.id!,
      name: response.data.summary || 'Unnamed Calendar',
      description: response.data.description ?? undefined,
      color: response.data.backgroundColor ?? undefined,
      timeZone: response.data.timeZone ?? undefined,
      isPrimary: response.data.primary || false,
      accessRole: this.mapAccessRole(response.data.accessRole),
    };
  }

  async getEvents(
    accessToken: string,
    calendarId: string,
    timeRange: TimeRange,
    options?: GetEventsOptions,
  ): Promise<EventsResult> {
    const calendar = this.getCalendarClient(accessToken);

    const params: calendar_v3.Params$Resource$Events$List = {
      calendarId,
      maxResults: options?.maxResults || 250,
      singleEvents: true,
      orderBy: 'startTime',
      showDeleted: true, // Required to receive deleted/cancelled events
    };

    if (options?.syncToken) {
      params.syncToken = options.syncToken;
    } else {
      params.timeMin = timeRange.start.toISOString();
      params.timeMax = timeRange.end.toISOString();
    }

    if (options?.pageToken) {
      params.pageToken = options.pageToken;
    }

    try {
      const response = await calendar.events.list(params);

      return {
        events: (response.data.items || []).map((e) => this.mapEvent(e)),
        nextSyncToken: response.data.nextSyncToken ?? undefined,
        nextPageToken: response.data.nextPageToken ?? undefined,
        hasMore: !!response.data.nextPageToken,
      };
    } catch (error: unknown) {
      const err = error as { code?: number };
      if (err.code === 410) {
        this.logger.warn(`Sync token expired for calendar ${calendarId}, performing full sync`);
        return this.getEvents(accessToken, calendarId, timeRange, {
          ...options,
          syncToken: undefined,
        });
      }
      throw error;
    }
  }

  async getEvent(accessToken: string, calendarId: string, eventId: string): Promise<ExternalEvent> {
    const calendar = this.getCalendarClient(accessToken);
    const response = await calendar.events.get({ calendarId, eventId });
    return this.mapEvent(response.data);
  }

  async createEvent(accessToken: string, calendarId: string, event: CreateEventInput): Promise<ExternalEvent> {
    const calendar = this.getCalendarClient(accessToken);

    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: event.isAllDay
          ? { date: event.startTime.toISOString().split('T')[0] }
          : { dateTime: event.startTime.toISOString(), timeZone: event.timeZone },
        end: event.isAllDay
          ? { date: event.endTime.toISOString().split('T')[0] }
          : { dateTime: event.endTime.toISOString(), timeZone: event.timeZone },
      },
    });

    return this.mapEvent(response.data);
  }

  async updateEvent(accessToken: string, calendarId: string, event: UpdateEventInput): Promise<ExternalEvent> {
    const calendar = this.getCalendarClient(accessToken);

    const requestBody: calendar_v3.Schema$Event = {};
    if (event.title !== undefined) requestBody.summary = event.title;
    if (event.description !== undefined) requestBody.description = event.description;
    if (event.location !== undefined) requestBody.location = event.location;
    if (event.startTime !== undefined) {
      requestBody.start = event.isAllDay
        ? { date: event.startTime.toISOString().split('T')[0] }
        : { dateTime: event.startTime.toISOString(), timeZone: event.timeZone };
    }
    if (event.endTime !== undefined) {
      requestBody.end = event.isAllDay
        ? { date: event.endTime.toISOString().split('T')[0] }
        : { dateTime: event.endTime.toISOString(), timeZone: event.timeZone };
    }

    const response = await calendar.events.patch({
      calendarId,
      eventId: event.id,
      requestBody,
    });

    return this.mapEvent(response.data);
  }

  async deleteEvent(accessToken: string, calendarId: string, eventId: string): Promise<void> {
    const calendar = this.getCalendarClient(accessToken);
    await calendar.events.delete({ calendarId, eventId });
  }

  async setupWebhook(
    accessToken: string,
    calendarId: string,
    callbackUrl: string,
    channelToken: string,
  ): Promise<WebhookChannel> {
    const calendar = this.getCalendarClient(accessToken);
    const channelId = `daymark-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const response = await calendar.events.watch({
      calendarId,
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: callbackUrl,
        token: channelToken,
        expiration: String(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      channelId: response.data.id!,
      resourceId: response.data.resourceId ?? undefined,
      expiration: new Date(parseInt(response.data.expiration!, 10)),
      token: channelToken,
    };
  }

  async stopWebhook(accessToken: string, channelId: string, resourceId?: string): Promise<void> {
    const calendar = this.getCalendarClient(accessToken);
    await calendar.channels.stop({
      requestBody: { id: channelId, resourceId },
    });
  }

  private getCalendarClient(accessToken: string): calendar_v3.Calendar {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.calendar({ version: 'v3', auth });
  }

  private mapEvent(event: calendar_v3.Schema$Event): ExternalEvent {
    const startTime = event.start?.dateTime || event.start?.date;
    const endTime = event.end?.dateTime || event.end?.date;

    return {
      id: event.id!,
      recurringEventId: event.recurringEventId ?? undefined,
      etag: event.etag ?? undefined,
      title: event.summary || 'Untitled Event',
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      startTime: new Date(startTime!),
      endTime: new Date(endTime!),
      isAllDay: !event.start?.dateTime,
      timeZone: event.start?.timeZone ?? undefined,
      status: (event.status as 'confirmed' | 'tentative' | 'cancelled') || 'confirmed',
      visibility: (event.visibility || 'public') as 'public' | 'private' | 'confidential',
      attendees: event.attendees?.map((a) => ({
        email: a.email!,
        name: a.displayName ?? undefined,
        responseStatus: a.responseStatus ?? undefined,
      })),
      recurrence: event.recurrence ?? undefined,
      updatedAt: new Date(event.updated!),
      createdAt: new Date(event.created!),
      htmlLink: event.htmlLink ?? undefined,
    };
  }

  private mapAccessRole(role?: string | null): 'owner' | 'writer' | 'reader' {
    switch (role) {
      case 'owner':
        return 'owner';
      case 'writer':
        return 'writer';
      default:
        return 'reader';
    }
  }
}
