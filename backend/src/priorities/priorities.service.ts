import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DaysService } from '../days/days.service';

@Injectable()
export class PrioritiesService {
    constructor(
        private prisma: PrismaService,
        private daysService: DaysService,
    ) { }

    /**
     * Create a priority (unlimited)
     */
    async createPriority(userId: string, dateStr: string, title: string, lifeAreaId?: string) {
        const day = await this.daysService.getOrCreateDay(userId, dateStr, lifeAreaId);

        // Get current count for ordering
        const count = await this.prisma.topPriority.count({
            where: { dayId: day.id },
        });

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
     * Reorder priorities - update order for multiple priorities at once
     */
    async reorderPriorities(userId: string, priorities: Array<{ id: string; order: number }>) {
        // Verify all priorities belong to the user
        const priorityIds = priorities.map(p => p.id);
        const existingPriorities = await this.prisma.topPriority.findMany({
            where: { id: { in: priorityIds } },
            include: { day: true },
        });

        // Check ownership for all priorities
        for (const priority of existingPriorities) {
            if (priority.day.userId !== userId) {
                throw new UnauthorizedException('Access denied');
            }
        }

        if (existingPriorities.length !== priorities.length) {
            throw new NotFoundException('One or more priorities not found');
        }

        // Update all orders in a transaction
        const updates = priorities.map(({ id, order }) =>
            this.prisma.topPriority.update({
                where: { id },
                data: { order },
            })
        );

        return this.prisma.$transaction(updates);
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

    /**
     * Move priority to a different life area
     */
    async moveToLifeArea(priorityId: string, userId: string, targetLifeAreaId: string | null, dateStr: string) {
        const priority = await this.verifyOwnership(priorityId, userId);

        // Get or create the target day for the new life area
        const targetDay = await this.daysService.getOrCreateDay(userId, dateStr, targetLifeAreaId);

        // If same day, no need to move
        if (targetDay.id === priority.dayId) {
            return priority;
        }

        // Get the order for the new day (add at end)
        const count = await this.prisma.topPriority.count({
            where: { dayId: targetDay.id },
        });

        // Update the priority's dayId
        return this.prisma.topPriority.update({
            where: { id: priorityId },
            data: {
                dayId: targetDay.id,
                order: count + 1,
            },
        });
    }
}
