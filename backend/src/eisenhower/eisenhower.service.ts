import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateEisenhowerTaskDto {
    title: string;
    note?: string;
    quadrant: number; // 1-4
}

export interface UpdateEisenhowerTaskDto {
    title?: string;
    note?: string;
    quadrant?: number;
}

@Injectable()
export class EisenhowerService {
    constructor(private prisma: PrismaService) { }

    async getAllTasks(userId: string) {
        return this.prisma.eisenhowerTask.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createTask(userId: string, data: CreateEisenhowerTaskDto) {
        // Validate quadrant (1-4)
        const quadrant = Math.max(1, Math.min(4, data.quadrant));

        return this.prisma.eisenhowerTask.create({
            data: {
                userId,
                title: data.title,
                note: data.note,
                quadrant,
            },
        });
    }

    async updateTask(id: string, userId: string, data: UpdateEisenhowerTaskDto) {
        // Verify ownership
        const task = await this.prisma.eisenhowerTask.findFirst({
            where: { id, userId },
        });

        if (!task) {
            throw new Error('Task not found');
        }

        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.note !== undefined) updateData.note = data.note;
        if (data.quadrant !== undefined) {
            updateData.quadrant = Math.max(1, Math.min(4, data.quadrant));
        }

        return this.prisma.eisenhowerTask.update({
            where: { id },
            data: updateData,
        });
    }

    async deleteTask(id: string, userId: string) {
        // Verify ownership
        const task = await this.prisma.eisenhowerTask.findFirst({
            where: { id, userId },
        });

        if (!task) {
            throw new Error('Task not found');
        }

        return this.prisma.eisenhowerTask.delete({
            where: { id },
        });
    }

    async promoteToDaily(id: string, userId: string, date: string) {
        // Get the task
        const task = await this.prisma.eisenhowerTask.findFirst({
            where: { id, userId },
        });

        if (!task) {
            throw new Error('Task not found');
        }

        // Get or create day
        let day = await this.prisma.day.findFirst({
            where: { userId, date: new Date(date) },
        });

        if (!day) {
            day = await this.prisma.day.create({
                data: { userId, date: new Date(date) },
            });
        }

        // Count existing priorities
        const priorityCount = await this.prisma.topPriority.count({
            where: { dayId: day.id },
        });

        // Create priority
        const priority = await this.prisma.topPriority.create({
            data: {
                dayId: day.id,
                title: task.title,
                order: priorityCount + 1,
            },
        });

        // Optionally delete the task from matrix
        await this.prisma.eisenhowerTask.delete({
            where: { id },
        });

        return priority;
    }
}
