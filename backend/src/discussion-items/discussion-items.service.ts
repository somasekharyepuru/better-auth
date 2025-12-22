import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DaysService } from '../days/days.service';

@Injectable()
export class DiscussionItemsService {
    constructor(
        private prisma: PrismaService,
        private daysService: DaysService,
    ) { }

    /**
     * Create a discussion item (max 3 per day per life area)
     */
    async createItem(userId: string, dateStr: string, content: string, lifeAreaId?: string) {
        const day = await this.daysService.getOrCreateDay(userId, dateStr, lifeAreaId);

        const count = await this.prisma.discussionItem.count({
            where: { dayId: day.id },
        });

        if (count >= 3) {
            throw new BadRequestException('Maximum 3 discussion items per day');
        }

        return this.prisma.discussionItem.create({
            data: {
                content,
                order: count + 1,
                dayId: day.id,
            },
        });
    }

    /**
     * Update discussion item
     */
    async updateItem(itemId: string, userId: string, content: string) {
        await this.verifyOwnership(itemId, userId);

        return this.prisma.discussionItem.update({
            where: { id: itemId },
            data: { content },
        });
    }

    /**
     * Delete discussion item
     */
    async deleteItem(itemId: string, userId: string) {
        await this.verifyOwnership(itemId, userId);

        return this.prisma.discussionItem.delete({
            where: { id: itemId },
        });
    }

    private async verifyOwnership(itemId: string, userId: string) {
        const item = await this.prisma.discussionItem.findUnique({
            where: { id: itemId },
            include: { day: true },
        });

        if (!item) {
            throw new NotFoundException('Discussion item not found');
        }

        if (item.day.userId !== userId) {
            throw new UnauthorizedException('Access denied');
        }

        return item;
    }
}
