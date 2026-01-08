import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Focus Suite Matrix Service
 * Extended Eisenhower Matrix functionality for Focus Suite v2
 */

export interface CreateFocusBlockFromMatrixInput {
    date: string;  // YYYY-MM-DD format
    startTime: string;  // ISO datetime
    endTime: string;    // ISO datetime
    category?: string;
}

export interface ScheduledBlock {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    category: string;
}

export interface MatrixTaskWithRelations {
    id: string;
    userId: string;
    title: string;
    note: string | null;
    quadrant: number;
    lifeAreaId: string | null;
    scheduledTimeBlockId: string | null;
    promotedDate: Date | null;
    promotedPriorityId: string | null;
    createdAt: Date;
    updatedAt: Date;
    lifeArea?: {
        id: string;
        name: string;
        color: string | null;
    } | null;
    scheduledTimeBlock?: ScheduledBlock | null;
    decisions?: {
        id: string;
        title: string;
        date: Date;
    }[];
}

@Injectable()
export class FocusSuiteMatrixService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create a Focus Block (Time Block) from a Matrix task
     */
    async createFocusBlockFromTask(
        userId: string,
        taskId: string,
        input: CreateFocusBlockFromMatrixInput,
    ): Promise<MatrixTaskWithRelations> {
        // Verify task ownership
        const task = await this.prisma.eisenhowerTask.findUnique({
            where: { id: taskId },
        });

        if (!task) {
            throw new NotFoundException('Matrix task not found');
        }

        if (task.userId !== userId) {
            throw new UnauthorizedException('Access denied');
        }

        if (task.scheduledTimeBlockId) {
            throw new BadRequestException('Task already has a scheduled focus block');
        }

        // Get or create day for the date
        const dayDate = new Date(input.date);
        dayDate.setHours(0, 0, 0, 0);

        let day = await this.prisma.day.findFirst({
            where: {
                userId,
                date: dayDate,
                lifeAreaId: task.lifeAreaId,
            },
        });

        if (!day) {
            day = await this.prisma.day.create({
                data: {
                    userId,
                    date: dayDate,
                    lifeAreaId: task.lifeAreaId,
                },
            });
        }

        // Create the time block
        const timeBlock = await this.prisma.timeBlock.create({
            data: {
                title: task.title,
                startTime: new Date(input.startTime),
                endTime: new Date(input.endTime),
                type: 'Focus Block',
                category: input.category || 'focus',
                dayId: day.id,
            },
        });

        // Update the task with the scheduled block reference
        const updatedTask = await this.prisma.eisenhowerTask.update({
            where: { id: taskId },
            data: {
                scheduledTimeBlockId: timeBlock.id,
            },
            include: {
                lifeArea: {
                    select: { id: true, name: true, color: true },
                },
                scheduledTimeBlock: {
                    select: { id: true, title: true, startTime: true, endTime: true, category: true },
                },
                decisions: {
                    select: { id: true, title: true, date: true },
                },
            },
        });

        return updatedTask;
    }

    /**
     * Attach an existing decision to a Matrix task
     */
    async attachDecisionToTask(
        userId: string,
        taskId: string,
        decisionId: string,
    ): Promise<MatrixTaskWithRelations> {
        // Verify task ownership
        const task = await this.prisma.eisenhowerTask.findUnique({
            where: { id: taskId },
        });

        if (!task || task.userId !== userId) {
            throw new NotFoundException('Matrix task not found');
        }

        // Verify decision ownership
        const decision = await this.prisma.decisionEntry.findUnique({
            where: { id: decisionId },
        });

        if (!decision || decision.userId !== userId) {
            throw new NotFoundException('Decision not found');
        }

        // Update the decision to link to the task
        await this.prisma.decisionEntry.update({
            where: { id: decisionId },
            data: { eisenhowerTaskId: taskId },
        });

        // Return updated task with relations
        return this.prisma.eisenhowerTask.findUnique({
            where: { id: taskId },
            include: {
                lifeArea: {
                    select: { id: true, name: true, color: true },
                },
                scheduledTimeBlock: {
                    select: { id: true, title: true, startTime: true, endTime: true, category: true },
                },
                decisions: {
                    select: { id: true, title: true, date: true },
                },
            },
        }) as Promise<MatrixTaskWithRelations>;
    }

    /**
     * Get focus sessions for a Matrix task (through scheduled time block)
     */
    async getSessionsForTask(userId: string, taskId: string) {
        const task = await this.prisma.eisenhowerTask.findUnique({
            where: { id: taskId },
            include: {
                scheduledTimeBlock: {
                    include: {
                        focusSessions: {
                            orderBy: { startedAt: 'desc' },
                        },
                    },
                },
            },
        });

        if (!task || task.userId !== userId) {
            throw new NotFoundException('Matrix task not found');
        }

        return task.scheduledTimeBlock?.focusSessions || [];
    }

    /**
     * Get decisions linked to a Matrix task
     */
    async getDecisionsForTask(userId: string, taskId: string) {
        const task = await this.prisma.eisenhowerTask.findUnique({
            where: { id: taskId },
            include: {
                decisions: {
                    orderBy: { date: 'desc' },
                },
            },
        });

        if (!task || task.userId !== userId) {
            throw new NotFoundException('Matrix task not found');
        }

        return task.decisions;
    }

    /**
     * Unschedule a focus block from a Matrix task
     */
    async unscheduleFocusBlock(
        userId: string,
        taskId: string,
    ): Promise<MatrixTaskWithRelations> {
        const task = await this.prisma.eisenhowerTask.findUnique({
            where: { id: taskId },
        });

        if (!task || task.userId !== userId) {
            throw new NotFoundException('Matrix task not found');
        }

        // Update task to remove block reference (don't delete the block, just unlink)
        return this.prisma.eisenhowerTask.update({
            where: { id: taskId },
            data: { scheduledTimeBlockId: null },
            include: {
                lifeArea: {
                    select: { id: true, name: true, color: true },
                },
                scheduledTimeBlock: {
                    select: { id: true, title: true, startTime: true, endTime: true, category: true },
                },
                decisions: {
                    select: { id: true, title: true, date: true },
                },
            },
        });
    }
}
