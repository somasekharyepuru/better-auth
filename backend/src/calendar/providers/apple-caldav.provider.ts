import { Injectable, Logger } from '@nestjs/common';
import { DAVClient, DAVCalendar, DAVObject } from 'tsdav';
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
  GetEventsOptions,
} from '../types/calendar.types';

@Injectable()
export class AppleCalDAVProvider implements ICalendarProvider {
  private readonly logger = new Logger(AppleCalDAVProvider.name);
  readonly providerType = CalendarProvider.APPLE;
  readonly supportsWebhooks = false;

  getAuthorizationUrl(): string {
    throw new Error('Apple CalDAV uses app-specific passwords, not OAuth');
  }

  async exchangeCodeForTokens(): Promise<OAuthTokens> {
    throw new Error('Apple CalDAV uses app-specific passwords, not OAuth');
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    return {
      accessToken: refreshToken,
      refreshToken,
      scopes: ['calendar'],
      tokenType: 'Basic',
    };
  }

  async revokeAccess(): Promise<void> {
    this.logger.warn('Apple app-specific passwords must be revoked at appleid.apple.com');
  }

  async listCalendars(accessToken: string, params?: Record<string, string>): Promise<ExternalCalendar[]> {
    const appleId = params?.appleId;
    if (!appleId) throw new Error('Apple ID is required');

    const client = await this.getDAVClient(appleId, accessToken);
    const calendars = await client.fetchCalendars();

    return calendars.map((cal: DAVCalendar) => ({
      id: cal.url,
      name: String(cal.displayName || 'Unnamed Calendar'),
      description: cal.description ?? undefined,
      color: cal.calendarColor ?? undefined,
      timeZone: cal.timezone ?? undefined,
      isPrimary: false,
      accessRole: 'owner' as const,
    }));
  }

  async getCalendar(accessToken: string, calendarId: string, params?: Record<string, string>): Promise<ExternalCalendar> {
    const appleId = params?.appleId;
    if (!appleId) throw new Error('Apple ID is required');

    const calendars = await this.listCalendars(accessToken, params);
    const calendar = calendars.find((c) => c.id === calendarId);
    if (!calendar) throw new Error('Calendar not found');
    return calendar;
  }

  async getEvents(
    accessToken: string,
    calendarId: string,
    timeRange: TimeRange,
    options?: GetEventsOptions,
  ): Promise<EventsResult> {
    const appleId = options?.appleId;
    if (!appleId) throw new Error('Apple ID is required');

    const client = await this.getDAVClient(appleId, accessToken);

    const objects = await client.fetchCalendarObjects({
      calendar: { url: calendarId } as DAVCalendar,
      timeRange: {
        start: timeRange.start.toISOString(),
        end: timeRange.end.toISOString(),
      },
    });

    const events = objects.map((obj: DAVObject) => this.parseICalEvent(obj));

    return {
      events,
      nextSyncToken: undefined,
      hasMore: false,
    };
  }

  async getEvent(accessToken: string, calendarId: string, eventId: string, appleId?: string): Promise<ExternalEvent> {
    if (!appleId) throw new Error('Apple ID is required');

    const client = await this.getDAVClient(appleId, accessToken);

    const objects = await client.fetchCalendarObjects({
      calendar: { url: calendarId } as DAVCalendar,
      objectUrls: [eventId],
    });

    if (objects.length === 0) throw new Error('Event not found');
    return this.parseICalEvent(objects[0]);
  }

  async createEvent(
    accessToken: string,
    calendarId: string,
    event: CreateEventInput,
    appleId?: string,
  ): Promise<ExternalEvent> {
    if (!appleId) throw new Error('Apple ID is required');

    const client = await this.getDAVClient(appleId, accessToken);

    const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}@daymark`;
    const icalData = this.buildICalEvent(uid, event);

    await client.createCalendarObject({
      calendar: { url: calendarId } as DAVCalendar,
      filename: `${uid}.ics`,
      iCalString: icalData,
    });

    return {
      id: `${calendarId}${uid}.ics`,
      title: event.title,
      description: event.description,
      location: event.location,
      startTime: event.startTime,
      endTime: event.endTime,
      isAllDay: event.isAllDay || false,
      status: 'confirmed',
      visibility: 'public',
      updatedAt: new Date(),
      createdAt: new Date(),
    };
  }

  async updateEvent(
    accessToken: string,
    calendarId: string,
    event: UpdateEventInput,
    appleId?: string,
  ): Promise<ExternalEvent> {
    if (!appleId) throw new Error('Apple ID is required');

    const client = await this.getDAVClient(appleId, accessToken);
    const existing = await this.getEvent(accessToken, calendarId, event.id, appleId);

    const updated = {
      title: event.title ?? existing.title,
      startTime: event.startTime ?? existing.startTime,
      endTime: event.endTime ?? existing.endTime,
      isAllDay: event.isAllDay ?? existing.isAllDay,
      description: event.description ?? existing.description,
      location: event.location ?? existing.location,
    };

    const uid = event.id.split('/').pop()?.replace('.ics', '') || event.id;
    const icalData = this.buildICalEvent(uid, updated);

    await client.updateCalendarObject({
      calendarObject: {
        url: event.id,
        data: icalData,
        etag: existing.etag,
      },
    });

    return {
      ...existing,
      ...updated,
      updatedAt: new Date(),
    };
  }

  async deleteEvent(accessToken: string, _calendarId: string, eventId: string, appleId?: string): Promise<void> {
    if (!appleId) throw new Error('Apple ID is required');

    const client = await this.getDAVClient(appleId, accessToken);

    await client.deleteCalendarObject({
      calendarObject: { url: eventId },
    });
  }

  private async getDAVClient(appleId: string, appSpecificPassword: string): Promise<DAVClient> {
    const client = new DAVClient({
      serverUrl: 'https://caldav.icloud.com',
      credentials: {
        username: appleId,
        password: appSpecificPassword,
      },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    });

    await client.login();
    return client;
  }

  private parseICalEvent(obj: DAVObject): ExternalEvent {
    const data = obj.data || '';

    const getField = (field: string): string | undefined => {
      const match = data.match(new RegExp(`${field}[^:]*:(.+)`));
      return match?.[1]?.trim();
    };

    const parseDate = (value?: string): Date => {
      if (!value) return new Date();
      if (value.length === 8) {
        return new Date(value.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
      }
      return new Date(value.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6'));
    };

    return {
      id: obj.url,
      etag: obj.etag,
      title: getField('SUMMARY') || 'Untitled Event',
      description: getField('DESCRIPTION'),
      location: getField('LOCATION'),
      startTime: parseDate(getField('DTSTART')),
      endTime: parseDate(getField('DTEND')),
      isAllDay: !getField('DTSTART')?.includes('T'),
      status: 'confirmed',
      visibility: 'public',
      updatedAt: parseDate(getField('LAST-MODIFIED')) || new Date(),
      createdAt: parseDate(getField('CREATED')) || new Date(),
    };
  }

  private buildICalEvent(uid: string, event: CreateEventInput | Record<string, unknown>): string {
    const formatDate = (date: Date, isAllDay: boolean): string => {
      if (isAllDay) {
        return date.toISOString().split('T')[0].replace(/-/g, '');
      }
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const startTime = event.startTime as Date;
    const endTime = event.endTime as Date;
    const isAllDay = (event.isAllDay as boolean) || false;
    const title = event.title as string;
    const description = event.description as string | undefined;
    const location = event.location as string | undefined;

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Daymark//Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatDate(new Date(), false)}`,
      `DTSTART${isAllDay ? ';VALUE=DATE' : ''}:${formatDate(startTime, isAllDay)}`,
      `DTEND${isAllDay ? ';VALUE=DATE' : ''}:${formatDate(endTime, isAllDay)}`,
      `SUMMARY:${title}`,
    ];

    if (description) lines.push(`DESCRIPTION:${description}`);
    if (location) lines.push(`LOCATION:${location}`);

    lines.push('END:VEVENT', 'END:VCALENDAR');

    return lines.join('\r\n');
  }
}
