import { Injectable, NotFoundException, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DaysService } from '../days/days.service';
import { ExternalBlockingService } from '../calendar/services/external-blocking.service';

// Types for time block operations
export interface CreateTimeBlockInput {
    title: string;
    startTime: string;
    endTime: string;
    type?: string;
    category?: string;
    priorityId?: string;
    blockExternalCalendars?: boolean;
    recurrenceRule?: string;
    recurrenceEndDate?: string;
}

export interface UpdateTimeBlockInput {
    title?: string;
    startTime?: string;
    endTime?: string;
    type?: string;
    category?: string;
    priorityId?: string | null;
    blockExternalCalendars?: boolean;
    recurrenceRule?: string | null;
    recurrenceEndDate?: string | null;
}

export interface TimeBlockWithRelations {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    type: string;
    category: string;
    dayId: string;
    priorityId: string | null;
    blockExternalCalendars: boolean;
    recurrenceRule: string | null;
    recurrenceEndDate: Date | null;
    parentBlockId: string | null;
    isFromCalendar: boolean;
    calendarSourceId: string | null;
    externalEventId: string | null;
    createdAt: Date;
    updatedAt: Date;
    priority?: {
        id: string;
        title: string;
        completed: boolean;
    } | null;
    focusSessions?: {
        id: string;
        startedAt: Date;
        endedAt: Date | null;
        completed: boolean;
    }[];
}

export interface ConflictInfo {
    hasConflict: boolean;
    conflictingBlocks: {
        id: string;
        title: string;
        startTime: Date;
        endTime: Date;
        category: string;
    }[];
}

// Valid categories for time blocks
export const TIME_BLOCK_CATEGORIES = ['focus', 'meeting', 'break', 'deep-work', 'personal'] as const;
export type TimeBlockCategory = typeof TIME_BLOCK_CATEGORIES[number];

@Injectable()
export class TimeBlocksService {
    private readonly logger = new Logger(TimeBlocksService.name);

    constructor(
        private prisma: PrismaService,
        private daysService: DaysService,
        private externalBlockingService: ExternalBlockingService,
    ) { }

    /**
     * Create a time block with all new features
     */
    async createTimeBlock(
        userId: string,
        dateStr: string,
        data: CreateTimeBlockInput,
        lifeAreaId?: string,
    ): Promise<TimeBlockWithRelations> {
        const day = await this.daysService.getOrCreateDay(userId, dateStr, lifeAreaId);

        const startTime = new Date(data.startTime);
        const endTime = new Date(data.endTime);

        // Validate times
        if (startTime >= endTime) {
            throw new BadRequestException('Start time must be before end time');
        }

        // Validate category
        const category = data.category || 'focus';
        if (!TIME_BLOCK_CATEGORIES.includes(category as TimeBlockCategory)) {
            throw new BadRequestException(`Invalid category. Must be one of: ${TIME_BLOCK_CATEGORIES.join(', ')}`);
        }

        // Validate priority if provided
        if (data.priorityId) {
            const priority = await this.prisma.topPriority.findUnique({
                where: { id: data.priorityId },
                include: { day: true },
            });
            if (!priority || priority.day.userId !== userId) {
                throw new BadRequestException('Invalid priority ID');
            }
        }

        // Check for conflicts with existing focus blocks
        const conflicts = await this.checkConflicts(userId, startTime, endTime);
        if (conflicts.hasConflict && category === 'focus') {
            // Still create, but add warning in response (frontend will handle display)
        }

        const timeBlock = await this.prisma.timeBlock.create({
            data: {
                title: data.title,
                startTime,
                endTime,
                type: data.type || 'Deep Work',
                category,
                dayId: day.id,
                priorityId: data.priorityId || null,
                blockExternalCalendars: data.blockExternalCalendars ?? true,
                recurrenceRule: data.recurrenceRule || null,
                recurrenceEndDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null,
            },
            include: {
                priority: {
                    select: {
                        id: true,
                        title: true,
                        completed: true,
                    },
                },
                focusSessions: {
                    select: {
                        id: true,
                        startedAt: true,
                        endedAt: true,
                        completed: true,
                    },
                    orderBy: { startedAt: 'desc' },
                    take: 5,
                },
            },
        });

        // If this is a focus block with external blocking enabled, push busy events to external calendars
        const shouldBlock = (category === 'focus' || category === 'deep-work') &&
            (data.blockExternalCalendars !== false);

        if (shouldBlock) {
            // Fire and forget - don't block the response
            this.externalBlockingService.createBlockingEvents(
                userId,
                timeBlock.id,
                timeBlock.title,
                startTime,
                endTime,
            ).then(result => {
                if (result.blockedCalendars.length > 0) {
                    this.logger.log(`Created blocking events on: ${result.blockedCalendars.join(', ')}`);
                }
                if (result.errors.length > 0) {
                    this.logger.warn(`Some blocking events failed: ${result.errors.join('; ')}`);
                }
            }).catch(error => {
                this.logger.error(`Failed to create blocking events: ${error}`);
            });
        }

        return timeBlock;
    }

    /**
     * Get all time blocks for a user on a specific date
     */
    async getTimeBlocksForDate(
        userId: string,
        dateStr: string,
        lifeAreaId?: string,
    ): Promise<TimeBlockWithRelations[]> {
        const day = await this.prisma.day.findFirst({
            where: {
                userId,
                date: new Date(dateStr),
                ...(lifeAreaId && { lifeAreaId }),
            },
        });

        if (!day) {
            return [];
        }

        return this.prisma.timeBlock.findMany({
            where: { dayId: day.id },
            include: {
                priority: {
                    select: {
                        id: true,
                        title: true,
                        completed: true,
                    },
                },
                focusSessions: {
                    select: {
                        id: true,
                        startedAt: true,
                        endedAt: true,
                        completed: true,
                    },
                    orderBy: { startedAt: 'desc' },
                    take: 5,
                },
            },
            orderBy: { startTime: 'asc' },
        });
    }

    /**
     * Get time blocks for a date range (for calendar views)
     */
    async getTimeBlocksForRange(
        userId: string,
        startDate: Date,
        endDate: Date,
        lifeAreaId?: string,
    ): Promise<TimeBlockWithRelations[]> {
        return this.prisma.timeBlock.findMany({
            where: {
                day: {
                    userId,
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                    ...(lifeAreaId && { lifeAreaId }),
                },
            },
            include: {
                priority: {
                    select: {
                        id: true,
                        title: true,
                        completed: true,
                    },
                },
                focusSessions: {
                    select: {
                        id: true,
                        startedAt: true,
                        endedAt: true,
                        completed: true,
                    },
                    orderBy: { startedAt: 'desc' },
                    take: 5,
                },
            },
            orderBy: { startTime: 'asc' },
        });
    }

    /**
     * Update time block with new features
     */
    async updateTimeBlock(
        blockId: string,
        userId: string,
        data: UpdateTimeBlockInput,
    ): Promise<TimeBlockWithRelations> {
        await this.verifyOwnership(blockId, userId);

        const updateData: any = {};

        if (data.title !== undefined) updateData.title = data.title;
        if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime);
        if (data.endTime !== undefined) updateData.endTime = new Date(data.endTime);
        if (data.type !== undefined) updateData.type = data.type;

        if (data.category !== undefined) {
            if (!TIME_BLOCK_CATEGORIES.includes(data.category as TimeBlockCategory)) {
                throw new BadRequestException(`Invalid category. Must be one of: ${TIME_BLOCK_CATEGORIES.join(', ')}`);
            }
            updateData.category = data.category;
        }

        if (data.priorityId !== undefined) {
            if (data.priorityId === null) {
                updateData.priorityId = null;
            } else {
                const priority = await this.prisma.topPriority.findUnique({
                    where: { id: data.priorityId },
                    include: { day: true },
                });
                if (!priority || priority.day.userId !== userId) {
                    throw new BadRequestException('Invalid priority ID');
                }
                updateData.priorityId = data.priorityId;
            }
        }

        if (data.blockExternalCalendars !== undefined) {
            updateData.blockExternalCalendars = data.blockExternalCalendars;
        }

        if (data.recurrenceRule !== undefined) {
            updateData.recurrenceRule = data.recurrenceRule;
        }

        if (data.recurrenceEndDate !== undefined) {
            updateData.recurrenceEndDate = data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null;
        }

        return this.prisma.timeBlock.update({
            where: { id: blockId },
            data: updateData,
            include: {
                priority: {
                    select: {
                        id: true,
                        title: true,
                        completed: true,
                    },
                },
                focusSessions: {
                    select: {
                        id: true,
                        startedAt: true,
                        endedAt: true,
                        completed: true,
                    },
                    orderBy: { startedAt: 'desc' },
                    take: 5,
                },
            },
        });
    }

    /**
     * Delete time block
     */
    async deleteTimeBlock(blockId: string, userId: string) {
        const block = await this.verifyOwnership(blockId, userId);

        // Remove any blocking events from external calendars first
        if (block.blockExternalCalendars && (block.category === 'focus' || block.category === 'deep-work')) {
            // Fire and forget - don't block the response
            this.externalBlockingService.removeBlockingEvents(blockId).catch(error => {
                this.logger.error(`Failed to remove blocking events: ${error}`);
            });
        }

        return this.prisma.timeBlock.delete({
            where: { id: blockId },
        });
    }


    /**
     * Link a time block to a priority
     */
    async linkToPriority(
        blockId: string,
        userId: string,
        priorityId: string,
    ): Promise<TimeBlockWithRelations> {
        await this.verifyOwnership(blockId, userId);

        const priority = await this.prisma.topPriority.findUnique({
            where: { id: priorityId },
            include: { day: true },
        });

        if (!priority || priority.day.userId !== userId) {
            throw new BadRequestException('Invalid priority ID');
        }

        return this.prisma.timeBlock.update({
            where: { id: blockId },
            data: { priorityId },
            include: {
                priority: {
                    select: {
                        id: true,
                        title: true,
                        completed: true,
                    },
                },
                focusSessions: {
                    select: {
                        id: true,
                        startedAt: true,
                        endedAt: true,
                        completed: true,
                    },
                    orderBy: { startedAt: 'desc' },
                    take: 5,
                },
            },
        });
    }

    /**
     * Unlink a time block from its priority
     */
    async unlinkFromPriority(
        blockId: string,
        userId: string,
    ): Promise<TimeBlockWithRelations> {
        await this.verifyOwnership(blockId, userId);

        return this.prisma.timeBlock.update({
            where: { id: blockId },
            data: { priorityId: null },
            include: {
                priority: {
                    select: {
                        id: true,
                        title: true,
                        completed: true,
                    },
                },
                focusSessions: {
                    select: {
                        id: true,
                        startedAt: true,
                        endedAt: true,
                        completed: true,
                    },
                    orderBy: { startedAt: 'desc' },
                    take: 5,
                },
            },
        });
    }

    /**
     * Check for conflicting time blocks
     */
    async checkConflicts(
        userId: string,
        startTime: Date,
        endTime: Date,
        excludeBlockId?: string,
    ): Promise<ConflictInfo> {
        const conflictingBlocks = await this.prisma.timeBlock.findMany({
            where: {
                day: { userId },
                id: excludeBlockId ? { not: excludeBlockId } : undefined,
                OR: [
                    // Block starts during the proposed time
                    {
                        startTime: { gte: startTime, lt: endTime },
                    },
                    // Block ends during the proposed time
                    {
                        endTime: { gt: startTime, lte: endTime },
                    },
                    // Block encompasses the proposed time
                    {
                        startTime: { lte: startTime },
                        endTime: { gte: endTime },
                    },
                ],
            },
            select: {
                id: true,
                title: true,
                startTime: true,
                endTime: true,
                category: true,
            },
        });

        return {
            hasConflict: conflictingBlocks.length > 0,
            conflictingBlocks,
        };
    }

    /**
     * Get focus blocks (blocks with category 'focus' or 'deep-work')
     */
    async getFocusBlocks(
        userId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<TimeBlockWithRelations[]> {
        return this.prisma.timeBlock.findMany({
            where: {
                day: {
                    userId,
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                category: { in: ['focus', 'deep-work'] },
            },
            include: {
                priority: {
                    select: {
                        id: true,
                        title: true,
                        completed: true,
                    },
                },
                focusSessions: {
                    select: {
                        id: true,
                        startedAt: true,
                        endedAt: true,
                        completed: true,
                    },
                    orderBy: { startedAt: 'desc' },
                    take: 5,
                },
            },
            orderBy: { startTime: 'asc' },
        });
    }

    /**
     * Get time blocks by category
     */
    async getTimeBlocksByCategory(
        userId: string,
        category: TimeBlockCategory,
        startDate: Date,
        endDate: Date,
    ): Promise<TimeBlockWithRelations[]> {
        return this.prisma.timeBlock.findMany({
            where: {
                day: {
                    userId,
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                category,
            },
            include: {
                priority: {
                    select: {
                        id: true,
                        title: true,
                        completed: true,
                    },
                },
                focusSessions: {
                    select: {
                        id: true,
                        startedAt: true,
                        endedAt: true,
                        completed: true,
                    },
                    orderBy: { startedAt: 'desc' },
                    take: 5,
                },
            },
            orderBy: { startTime: 'asc' },
        });
    }

    /**
     * Get statistics about time blocks
     */
    async getTimeBlockStats(
        userId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<{
        totalBlocks: number;
        focusBlocks: number;
        meetingBlocks: number;
        totalFocusMinutes: number;
        totalMeetingMinutes: number;
        completedSessions: number;
    }> {
        const blocks = await this.prisma.timeBlock.findMany({
            where: {
                day: {
                    userId,
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            },
            select: {
                category: true,
                startTime: true,
                endTime: true,
                focusSessions: {
                    where: { completed: true },
                    select: { id: true },
                },
            },
        });

        const stats = {
            totalBlocks: blocks.length,
            focusBlocks: 0,
            meetingBlocks: 0,
            totalFocusMinutes: 0,
            totalMeetingMinutes: 0,
            completedSessions: 0,
        };

        for (const block of blocks) {
            const durationMinutes = Math.round(
                (block.endTime.getTime() - block.startTime.getTime()) / (1000 * 60)
            );

            if (block.category === 'focus' || block.category === 'deep-work') {
                stats.focusBlocks++;
                stats.totalFocusMinutes += durationMinutes;
            } else if (block.category === 'meeting') {
                stats.meetingBlocks++;
                stats.totalMeetingMinutes += durationMinutes;
            }

            stats.completedSessions += block.focusSessions.length;
        }

        return stats;
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
