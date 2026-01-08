import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface FocusSessionResponse {
    id: string;
    timeBlockId: string;
    startedAt: string;
    endedAt: string | null;
    duration: number | null;
    completed: boolean;
    interrupted: boolean;
    sessionType: string;
    targetDuration: number | null;
    createdAt: string;
    timeBlock?: {
        id: string;
        title: string;
        category: string;
        priority?: {
            id: string;
            title: string;
        } | null;
    };
}

export interface StartSessionInput {
    timeBlockId: string;
    sessionType?: string;
    targetDuration?: number;
}

export interface EndSessionInput {
    completed?: boolean;
    interrupted?: boolean;
}

@Injectable()
export class FocusSessionService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Start a new focus session linked to a time block
     */
    async startSession(
        userId: string,
        input: StartSessionInput,
    ): Promise<FocusSessionResponse> {
        // Verify ownership of the time block
        const timeBlock = await this.prisma.timeBlock.findUnique({
            where: { id: input.timeBlockId },
            include: { day: true },
        });

        if (!timeBlock) {
            throw new NotFoundException('Time block not found');
        }

        if (timeBlock.day.userId !== userId) {
            throw new UnauthorizedException('Access denied');
        }

        // Check if there's already an active session for this block
        const activeSession = await this.prisma.focusSession.findFirst({
            where: {
                timeBlockId: input.timeBlockId,
                endedAt: null,
            },
        });

        if (activeSession) {
            throw new BadRequestException('There is already an active session for this time block');
        }

        const session = await this.prisma.focusSession.create({
            data: {
                timeBlockId: input.timeBlockId,
                startedAt: new Date(),
                sessionType: input.sessionType || 'focus',
                targetDuration: input.targetDuration,
            },
            include: {
                timeBlock: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        priority: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
        });

        return this.mapToResponse(session);
    }

    /**
     * End an active focus session
     */
    async endSession(
        userId: string,
        sessionId: string,
        input: EndSessionInput,
    ): Promise<FocusSessionResponse> {
        const session = await this.prisma.focusSession.findUnique({
            where: { id: sessionId },
            include: {
                timeBlock: {
                    include: { day: true },
                },
            },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        if (session.timeBlock.day.userId !== userId) {
            throw new UnauthorizedException('Access denied');
        }

        if (session.endedAt) {
            throw new BadRequestException('Session has already ended');
        }

        const endedAt = new Date();
        const duration = Math.round(
            (endedAt.getTime() - session.startedAt.getTime()) / 1000
        );

        const updatedSession = await this.prisma.focusSession.update({
            where: { id: sessionId },
            data: {
                endedAt,
                duration,
                completed: input.completed ?? true,
                interrupted: input.interrupted ?? false,
            },
            include: {
                timeBlock: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        priority: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
        });

        return this.mapToResponse(updatedSession);
    }

    /**
     * Get the active session for a user (if any)
     */
    async getActiveSession(userId: string): Promise<FocusSessionResponse | null> {
        const session = await this.prisma.focusSession.findFirst({
            where: {
                timeBlock: {
                    day: { userId },
                },
                endedAt: null,
            },
            include: {
                timeBlock: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        priority: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
        });

        return session ? this.mapToResponse(session) : null;
    }

    /**
     * Get sessions for a specific time block
     */
    async getSessionsForTimeBlock(
        userId: string,
        timeBlockId: string,
    ): Promise<FocusSessionResponse[]> {
        const timeBlock = await this.prisma.timeBlock.findUnique({
            where: { id: timeBlockId },
            include: { day: true },
        });

        if (!timeBlock) {
            throw new NotFoundException('Time block not found');
        }

        if (timeBlock.day.userId !== userId) {
            throw new UnauthorizedException('Access denied');
        }

        const sessions = await this.prisma.focusSession.findMany({
            where: { timeBlockId },
            include: {
                timeBlock: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        priority: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
            orderBy: { startedAt: 'desc' },
        });

        return sessions.map(this.mapToResponse);
    }

    /**
     * Get session statistics for a date range
     */
    async getSessionStats(
        userId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<{
        totalSessions: number;
        completedSessions: number;
        interruptedSessions: number;
        totalFocusMinutes: number;
        averageSessionMinutes: number;
    }> {
        const sessions = await this.prisma.focusSession.findMany({
            where: {
                timeBlock: {
                    day: { userId },
                },
                startedAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                completed: true,
                interrupted: true,
                duration: true,
            },
        });

        const totalSessions = sessions.length;
        const completedSessions = sessions.filter(s => s.completed).length;
        const interruptedSessions = sessions.filter(s => s.interrupted).length;
        const totalFocusSeconds = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const totalFocusMinutes = Math.round(totalFocusSeconds / 60);
        const averageSessionMinutes = totalSessions > 0
            ? Math.round(totalFocusMinutes / totalSessions)
            : 0;

        return {
            totalSessions,
            completedSessions,
            interruptedSessions,
            totalFocusMinutes,
            averageSessionMinutes,
        };
    }

    /**
     * Get sessions for today
     */
    async getTodaySessions(userId: string): Promise<FocusSessionResponse[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const sessions = await this.prisma.focusSession.findMany({
            where: {
                timeBlock: {
                    day: { userId },
                },
                startedAt: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            include: {
                timeBlock: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        priority: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
            orderBy: { startedAt: 'desc' },
        });

        return sessions.map(this.mapToResponse);
    }

    private mapToResponse(session: any): FocusSessionResponse {
        return {
            id: session.id,
            timeBlockId: session.timeBlockId,
            startedAt: session.startedAt.toISOString(),
            endedAt: session.endedAt?.toISOString() || null,
            duration: session.duration,
            completed: session.completed,
            interrupted: session.interrupted,
            sessionType: session.sessionType,
            targetDuration: session.targetDuration,
            createdAt: session.createdAt.toISOString(),
            timeBlock: session.timeBlock,
        };
    }
}
