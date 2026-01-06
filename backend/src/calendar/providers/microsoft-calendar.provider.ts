import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@microsoft/microsoft-graph-client';
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
export class MicrosoftCalendarProvider implements ICalendarProvider {
  private readonly logger = new Logger(MicrosoftCalendarProvider.name);
  readonly providerType = CalendarProvider.MICROSOFT;
  readonly supportsWebhooks = true;

  private readonly SCOPES = ['offline_access', 'User.Read', 'Calendars.ReadWrite'];

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CALENDAR_CLIENT_ID!,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: this.SCOPES.join(' '),
      state,
      response_mode: 'query',
      prompt: 'consent',
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens> {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CALENDAR_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CALENDAR_CLIENT_SECRET!,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Microsoft OAuth error: ${data.error_description}`);
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      scopes: data.scope.split(' '),
      tokenType: data.token_type,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CALENDAR_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CALENDAR_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Microsoft token refresh error: ${data.error_description}`);
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      scopes: data.scope.split(' '),
      tokenType: data.token_type,
    };
  }

  async revokeAccess(): Promise<void> {
    this.logger.warn('Microsoft does not support programmatic token revocation');
  }

  async listCalendars(accessToken: string): Promise<ExternalCalendar[]> {
    const client = this.getGraphClient(accessToken);
    const response = await client.api('/me/calendars').get();

    return response.value.map((cal: Record<string, unknown>) => ({
      id: cal.id as string,
      name: cal.name as string,
      description: undefined,
      color: cal.hexColor as string | undefined,
      timeZone: undefined,
      isPrimary: (cal.isDefaultCalendar as boolean) || false,
      accessRole: (cal.canEdit as boolean) ? 'writer' : 'reader',
    }));
  }

  async getCalendar(accessToken: string, calendarId: string): Promise<ExternalCalendar> {
    const client = this.getGraphClient(accessToken);
    const cal = await client.api(`/me/calendars/${calendarId}`).get();

    return {
      id: cal.id,
      name: cal.name,
      description: undefined,
      color: cal.hexColor,
      timeZone: undefined,
      isPrimary: cal.isDefaultCalendar || false,
      accessRole: cal.canEdit ? 'writer' : 'reader',
    };
  }

  async getEvents(
    accessToken: string,
    calendarId: string,
    timeRange: TimeRange,
    options?: GetEventsOptions,
  ): Promise<EventsResult> {
    const client = this.getGraphClient(accessToken);

    let url: string;

    if (options?.syncToken) {
      url = options.syncToken;
    } else if (options?.pageToken) {
      url = options.pageToken;
    } else {
      const params = new URLSearchParams({
        startDateTime: timeRange.start.toISOString(),
        endDateTime: timeRange.end.toISOString(),
        $top: String(options?.maxResults || 250),
        $orderby: 'start/dateTime',
      });
      url = `/me/calendars/${calendarId}/calendarView?${params}`;
    }

    try {
      const response = await client.api(url).get();

      return {
        events: response.value.map((e: Record<string, unknown>) => this.mapEvent(e)),
        nextSyncToken: response['@odata.deltaLink'],
        nextPageToken: response['@odata.nextLink'],
        hasMore: !!response['@odata.nextLink'],
      };
    } catch (error: unknown) {
      const err = error as { statusCode?: number };
      if (err.statusCode === 410) {
        this.logger.warn(`Delta token expired for calendar ${calendarId}, performing full sync`);
        return this.getEvents(accessToken, calendarId, timeRange, {
          ...options,
          syncToken: undefined,
        });
      }
      throw error;
    }
  }

  async getEvent(accessToken: string, calendarId: string, eventId: string): Promise<ExternalEvent> {
    const client = this.getGraphClient(accessToken);
    const event = await client.api(`/me/calendars/${calendarId}/events/${eventId}`).get();
    return this.mapEvent(event);
  }

  async createEvent(accessToken: string, calendarId: string, event: CreateEventInput): Promise<ExternalEvent> {
    const client = this.getGraphClient(accessToken);

    const response = await client.api(`/me/calendars/${calendarId}/events`).post({
      subject: event.title,
      body: event.description ? { contentType: 'text', content: event.description } : undefined,
      location: event.location ? { displayName: event.location } : undefined,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: event.timeZone || 'UTC',
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: event.timeZone || 'UTC',
      },
      isAllDay: event.isAllDay,
    });

    return this.mapEvent(response);
  }

  async updateEvent(accessToken: string, calendarId: string, event: UpdateEventInput): Promise<ExternalEvent> {
    const client = this.getGraphClient(accessToken);

    const updates: Record<string, unknown> = {};
    if (event.title !== undefined) updates.subject = event.title;
    if (event.description !== undefined) updates.body = { contentType: 'text', content: event.description };
    if (event.location !== undefined) updates.location = { displayName: event.location };
    if (event.startTime !== undefined) {
      updates.start = {
        dateTime: event.startTime.toISOString(),
        timeZone: event.timeZone || 'UTC',
      };
    }
    if (event.endTime !== undefined) {
      updates.end = {
        dateTime: event.endTime.toISOString(),
        timeZone: event.timeZone || 'UTC',
      };
    }
    if (event.isAllDay !== undefined) updates.isAllDay = event.isAllDay;

    const response = await client.api(`/me/calendars/${calendarId}/events/${event.id}`).patch(updates);
    return this.mapEvent(response);
  }

  async deleteEvent(accessToken: string, calendarId: string, eventId: string): Promise<void> {
    const client = this.getGraphClient(accessToken);
    await client.api(`/me/calendars/${calendarId}/events/${eventId}`).delete();
  }

  async setupWebhook(
    accessToken: string,
    calendarId: string,
    callbackUrl: string,
    channelToken: string,
  ): Promise<WebhookChannel> {
    const client = this.getGraphClient(accessToken);
    const expiration = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const response = await client.api('/subscriptions').post({
      changeType: 'created,updated,deleted',
      notificationUrl: callbackUrl,
      resource: `/me/calendars/${calendarId}/events`,
      expirationDateTime: expiration.toISOString(),
      clientState: channelToken,
    });

    return {
      channelId: response.id,
      resourceId: response.resource,
      expiration: new Date(response.expirationDateTime),
      token: channelToken,
    };
  }

  async renewWebhook(accessToken: string, channelId: string): Promise<WebhookChannel> {
    const client = this.getGraphClient(accessToken);
    const expiration = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const response = await client.api(`/subscriptions/${channelId}`).patch({
      expirationDateTime: expiration.toISOString(),
    });

    return {
      channelId: response.id,
      resourceId: response.resource,
      expiration: new Date(response.expirationDateTime),
    };
  }

  async stopWebhook(accessToken: string, channelId: string): Promise<void> {
    const client = this.getGraphClient(accessToken);
    await client.api(`/subscriptions/${channelId}`).delete();
  }

  private getGraphClient(accessToken: string): Client {
    return Client.init({
      authProvider: (done) => done(null, accessToken),
    });
  }

  private mapEvent(event: Record<string, unknown>): ExternalEvent {
    const start = event.start as { dateTime: string; timeZone: string };
    const end = event.end as { dateTime: string; timeZone: string };
    const body = event.body as { content: string } | undefined;
    const location = event.location as { displayName: string } | undefined;
    const attendees = event.attendees as Array<{
      emailAddress: { address: string; name: string };
      status: { response: string };
    }> | undefined;

    return {
      id: event.id as string,
      etag: event['@odata.etag'] as string | undefined,
      title: (event.subject as string) || 'Untitled Event',
      description: body?.content,
      location: location?.displayName,
      startTime: new Date(start.dateTime),
      endTime: new Date(end.dateTime),
      isAllDay: event.isAllDay as boolean,
      timeZone: start.timeZone,
      status: (event.isCancelled as boolean) ? 'cancelled' : 'confirmed',
      visibility: (event.sensitivity as string) === 'private' ? 'private' : 'public',
      attendees: attendees?.map((a) => ({
        email: a.emailAddress.address,
        name: a.emailAddress.name,
        responseStatus: a.status?.response,
      })),
      updatedAt: new Date(event.lastModifiedDateTime as string),
      createdAt: new Date(event.createdDateTime as string),
      htmlLink: event.webLink as string | undefined,
    };
  }
}
