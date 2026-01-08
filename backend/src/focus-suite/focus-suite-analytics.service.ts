import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Focus Suite Analytics Service
 * Provides aggregated metrics for Focus Suite v2 features
 */

export interface TimeByQuadrant {
    quadrant: number;
    quadrantLabel: string;
    totalMinutes: number;
    sessionCount: number;
}

export interface TimeByLifeArea {
    lifeAreaId: string;
    lifeAreaName: string;
    lifeAreaColor: string | null;
    totalMinutes: number;
    sessionCount: number;
}

export interface WeeklyDecisionSummary {
    totalDecisions: number;
    decisionsWithOutcome: number;
    outcomeRate: number;
    decisionsByDay: { date: string; count: number }[];
}

export interface FocusSessionStats {
    totalSessions: number;
    completedSessions: number;
    interruptedSessions: number;
    totalFocusMinutes: number;
    averageSessionMinutes: number;
    completionRate: number;
}

export interface FocusSuiteAnalytics {
    timeByQuadrant: TimeByQuadrant[];
    timeByLifeArea: TimeByLifeArea[];
    weeklyDecisionSummary: WeeklyDecisionSummary;
    focusSessionStats: FocusSessionStats;
}

const QUADRANT_LABELS: Record<number, string> = {
    1: 'Q1: Urgent & Important',
    2: 'Q2: Important, Not Urgent',
    3: 'Q3: Urgent, Not Important',
    4: 'Q4: Neither',
};

@Injectable()
export class FocusSuiteAnalyticsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get time tracked per Eisenhower Matrix quadrant
     * Aggregates focus session time through: TimeBlock -> EisenhowerTask -> quadrant
     */
    async getTimeByQuadrant(
        userId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<TimeByQuadrant[]> {
        // Get all focus sessions within date range with their linked time blocks and eisenhower tasks
        const sessions = await this.prisma.focusSession.findMany({
            where: {
                startedAt: { gte: startDate, lte: endDate },
                completed: true,
                duration: { not: null },
                timeBlock: {
                    day: { userId },
                    eisenhowerTasks: { some: {} }, // Has linked eisenhower task
                },
            },
            include: {
                timeBlock: {
                    include: {
                        eisenhowerTasks: {
                            select: { quadrant: true },
                        },
                    },
                },
            },
        });

        // Aggregate by quadrant
        const quadrantMap = new Map<number, { totalSeconds: number; count: number }>();

        for (const session of sessions) {
            const tasks = session.timeBlock.eisenhowerTasks;
            if (tasks.length > 0) {
                const quadrant = tasks[0].quadrant;
                const existing = quadrantMap.get(quadrant) || { totalSeconds: 0, count: 0 };
                existing.totalSeconds += session.duration || 0;
                existing.count += 1;
                quadrantMap.set(quadrant, existing);
            }
        }

        // Convert to response format
        return [1, 2, 3, 4].map((quadrant) => {
            const data = quadrantMap.get(quadrant) || { totalSeconds: 0, count: 0 };
            return {
                quadrant,
                quadrantLabel: QUADRANT_LABELS[quadrant],
                totalMinutes: Math.round(data.totalSeconds / 60),
                sessionCount: data.count,
            };
        });
    }

    /**
     * Get time tracked per Life Area
     * Aggregates focus session time through: TimeBlock -> Day -> LifeArea
     */
    async getTimeByLifeArea(
        userId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<TimeByLifeArea[]> {
        const sessions = await this.prisma.focusSession.findMany({
            where: {
                startedAt: { gte: startDate, lte: endDate },
                completed: true,
                duration: { not: null },
                timeBlock: {
                    day: { userId },
                },
            },
            include: {
                timeBlock: {
                    include: {
                        day: {
                            include: {
                                lifeArea: true,
                            },
                        },
                    },
                },
            },
        });

        // Aggregate by life area
        const lifeAreaMap = new Map<
            string,
            { name: string; color: string | null; totalSeconds: number; count: number }
        >();

        for (const session of sessions) {
            const lifeArea = session.timeBlock.day.lifeArea;
            const lifeAreaId = lifeArea?.id || 'none';
            const existing = lifeAreaMap.get(lifeAreaId) || {
                name: lifeArea?.name || 'Unassigned',
                color: lifeArea?.color || null,
                totalSeconds: 0,
                count: 0,
            };
            existing.totalSeconds += session.duration || 0;
            existing.count += 1;
            lifeAreaMap.set(lifeAreaId, existing);
        }

        return Array.from(lifeAreaMap.entries()).map(([id, data]) => ({
            lifeAreaId: id,
            lifeAreaName: data.name,
            lifeAreaColor: data.color,
            totalMinutes: Math.round(data.totalSeconds / 60),
            sessionCount: data.count,
        }));
    }

    /**
     * Get weekly decision summary
     * Counts decisions and tracks outcome fill rate
     */
    async getWeeklyDecisionSummary(
        userId: string,
        weekStart: Date,
    ): Promise<WeeklyDecisionSummary> {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const decisions = await this.prisma.decisionEntry.findMany({
            where: {
                userId,
                date: {
                    gte: weekStart,
                    lt: weekEnd,
                },
            },
            select: {
                id: true,
                date: true,
                outcome: true,
            },
        });

        const totalDecisions = decisions.length;
        const decisionsWithOutcome = decisions.filter((d) => d.outcome && d.outcome.trim().length > 0).length;
        const outcomeRate = totalDecisions > 0 ? decisionsWithOutcome / totalDecisions : 0;

        // Group by day
        const dayMap = new Map<string, number>();
        for (const decision of decisions) {
            const dateStr = decision.date.toISOString().split('T')[0];
            dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + 1);
        }

        const decisionsByDay = Array.from(dayMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return {
            totalDecisions,
            decisionsWithOutcome,
            outcomeRate: Math.round(outcomeRate * 100) / 100,
            decisionsByDay,
        };
    }

    /**
     * Get focus session statistics for date range
     */
    async getFocusSessionStats(
        userId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<FocusSessionStats> {
        const sessions = await this.prisma.focusSession.findMany({
            where: {
                startedAt: { gte: startDate, lte: endDate },
                timeBlock: {
                    day: { userId },
                },
            },
            select: {
                completed: true,
                interrupted: true,
                duration: true,
            },
        });

        const totalSessions = sessions.length;
        const completedSessions = sessions.filter((s) => s.completed).length;
        const interruptedSessions = sessions.filter((s) => s.interrupted).length;
        const totalFocusMinutes = sessions
            .filter((s) => s.completed && s.duration)
            .reduce((acc, s) => acc + (s.duration || 0), 0) / 60;
        const averageSessionMinutes =
            completedSessions > 0 ? totalFocusMinutes / completedSessions : 0;
        const completionRate = totalSessions > 0 ? completedSessions / totalSessions : 0;

        return {
            totalSessions,
            completedSessions,
            interruptedSessions,
            totalFocusMinutes: Math.round(totalFocusMinutes),
            averageSessionMinutes: Math.round(averageSessionMinutes * 10) / 10,
            completionRate: Math.round(completionRate * 100) / 100,
        };
    }

    /**
     * Get complete Focus Suite analytics
     */
    async getFullAnalytics(
        userId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<FocusSuiteAnalytics> {
        const weekStart = new Date(startDate);
        // Adjust to week start (Monday)
        const dayOfWeek = weekStart.getDay();
        const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        weekStart.setDate(diff);

        const [timeByQuadrant, timeByLifeArea, weeklyDecisionSummary, focusSessionStats] =
            await Promise.all([
                this.getTimeByQuadrant(userId, startDate, endDate),
                this.getTimeByLifeArea(userId, startDate, endDate),
                this.getWeeklyDecisionSummary(userId, weekStart),
                this.getFocusSessionStats(userId, startDate, endDate),
            ]);

        return {
            timeByQuadrant,
            timeByLifeArea,
            weeklyDecisionSummary,
            focusSessionStats,
        };
    }
}
