import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DaysService } from '../days/days.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class DailyReviewService {
    constructor(
        private prisma: PrismaService,
        private daysService: DaysService,
        private settingsService: SettingsService,
    ) { }

    /**
     * Create or update daily review
     */
    async upsertReview(
        userId: string,
        dateStr: string,
        data: { wentWell?: string; didntGoWell?: string },
    ) {
        const day = await this.daysService.getOrCreateDay(userId, dateStr);

        return this.prisma.dailyReview.upsert({
            where: { dayId: day.id },
            update: data,
            create: {
                ...data,
                dayId: day.id,
            },
        });
    }

    /**
     * Carry forward incomplete priorities to next day
     */
    async carryForwardPriorities(userId: string, fromDateStr: string, toDateStr: string) {
        // Get user settings for maxTopPriorities
        const settings = await this.settingsService.getSettings(userId);
        const maxPriorities = settings.maxTopPriorities;

        const fromDay = await this.daysService.getOrCreateDay(userId, fromDateStr);
        const toDay = await this.daysService.getOrCreateDay(userId, toDateStr);

        // Get incomplete priorities from source day
        const incompletePriorities = await this.prisma.topPriority.findMany({
            where: {
                dayId: fromDay.id,
                completed: false,
            },
        });

        // Check how many priorities exist in target day
        const existingCount = await this.prisma.topPriority.count({
            where: { dayId: toDay.id },
        });

        // Use user's maxTopPriorities setting instead of hardcoded 3
        const availableSlots = Math.max(0, maxPriorities - existingCount);
        const toCarry = incompletePriorities.slice(0, availableSlots);

        // Create new priorities in target day
        const carried = await Promise.all(
            toCarry.map((p, index) =>
                this.prisma.topPriority.create({
                    data: {
                        title: p.title,
                        order: existingCount + index + 1,
                        dayId: toDay.id,
                    },
                }),
            ),
        );

        return {
            carried: carried.length,
            skipped: incompletePriorities.length - carried.length,
            priorities: carried,
            maxPriorities, // Include in response for transparency
        };
    }
}
