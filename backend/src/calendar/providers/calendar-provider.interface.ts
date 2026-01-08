import { CalendarProvider } from '@prisma/client';
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

export interface ICalendarProvider {
  readonly providerType: CalendarProvider;
  readonly supportsWebhooks: boolean;

  getAuthorizationUrl(state: string, redirectUri: string): string;
  exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens>;
  refreshAccessToken(refreshToken: string): Promise<OAuthTokens>;
  revokeAccess(accessToken: string): Promise<void>;

  listCalendars(accessToken: string, additionalParams?: Record<string, string>): Promise<ExternalCalendar[]>;
  getCalendar(accessToken: string, calendarId: string, additionalParams?: Record<string, string>): Promise<ExternalCalendar>;

  getEvents(
    accessToken: string,
    calendarId: string,
    timeRange: TimeRange,
    options?: GetEventsOptions,
  ): Promise<EventsResult>;

  getEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
  ): Promise<ExternalEvent>;

  createEvent(
    accessToken: string,
    calendarId: string,
    event: CreateEventInput,
  ): Promise<ExternalEvent>;

  updateEvent(
    accessToken: string,
    calendarId: string,
    event: UpdateEventInput,
  ): Promise<ExternalEvent>;

  deleteEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
  ): Promise<void>;

  setupWebhook?(
    accessToken: string,
    calendarId: string,
    callbackUrl: string,
    channelToken: string,
  ): Promise<WebhookChannel>;

  renewWebhook?(
    accessToken: string,
    channelId: string,
    resourceId?: string,
  ): Promise<WebhookChannel>;

  stopWebhook?(
    accessToken: string,
    channelId: string,
    resourceId?: string,
  ): Promise<void>;
}
