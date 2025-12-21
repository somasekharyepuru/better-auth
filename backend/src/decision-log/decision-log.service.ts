import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateDecisionDto {
    title: string;
    date: string;
    context?: string;
    decision: string;
    outcome?: string;
}

export interface UpdateDecisionDto {
    title?: string;
    date?: string;
    context?: string;
    decision?: string;
    outcome?: string;
}

@Injectable()
export class DecisionLogService {
    constructor(private prisma: PrismaService) { }

    async getAllDecisions(userId: string, search?: string) {
        const where: any = { userId };

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { context: { contains: search, mode: 'insensitive' } },
                { decision: { contains: search, mode: 'insensitive' } },
            ];
        }

        return this.prisma.decisionEntry.findMany({
            where,
            orderBy: { date: 'desc' },
        });
    }

    async getDecision(id: string, userId: string) {
        return this.prisma.decisionEntry.findFirst({
            where: { id, userId },
        });
    }

    async createDecision(userId: string, data: CreateDecisionDto) {
        return this.prisma.decisionEntry.create({
            data: {
                userId,
                title: data.title,
                date: new Date(data.date),
                context: data.context,
                decision: data.decision,
                outcome: data.outcome,
            },
        });
    }

    async updateDecision(id: string, userId: string, data: UpdateDecisionDto) {
        // Verify ownership
        const entry = await this.prisma.decisionEntry.findFirst({
            where: { id, userId },
        });

        if (!entry) {
            throw new Error('Decision not found');
        }

        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.date !== undefined) updateData.date = new Date(data.date);
        if (data.context !== undefined) updateData.context = data.context;
        if (data.decision !== undefined) updateData.decision = data.decision;
        if (data.outcome !== undefined) updateData.outcome = data.outcome;

        return this.prisma.decisionEntry.update({
            where: { id },
            data: updateData,
        });
    }

    async deleteDecision(id: string, userId: string) {
        // Verify ownership
        const entry = await this.prisma.decisionEntry.findFirst({
            where: { id, userId },
        });

        if (!entry) {
            throw new Error('Decision not found');
        }

        return this.prisma.decisionEntry.delete({
            where: { id },
        });
    }
}
