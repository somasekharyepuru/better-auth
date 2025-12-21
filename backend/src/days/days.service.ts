import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DaysService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get or create a day for the given date and user
     */
    async getOrCreateDay(userId: string, dateStr: string) {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);

        let day = await this.prisma.day.findUnique({
            where: {
                userId_date: {
                    userId,
                    date,
                },
            },
            include: {
                priorities: { orderBy: { order: 'asc' } },
                discussionItems: { orderBy: { order: 'asc' } },
                timeBlocks: { orderBy: { startTime: 'asc' } },
                quickNote: true,
                dailyReview: true,
            },
        });

        if (!day) {
            day = await this.prisma.day.create({
                data: {
                    userId,
                    date,
                },
                include: {
                    priorities: { orderBy: { order: 'asc' } },
                    discussionItems: { orderBy: { order: 'asc' } },
                    timeBlocks: { orderBy: { startTime: 'asc' } },
                    quickNote: true,
                    dailyReview: true,
                },
            });
        }

        return day;
    }

    /**
     * Get day progress - how many priorities completed
     */
    async getDayProgress(userId: string, dateStr: string) {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);

        const day = await this.prisma.day.findUnique({
            where: {
                userId_date: {
                    userId,
                    date,
                },
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
