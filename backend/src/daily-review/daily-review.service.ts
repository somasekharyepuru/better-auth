import { Injectable } from '@nestjs/common';
import { DaysService } from '../days/days.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DailyReviewService {
    constructor(
        private prisma: PrismaService,
        private daysService: DaysService,
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
     * - Filters out priorities already carried forward (carriedToDate is set)
     * - No limit restriction - all incomplete priorities can be carried
     * - Marks source priorities with carriedToDate after carrying
     */
    async carryForwardPriorities(userId: string, fromDateStr: string, toDateStr: string, lifeAreaId?: string) {
        const fromDay = await this.daysService.getOrCreateDay(userId, fromDateStr, lifeAreaId || null);
        const toDay = await this.daysService.getOrCreateDay(userId, toDateStr, lifeAreaId || null);

        // Get incomplete priorities from source day that haven't been carried yet
        const incompletePriorities = await this.prisma.topPriority.findMany({
            where: {
                dayId: fromDay.id,
                completed: false,
                carriedToDate: null, // Only get priorities not already carried
            },
        });

        // Get the highest order in target day to continue from
        const existingPriorities = await this.prisma.topPriority.findMany({
            where: { dayId: toDay.id },
            orderBy: { order: 'desc' },
            take: 1,
        });
        const highestOrder = existingPriorities.length > 0 ? existingPriorities[0].order : 0;

        // Carry ALL incomplete priorities - no limit restriction for carryovers
        const toCarry = incompletePriorities;

        // Create new priorities in target day
        const carried = await Promise.all(
            toCarry.map((p, index) =>
                this.prisma.topPriority.create({
                    data: {
                        title: p.title,
                        order: highestOrder + index + 1,
                        dayId: toDay.id,
                    },
                }),
            ),
        );

        // Mark the source priorities as carried (so they don't appear in carryover UI again)
        const toDate = new Date(toDateStr);
        await Promise.all(
            toCarry.map((p) =>
                this.prisma.topPriority.update({
                    where: { id: p.id },
                    data: { carriedToDate: toDate },
                }),
            ),
        );

        return {
            carried: carried.length,
            skipped: 0, // No longer skipping any
            priorities: carried,
        };
    }

}
