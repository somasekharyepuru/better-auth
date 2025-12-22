import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DaysService } from '../days/days.service';

@Injectable()
export class TimeBlocksService {
    constructor(
        private prisma: PrismaService,
        private daysService: DaysService,
    ) { }

    /**
     * Create a time block
     */
    async createTimeBlock(
        userId: string,
        dateStr: string,
        data: { title: string; startTime: string; endTime: string; type?: string },
        lifeAreaId?: string,
    ) {
        const day = await this.daysService.getOrCreateDay(userId, dateStr, lifeAreaId);

        return this.prisma.timeBlock.create({
            data: {
                title: data.title,
                startTime: new Date(data.startTime),
                endTime: new Date(data.endTime),
                type: data.type || 'Deep Work',
                dayId: day.id,
            },
        });
    }

    /**
     * Update time block
     */
    async updateTimeBlock(
        blockId: string,
        userId: string,
        data: { title?: string; startTime?: string; endTime?: string; type?: string },
    ) {
        await this.verifyOwnership(blockId, userId);

        const updateData: any = {};
        if (data.title) updateData.title = data.title;
        if (data.startTime) updateData.startTime = new Date(data.startTime);
        if (data.endTime) updateData.endTime = new Date(data.endTime);
        if (data.type) updateData.type = data.type;

        return this.prisma.timeBlock.update({
            where: { id: blockId },
            data: updateData,
        });
    }

    /**
     * Delete time block
     */
    async deleteTimeBlock(blockId: string, userId: string) {
        await this.verifyOwnership(blockId, userId);

        return this.prisma.timeBlock.delete({
            where: { id: blockId },
        });
    }

    private async verifyOwnership(blockId: string, userId: string) {
        const block = await this.prisma.timeBlock.findUnique({
            where: { id: blockId },
            include: { day: true },
        });

        if (!block) {
            throw new NotFoundException('Time block not found');
        }

        if (block.day.userId !== userId) {
            throw new UnauthorizedException('Access denied');
        }

        return block;
    }
}
