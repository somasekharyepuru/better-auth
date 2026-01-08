import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExternalBlockingService } from '../calendar/services/external-blocking.service';

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

export interface StartFromPriorityInput {
    priorityId: string;
    durationMins?: number;  // Default 25 min
    sessionType?: string;
}

export interface StartFromPriorityResponse {
    timeBlock: {
        id: string;
        title: string;
        category: string;
        startTime: string;
        endTime: string;
    };
    session: FocusSessionResponse;
}

export interface EndSessionInput {
    completed?: boolean;
    interrupted?: boolean;
}

export interface StartStandaloneInput {
    durationMins?: number;  // Default 25 min
    sessionType?: string;   // focus, shortBreak, longBreak
}

@Injectable()
export class FocusSessionService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly externalBlockingService: ExternalBlockingService,
    ) { }

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

        // Check if user already has any active session
        const activeSession = await this.prisma.focusSession.findFirst({
            where: {
                timeBlock: { day: { userId } },
                endedAt: null,
            },
        });

        if (activeSession) {
            throw new BadRequestException('You already have an active focus session');
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

    /**
     * Start a focus session from a priority
     * Creates a "Quick Focus" time block linked to the priority and starts a session on it
     */
    async startFromPriority(
        userId: string,
        input: StartFromPriorityInput,
    ): Promise<StartFromPriorityResponse> {
        // Find priority and verify ownership
        const priority = await this.prisma.topPriority.findUnique({
            where: { id: input.priorityId },
            include: { day: true },
        });

        if (!priority) {
            throw new NotFoundException('Priority not found');
        }

        if (priority.day.userId !== userId) {
            throw new UnauthorizedException('Access denied');
        }

        // Check for any active session for this user
        const activeSession = await this.prisma.focusSession.findFirst({
            where: {
                timeBlock: { day: { userId } },
                endedAt: null,
            },
        });

        if (activeSession) {
            throw new BadRequestException('You already have an active focus session');
        }

        const durationMins = input.durationMins || 25;
        const now = new Date();
        const endTime = new Date(now.getTime() + durationMins * 60 * 1000);

        // Get user's focusBlocksCalendar setting
        const userSettings = await this.prisma.userSettings.findUnique({
            where: { userId },
            select: { focusBlocksCalendar: true },
        });
        const blockCalendar = userSettings?.focusBlocksCalendar ?? true;

        // Create a Quick Focus time block linked to the priority
        const timeBlock = await this.prisma.timeBlock.create({
            data: {
                title: `Focus: ${priority.title}`,
                startTime: now,
                endTime: endTime,
                type: 'Quick Focus',
                category: 'focus',
                dayId: priority.day.id,
                priorityId: priority.id,
                blockExternalCalendars: blockCalendar,
            },
        });

        // Create blocking events on external calendars if enabled
        if (blockCalendar) {
            this.externalBlockingService.createBlockingEvents(
                userId,
                timeBlock.id,
                `Focus: ${priority.title}`,
                now,
                endTime,
            ).catch(err => console.error('Failed to create calendar blocking events:', err));
        }

        // Create the focus session
        const session = await this.prisma.focusSession.create({
            data: {
                timeBlockId: timeBlock.id,
                startedAt: now,
                sessionType: input.sessionType || 'focus',
                targetDuration: durationMins * 60, // Convert to seconds
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

        return {
            timeBlock: {
                id: timeBlock.id,
                title: timeBlock.title,
                category: timeBlock.category,
                startTime: timeBlock.startTime.toISOString(),
                endTime: timeBlock.endTime.toISOString(),
            },
            session: this.mapToResponse(session),
        };
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

    /**
     * Start a standalone pomodoro session (not linked to any priority)
     * Creates a "Pomodoro" time block and starts a session on it
     */
    async startStandalone(
        userId: string,
        input: StartStandaloneInput,
    ): Promise<StartFromPriorityResponse> {
        // Check for any active session for this user
        const activeSession = await this.prisma.focusSession.findFirst({
            where: {
                timeBlock: { day: { userId } },
                endedAt: null,
            },
        });

        if (activeSession) {
            throw new BadRequestException('You already have an active focus session');
        }

        const durationMins = input.durationMins || 25;
        const now = new Date();
        const endTime = new Date(now.getTime() + durationMins * 60 * 1000);
        const dateStr = now.toISOString().split('T')[0];

        // Get or create a day for today (no life area)
        let day = await this.prisma.day.findFirst({
            where: {
                userId,
                date: new Date(dateStr),
                lifeAreaId: null,
            },
        });

        if (!day) {
            day = await this.prisma.day.create({
                data: {
                    userId,
                    date: new Date(dateStr),
                    lifeAreaId: null,
                },
            });
        }

        // Get user's focusBlocksCalendar setting
        const userSettings = await this.prisma.userSettings.findUnique({
            where: { userId },
            select: { focusBlocksCalendar: true },
        });
        const blockCalendar = userSettings?.focusBlocksCalendar ?? true;

        // Create a Pomodoro time block (no priority linked)
        const sessionTypeLabel = input.sessionType === 'shortBreak' ? 'Short Break'
            : input.sessionType === 'longBreak' ? 'Long Break'
                : 'Focus';

        const timeBlock = await this.prisma.timeBlock.create({
            data: {
                title: `Pomodoro: ${sessionTypeLabel}`,
                startTime: now,
                endTime: endTime,
                type: 'Pomodoro',
                category: input.sessionType === 'focus' || !input.sessionType ? 'focus' : 'break',
                dayId: day.id,
                priorityId: null,
                blockExternalCalendars: blockCalendar && (input.sessionType === 'focus' || !input.sessionType),
            },
        });

        // Create blocking events on external calendars if enabled (only for focus sessions)
        if (blockCalendar && (input.sessionType === 'focus' || !input.sessionType)) {
            this.externalBlockingService.createBlockingEvents(
                userId,
                timeBlock.id,
                `Pomodoro: ${sessionTypeLabel}`,
                now,
                endTime,
            ).catch(err => console.error('Failed to create calendar blocking events:', err));
        }

        // Create the focus session
        const session = await this.prisma.focusSession.create({
            data: {
                timeBlockId: timeBlock.id,
                startedAt: now,
                sessionType: input.sessionType || 'focus',
                targetDuration: durationMins * 60,
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

        return {
            timeBlock: {
                id: timeBlock.id,
                title: timeBlock.title,
                category: timeBlock.category,
                startTime: timeBlock.startTime.toISOString(),
                endTime: timeBlock.endTime.toISOString(),
            },
            session: this.mapToResponse(session),
        };
    }
}
