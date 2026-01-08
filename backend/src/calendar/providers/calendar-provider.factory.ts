import { Injectable } from '@nestjs/common';
import { CalendarProvider } from '@prisma/client';
import { ICalendarProvider } from './calendar-provider.interface';
import { GoogleCalendarProvider } from './google-calendar.provider';
import { MicrosoftCalendarProvider } from './microsoft-calendar.provider';
import { AppleCalDAVProvider } from './apple-caldav.provider';

@Injectable()
export class CalendarProviderFactory {
  constructor(
    private readonly googleProvider: GoogleCalendarProvider,
    private readonly microsoftProvider: MicrosoftCalendarProvider,
    private readonly appleProvider: AppleCalDAVProvider,
  ) {}

  getProvider(provider: CalendarProvider): ICalendarProvider {
    switch (provider) {
      case CalendarProvider.GOOGLE:
        return this.googleProvider;
      case CalendarProvider.MICROSOFT:
        return this.microsoftProvider;
      case CalendarProvider.APPLE:
        return this.appleProvider;
      default:
        throw new Error(`Unknown calendar provider: ${provider}`);
    }
  }

  getAllProviders(): ICalendarProvider[] {
    return [this.googleProvider, this.microsoftProvider, this.appleProvider];
  }

  getWebhookProviders(): ICalendarProvider[] {
    return this.getAllProviders().filter((p) => p.supportsWebhooks);
  }

  getPollingProviders(): ICalendarProvider[] {
    return this.getAllProviders().filter((p) => !p.supportsWebhooks);
  }
}
