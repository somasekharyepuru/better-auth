import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DaysService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get or create a day for the given date, user, and life area
     */
    async getOrCreateDay(userId: string, dateStr: string, lifeAreaId?: string | null) {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);

        // Try to find existing day with the specific lifeAreaId
        let day = await this.prisma.day.findFirst({
            where: {
                userId,
                date,
                lifeAreaId: lifeAreaId || null,
            },
            include: {
                priorities: { orderBy: { order: 'asc' } },
                discussionItems: { orderBy: { order: 'asc' } },
                timeBlocks: { orderBy: { startTime: 'asc' } },
                quickNote: true,
                dailyReview: true,
                lifeArea: true,
            },
        });

        if (!day) {
            day = await this.prisma.day.create({
                data: {
                    userId,
                    date,
                    lifeAreaId: lifeAreaId || null,
                },
                include: {
                    priorities: { orderBy: { order: 'asc' } },
                    discussionItems: { orderBy: { order: 'asc' } },
                    timeBlocks: { orderBy: { startTime: 'asc' } },
                    quickNote: true,
                    dailyReview: true,
                    lifeArea: true,
                },
            });
        }

        return day;
    }

    /**
     * Get day progress - how many priorities completed (per life area)
     */
    async getDayProgress(userId: string, dateStr: string, lifeAreaId?: string | null) {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);

        const day = await this.prisma.day.findFirst({
            where: {
                userId,
                date,
                lifeAreaId: lifeAreaId || null,
            },
            include: {
                priorities: true,
            },
        });

        if (!day) {
            return { total: 0, completed: 0 };
        }

        const total = day.priorities.length;
        const completed = day.priorities.filter((p) => p.completed).length;

        return { total, completed };
    }

    /**
     * Verify day belongs to user
     */
    async verifyDayOwnership(dayId: string, userId: string) {
        const day = await this.prisma.day.findUnique({
            where: { id: dayId },
        });

        if (!day || day.userId !== userId) {
            throw new UnauthorizedException('Access denied');
        }

        return day;
    }
}
