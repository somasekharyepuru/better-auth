import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DaysService } from '../days/days.service';

@Injectable()
export class PrioritiesService {
    constructor(
        private prisma: PrismaService,
        private daysService: DaysService,
    ) { }

    /**
     * Create a priority (max 3 per day)
     */
    async createPriority(userId: string, dateStr: string, title: string) {
        const day = await this.daysService.getOrCreateDay(userId, dateStr);

        // Check if already at max
        const count = await this.prisma.topPriority.count({
            where: { dayId: day.id },
        });

        if (count >= 3) {
            throw new BadRequestException('Maximum 3 priorities per day');
        }

        return this.prisma.topPriority.create({
            data: {
                title,
                order: count + 1,
                dayId: day.id,
            },
        });
    }

    /**
     * Update priority
     */
    async updatePriority(priorityId: string, userId: string, data: { title?: string; completed?: boolean }) {
        await this.verifyOwnership(priorityId, userId);

        return this.prisma.topPriority.update({
            where: { id: priorityId },
            data,
        });
    }

    /**
     * Toggle completion status
     */
    async togglePriority(priorityId: string, userId: string) {
        const priority = await this.verifyOwnership(priorityId, userId);

        return this.prisma.topPriority.update({
            where: { id: priorityId },
            data: { completed: !priority.completed },
        });
    }

    /**
     * Delete priority
     */
    async deletePriority(priorityId: string, userId: string) {
        await this.verifyOwnership(priorityId, userId);

        return this.prisma.topPriority.delete({
            where: { id: priorityId },
        });
    }

    /**
     * Verify priority belongs to user
     */
    private async verifyOwnership(priorityId: string, userId: string) {
        const priority = await this.prisma.topPriority.findUnique({
            where: { id: priorityId },
            include: { day: true },
        });

        if (!priority) {
            throw new NotFoundException('Priority not found');
        }

        if (priority.day.userId !== userId) {
            throw new UnauthorizedException('Access denied');
        }

        return priority;
    }
}
