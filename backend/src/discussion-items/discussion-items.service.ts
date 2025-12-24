import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DaysService } from '../days/days.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class DiscussionItemsService {
    constructor(
        private prisma: PrismaService,
        private daysService: DaysService,
        private settingsService: SettingsService,
    ) { }

    /**
     * Create a discussion item (max based on user's maxDiscussionItems setting)
     */
    async createItem(userId: string, dateStr: string, content: string, lifeAreaId?: string) {
        // Get user's max discussion items setting
        const settings = await this.settingsService.getSettings(userId);
        const maxItems = settings.maxDiscussionItems;

        const day = await this.daysService.getOrCreateDay(userId, dateStr, lifeAreaId);

        const count = await this.prisma.discussionItem.count({
            where: { dayId: day.id },
        });

        if (count >= maxItems) {
            throw new BadRequestException(`Maximum ${maxItems} discussion items per day`);
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

    /**
     * Move discussion item to a different life area
     */
    async moveToLifeArea(itemId: string, userId: string, targetLifeAreaId: string | null, dateStr: string) {
        const item = await this.verifyOwnership(itemId, userId);

        // Get or create the target day for the new life area
        const targetDay = await this.daysService.getOrCreateDay(userId, dateStr, targetLifeAreaId);

        // If same day, no need to move
        if (targetDay.id === item.dayId) {
            return item;
        }

        // Get the order for the new day (add at end)
        const count = await this.prisma.discussionItem.count({
            where: { dayId: targetDay.id },
        });

        // Get user's max discussion items setting
        const settings = await this.settingsService.getSettings(userId);
        if (count >= settings.maxDiscussionItems) {
            throw new BadRequestException(`Maximum ${settings.maxDiscussionItems} discussion items per day in the target life area`);
        }

        // Update the item's dayId
        return this.prisma.discussionItem.update({
            where: { id: itemId },
            data: {
                dayId: targetDay.id,
                order: count + 1,
            },
        });
    }
}
