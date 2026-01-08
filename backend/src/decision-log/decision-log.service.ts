import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Focus Suite v2: Extended DTOs with linkage fields
export interface CreateDecisionDto {
    title: string;
    date: string;
    context?: string;
    decision: string;
    outcome?: string;
    // Focus Suite v2: Linkage fields
    lifeAreaId?: string;
    eisenhowerTaskId?: string;
    priorityId?: string;
    focusSessionIds?: string[];
}

export interface UpdateDecisionDto {
    title?: string;
    date?: string;
    context?: string;
    decision?: string;
    outcome?: string;
    // Focus Suite v2: Linkage fields
    eisenhowerTaskId?: string | null;
    priorityId?: string | null;
}

// Focus Suite v2: Response type with relations
export interface DecisionWithRelations {
    id: string;
    userId: string;
    title: string;
    date: Date;
    context: string | null;
    decision: string;
    outcome: string | null;
    lifeAreaId: string | null;
    eisenhowerTaskId: string | null;
    priorityId: string | null;
    createdAt: Date;
    updatedAt: Date;
    lifeArea?: { id: string; name: string; color: string | null } | null;
    eisenhowerTask?: { id: string; title: string; quadrant: number } | null;
    priority?: { id: string; title: string } | null;
    focusSessions?: { focusSession: { id: string; startedAt: Date; completed: boolean } }[];
}

@Injectable()
export class DecisionLogService {
    constructor(private prisma: PrismaService) { }

    async getAllDecisions(userId: string, search?: string, lifeAreaId?: string): Promise<DecisionWithRelations[]> {
        const where: any = { userId };

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { context: { contains: search, mode: 'insensitive' } },
                { decision: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (lifeAreaId) {
            where.lifeAreaId = lifeAreaId;
        }

        return this.prisma.decisionEntry.findMany({
            where,
            orderBy: { date: 'desc' },
            include: {
                lifeArea: { select: { id: true, name: true, color: true } },
                eisenhowerTask: { select: { id: true, title: true, quadrant: true } },
                priority: { select: { id: true, title: true } },
                focusSessions: {
                    include: {
                        focusSession: { select: { id: true, startedAt: true, completed: true } },
                    },
                },
            },
        });
    }

    async getDecision(id: string, userId: string): Promise<DecisionWithRelations | null> {
        return this.prisma.decisionEntry.findFirst({
            where: { id, userId },
            include: {
                lifeArea: { select: { id: true, name: true, color: true } },
                eisenhowerTask: { select: { id: true, title: true, quadrant: true } },
                priority: { select: { id: true, title: true } },
                focusSessions: {
                    include: {
                        focusSession: { select: { id: true, startedAt: true, completed: true } },
                    },
                },
            },
        });
    }

    async createDecision(userId: string, data: CreateDecisionDto): Promise<DecisionWithRelations> {
        // Create the decision
        const decision = await this.prisma.decisionEntry.create({
            data: {
                userId,
                title: data.title,
                date: new Date(data.date),
                context: data.context,
                decision: data.decision,
                outcome: data.outcome,
                lifeAreaId: data.lifeAreaId,
                eisenhowerTaskId: data.eisenhowerTaskId,
                priorityId: data.priorityId,
            },
        });

        // Focus Suite v2: Link to focus sessions if provided
        if (data.focusSessionIds && data.focusSessionIds.length > 0) {
            await this.prisma.decisionFocusSession.createMany({
                data: data.focusSessionIds.map((sessionId) => ({
                    decisionId: decision.id,
                    focusSessionId: sessionId,
                })),
            });
        }

        return this.getDecision(decision.id, userId) as Promise<DecisionWithRelations>;
    }

    async updateDecision(id: string, userId: string, data: UpdateDecisionDto): Promise<DecisionWithRelations> {
        // Verify ownership
        const entry = await this.prisma.decisionEntry.findFirst({
            where: { id, userId },
        });

        if (!entry) {
            throw new NotFoundException('Decision not found');
        }

        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.date !== undefined) updateData.date = new Date(data.date);
        if (data.context !== undefined) updateData.context = data.context;
        if (data.decision !== undefined) updateData.decision = data.decision;
        if (data.outcome !== undefined) updateData.outcome = data.outcome;
        // Focus Suite v2: Linkage updates
        if (data.eisenhowerTaskId !== undefined) updateData.eisenhowerTaskId = data.eisenhowerTaskId;
        if (data.priorityId !== undefined) updateData.priorityId = data.priorityId;

        await this.prisma.decisionEntry.update({
            where: { id },
            data: updateData,
        });

        return this.getDecision(id, userId) as Promise<DecisionWithRelations>;
    }

    async deleteDecision(id: string, userId: string) {
        // Verify ownership
        const entry = await this.prisma.decisionEntry.findFirst({
            where: { id, userId },
        });

        if (!entry) {
            throw new NotFoundException('Decision not found');
        }

        return this.prisma.decisionEntry.delete({
            where: { id },
        });
    }

    // ==========================================
    // Focus Suite v2: Focus Session Linkage Methods
    // ==========================================

    /**
     * Link a decision to one or more focus sessions
     */
    async linkToFocusSessions(
        id: string,
        userId: string,
        sessionIds: string[],
    ): Promise<DecisionWithRelations> {
        const decision = await this.prisma.decisionEntry.findFirst({
            where: { id, userId },
        });

        if (!decision) {
            throw new NotFoundException('Decision not found');
        }

        // Create links (skip duplicates)
        await this.prisma.decisionFocusSession.createMany({
            data: sessionIds.map((sessionId) => ({
                decisionId: id,
                focusSessionId: sessionId,
            })),
            skipDuplicates: true,
        });

        return this.getDecision(id, userId) as Promise<DecisionWithRelations>;
    }

    /**
     * Unlink a decision from one or more focus sessions
     */
    async unlinkFromFocusSessions(
        id: string,
        userId: string,
        sessionIds: string[],
    ): Promise<DecisionWithRelations> {
        const decision = await this.prisma.decisionEntry.findFirst({
            where: { id, userId },
        });

        if (!decision) {
            throw new NotFoundException('Decision not found');
        }

        await this.prisma.decisionFocusSession.deleteMany({
            where: {
                decisionId: id,
                focusSessionId: { in: sessionIds },
            },
        });

        return this.getDecision(id, userId) as Promise<DecisionWithRelations>;
    }

    /**
     * Get all decisions linked to a specific Eisenhower task
     */
    async getDecisionsByTask(userId: string, taskId: string): Promise<DecisionWithRelations[]> {
        return this.prisma.decisionEntry.findMany({
            where: {
                userId,
                eisenhowerTaskId: taskId,
            },
            orderBy: { date: 'desc' },
            include: {
                lifeArea: { select: { id: true, name: true, color: true } },
                eisenhowerTask: { select: { id: true, title: true, quadrant: true } },
                priority: { select: { id: true, title: true } },
                focusSessions: {
                    include: {
                        focusSession: { select: { id: true, startedAt: true, completed: true } },
                    },
                },
            },
        });
    }

    /**
     * Get all decisions linked to a specific focus session
     */
    async getDecisionsBySession(userId: string, sessionId: string): Promise<DecisionWithRelations[]> {
        return this.prisma.decisionEntry.findMany({
            where: {
                userId,
                focusSessions: {
                    some: { focusSessionId: sessionId },
                },
            },
            orderBy: { date: 'desc' },
            include: {
                lifeArea: { select: { id: true, name: true, color: true } },
                eisenhowerTask: { select: { id: true, title: true, quadrant: true } },
                priority: { select: { id: true, title: true } },
                focusSessions: {
                    include: {
                        focusSession: { select: { id: true, startedAt: true, completed: true } },
                    },
                },
            },
        });
    }

    /**
     * Get all decisions for a specific day
     */
    async getDecisionsForDay(userId: string, date: string): Promise<DecisionWithRelations[]> {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        return this.prisma.decisionEntry.findMany({
            where: {
                userId,
                date: {
                    gte: dayStart,
                    lte: dayEnd,
                },
            },
            orderBy: { date: 'desc' },
            include: {
                lifeArea: { select: { id: true, name: true, color: true } },
                eisenhowerTask: { select: { id: true, title: true, quadrant: true } },
                priority: { select: { id: true, title: true } },
                focusSessions: {
                    include: {
                        focusSession: { select: { id: true, startedAt: true, completed: true } },
                    },
                },
            },
        });
    }
}
