import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UpdateSettingsDto {
    maxTopPriorities?: number;
    maxDiscussionItems?: number;
    enabledSections?: string[];
    defaultTimeBlockDuration?: number;
    defaultTimeBlockType?: string;
    endOfDayReviewEnabled?: boolean;
    autoCarryForward?: boolean;
    autoCreateNextDay?: boolean;
    // Tools settings
    toolsTabEnabled?: boolean;
    pomodoroEnabled?: boolean;
    eisenhowerEnabled?: boolean;
    decisionLogEnabled?: boolean;
    pomodoroFocusDuration?: number;
    pomodoroShortBreak?: number;
    pomodoroLongBreak?: number;
}

export interface UserSettingsResponse {
    id: string;
    userId: string;
    maxTopPriorities: number;
    maxDiscussionItems: number;
    enabledSections: string[];
    defaultTimeBlockDuration: number;
    defaultTimeBlockType: string;
    endOfDayReviewEnabled: boolean;
    autoCarryForward: boolean;
    autoCreateNextDay: boolean;
    // Tools settings
    toolsTabEnabled: boolean;
    pomodoroEnabled: boolean;
    eisenhowerEnabled: boolean;
    decisionLogEnabled: boolean;
    pomodoroFocusDuration: number;
    pomodoroShortBreak: number;
    pomodoroLongBreak: number;
}

@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get or create user settings with defaults
     */
    async getSettings(userId: string): Promise<UserSettingsResponse> {
        let settings = await this.prisma.userSettings.findUnique({
            where: { userId },
        });

        if (!settings) {
            settings = await this.prisma.userSettings.create({
                data: { userId },
            });
        }

        return this.formatSettings(settings);
    }

    /**
     * Update user settings
     */
    async updateSettings(userId: string, data: UpdateSettingsDto): Promise<UserSettingsResponse> {
        // Validate limits
        if (data.maxTopPriorities !== undefined) {
            data.maxTopPriorities = Math.max(1, Math.min(5, data.maxTopPriorities));
        }
        if (data.maxDiscussionItems !== undefined) {
            data.maxDiscussionItems = Math.max(0, Math.min(5, data.maxDiscussionItems));
        }
        if (data.defaultTimeBlockDuration !== undefined) {
            data.defaultTimeBlockDuration = Math.max(15, Math.min(240, data.defaultTimeBlockDuration));
        }
        // Validate pomodoro durations
        if (data.pomodoroFocusDuration !== undefined) {
            data.pomodoroFocusDuration = Math.max(1, Math.min(120, data.pomodoroFocusDuration));
        }
        if (data.pomodoroShortBreak !== undefined) {
            data.pomodoroShortBreak = Math.max(1, Math.min(30, data.pomodoroShortBreak));
        }
        if (data.pomodoroLongBreak !== undefined) {
            data.pomodoroLongBreak = Math.max(1, Math.min(60, data.pomodoroLongBreak));
        }

        // Convert enabledSections array to JSON string for storage
        const updateData: any = { ...data };
        if (data.enabledSections) {
            // Ensure at least one section is enabled
            if (data.enabledSections.length === 0) {
                data.enabledSections = ['priorities'];
            }
            updateData.enabledSections = JSON.stringify(data.enabledSections);
        }

        const settings = await this.prisma.userSettings.upsert({
            where: { userId },
            update: updateData,
            create: {
                userId,
                ...updateData,
            },
        });

        return this.formatSettings(settings);
    }

    /**
     * Format settings for API response (parse JSON fields)
     */
    private formatSettings(settings: any): UserSettingsResponse {
        return {
            id: settings.id,
            userId: settings.userId,
            maxTopPriorities: settings.maxTopPriorities,
            maxDiscussionItems: settings.maxDiscussionItems,
            enabledSections: JSON.parse(settings.enabledSections),
            defaultTimeBlockDuration: settings.defaultTimeBlockDuration,
            defaultTimeBlockType: settings.defaultTimeBlockType,
            endOfDayReviewEnabled: settings.endOfDayReviewEnabled,
            autoCarryForward: settings.autoCarryForward,
            autoCreateNextDay: settings.autoCreateNextDay,
            // Tools settings
            toolsTabEnabled: settings.toolsTabEnabled,
            pomodoroEnabled: settings.pomodoroEnabled,
            eisenhowerEnabled: settings.eisenhowerEnabled,
            decisionLogEnabled: settings.decisionLogEnabled,
            pomodoroFocusDuration: settings.pomodoroFocusDuration,
            pomodoroShortBreak: settings.pomodoroShortBreak,
            pomodoroLongBreak: settings.pomodoroLongBreak,
        };
    }
}
