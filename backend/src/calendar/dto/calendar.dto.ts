import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { CalendarProvider, SyncDirection, PrivacyMode, ConflictStrategy } from '@prisma/client';

export class InitiateConnectionDto {
  @IsEnum(CalendarProvider)
  provider!: CalendarProvider;

  @IsString()
  redirectUri!: string;
}

export class CompleteConnectionDto {
  @IsString()
  state!: string;

  @IsString()
  code!: string;

  @IsString()
  redirectUri!: string;
}

export class CompleteAppleConnectionDto {
  @IsString()
  state!: string;

  @IsString()
  appleId!: string;

  @IsString()
  appSpecificPassword!: string;
}

export class UpdateConnectionDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(60)
  syncIntervalMins?: number;
}

export class UpdateSourceDto {
  @IsOptional()
  @IsBoolean()
  syncEnabled?: boolean;

  @IsOptional()
  @IsEnum(SyncDirection)
  syncDirection?: SyncDirection;

  @IsOptional()
  @IsEnum(PrivacyMode)
  privacyMode?: PrivacyMode;

  @IsOptional()
  @IsString()
  defaultEventType?: string;
}

export class UpdateCalendarSettingsDto {
  @IsOptional()
  @IsEnum(SyncDirection)
  defaultSyncDirection?: SyncDirection;

  @IsOptional()
  @IsEnum(PrivacyMode)
  defaultPrivacyMode?: PrivacyMode;

  @IsOptional()
  @IsString()
  defaultEventType?: string;

  @IsOptional()
  @IsEnum(ConflictStrategy)
  conflictStrategy?: ConflictStrategy;

  @IsOptional()
  @IsString()
  primaryCalendarId?: string;

  @IsOptional()
  @IsBoolean()
  notifyOnConflict?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  syncRangeMonthsPast?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  syncRangeMonthsFuture?: number;

  @IsOptional()
  @IsBoolean()
  doubleBookingAlert?: boolean;
}

export class ResolveConflictDto {
  @IsEnum(['local', 'remote', 'merge'] as const)
  resolution!: 'local' | 'remote' | 'merge';

  @IsOptional()
  @IsString()
  mergedTitle?: string;

  @IsOptional()
  mergedStart?: Date;

  @IsOptional()
  mergedEnd?: Date;
}
