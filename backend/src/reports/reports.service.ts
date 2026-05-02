import { BadRequestException, Injectable } from '@nestjs/common';
import { HabitFrequency } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface HabitReportQuery {
    from?: string;
    to?: string;
    lifeAreaId?: string;
    activeOnly: boolean;
}

interface HabitStreakQuery {
    lifeAreaId?: string;
    activeOnly: boolean;
}

interface HabitConsistencyQuery {
    from?: string;
    to?: string;
    lifeAreaId?: string;
    activeOnly: boolean;
}

interface HabitsByLifeAreaQuery {
    from?: string;
    to?: string;
    activeOnly: boolean;
}

interface HabitFailurePatternsQuery {
    from?: string;
    to?: string;
    habitId?: string;
    lifeAreaId?: string;
    activeOnly: boolean;
}

interface TimeDistributionByLifeAreaQuery {
    from?: string;
    to?: string;
}

interface PriorityCompletionQuery {
    from?: string;
    to?: string;
    lifeAreaId?: string;
}

interface FocusSessionCompletionQuery {
    from?: string;
    to?: string;
    sessionType?: string;
}

interface DeepWorkQuery {
    from?: string;
    to?: string;
}

interface FocusTrendsQuery {
    from?: string;
    to?: string;
}

interface FocusHoursQuery {
    from?: string;
    to?: string;
    category?: string;
    lifeAreaId?: string;
    type?: string;
}

interface TimeBlockCategoryQuery {
    from?: string;
    to?: string;
    lifeAreaId?: string;
    type?: string;
}

interface TimeBlockTypeQuery {
    from?: string;
    to?: string;
    lifeAreaId?: string;
}

interface CalendarVsManualQuery {
    from?: string;
    to?: string;
    lifeAreaId?: string;
}

interface DateRange {
    from: Date;
    to: Date;
}

export interface StreakSegment {
    startDate: string;
    endDate: string;
    length: number;
    brokenDate: string | null;
}

export interface FocusDayBucket {
    date: string;
    total: number;
    completed: number;
    interrupted: number;
    abandoned: number;
}

interface FocusHoursBucket {
    date: string;
    hours: number;
    blockCount: number;
}

interface DeepWorkBucket {
    date: string;
    focusMinutes: number;
    targetMinutes: number;
    sessionCount: number;
}

interface InterruptionBucket {
    count: number;
}

interface FocusProductivityBucket {
    count: number;
    completedCount: number;
    interruptedCount: number;
    completedMinutes: number;
}

export interface CategorySummaryItem {
    category: string;
    hours: number;
    blockCount: number;
    percentage: number;
    previousHours: number | null;
    change: number | null;
}

export interface TimeBlockTypeSummaryItem {
    type: string;
    name: string;
    color: string;
    icon: string | null;
    hours: number;
    blockCount: number;
    percentage: number;
    previousHours: number | null;
    change: number | null;
}

interface CalendarVsManualBucket {
    week: string;
    manualHours: number;
    calendarHours: number;
    totalHours: number;
    manualPercentage: number;
}

interface ScheduleDensityBucket {
    date: string;
    hours: number;
    blockCount: number;
}

interface FocusTrendWeekBucket {
    week: string;
    totalSessions: number;
    completedSessions: number;
    deepWorkMinutes: number;
}

function toDateOnlyString(date: Date): string {
    return date.toISOString().split('T')[0];
}

function parseDateOnly(value: string): Date {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException(`Invalid date: ${value}. Expected YYYY-MM-DD`);
    }
    return parsed;
}

function addUtcDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
}

function daysInclusive(from: Date, to: Date): number {
    const ms = to.getTime() - from.getTime();
    return Math.floor(ms / 86400000) + 1;
}

function clampRate(value: number): number {
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
}

function round(value: number, decimals: number): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

function isDueOn(
    habit: { frequency: HabitFrequency; frequencyDays: number[] },
    date: Date,
): boolean {
    if (habit.frequency === 'DAILY') return true;
    if (habit.frequency === 'WEEKLY') {
        return habit.frequencyDays.includes(date.getUTCDay());
    }
    return true;
}

function calculateStreaks(
    habit: { frequency: HabitFrequency; frequencyDays: number[] },
    completedDateKeys: string[],
): { currentStreak: number; bestStreak: number } {
    const completed = new Set(completedDateKeys);
    if (completed.size === 0) return { currentStreak: 0, bestStreak: 0 };

    const sorted = [...completed].sort();
    const today = parseDateOnly(toDateOnlyString(new Date()));

    let cursor = new Date(today);
    if (isDueOn(habit, cursor) && !completed.has(toDateOnlyString(cursor))) {
        cursor = addUtcDays(cursor, -1);
    }

    let current = 0;
    while (true) {
        const key = toDateOnlyString(cursor);
        if (isDueOn(habit, cursor)) {
            if (completed.has(key)) {
                current += 1;
            } else {
                break;
            }
        }

        if (key < sorted[0]) break;
        cursor = addUtcDays(cursor, -1);
    }

    let best = 0;
    let run = 0;
    let scan = parseDateOnly(sorted[0]);
    while (scan <= today) {
        const key = toDateOnlyString(scan);
        if (isDueOn(habit, scan)) {
            if (completed.has(key)) {
                run += 1;
                if (run > best) best = run;
            } else {
                run = 0;
            }
        }
        scan = addUtcDays(scan, 1);
    }

    return { currentStreak: current, bestStreak: Math.max(best, current) };
}

function calculateStreakReport(
    habit: { frequency: HabitFrequency; frequencyDays: number[] },
    completedDateKeys: string[],
): {
    currentStreak: number;
    bestStreak: number;
    lastBrokenDate: string | null;
    daysToBeatBest: number;
    history: StreakSegment[];
} {
    const completed = new Set(completedDateKeys);
    if (completed.size === 0) {
        return {
            currentStreak: 0,
            bestStreak: 0,
            lastBrokenDate: null,
            daysToBeatBest: 0,
            history: [],
        };
    }

    const sorted = [...completed].sort();
    const today = parseDateOnly(toDateOnlyString(new Date()));
    const earliest = parseDateOnly(sorted[0]);

    let cursor = new Date(earliest);
    const history: StreakSegment[] = [];
    let lastBrokenDate: string | null = null;
    let inRun = false;
    let runStart = '';
    let runLen = 0;
    let lastDueKey = toDateOnlyString(earliest);

    while (cursor <= today) {
        if (!isDueOn(habit, cursor)) {
            cursor = addUtcDays(cursor, 1);
            continue;
        }

        const key = toDateOnlyString(cursor);
        lastDueKey = key;

        if (completed.has(key)) {
            if (!inRun) {
                inRun = true;
                runStart = key;
                runLen = 0;
            }
            runLen += 1;
        } else if (inRun) {
            history.push({
                startDate: runStart,
                endDate: toDateOnlyString(addUtcDays(cursor, -1)),
                length: runLen,
                brokenDate: key,
            });
            lastBrokenDate = key;
            inRun = false;
            runLen = 0;
            runStart = '';
        }

        cursor = addUtcDays(cursor, 1);
    }

    if (inRun) {
        history.push({
            startDate: runStart,
            endDate: lastDueKey,
            length: runLen,
            brokenDate: null,
        });
    }

    const bestStreak = history.reduce((max, segment) => Math.max(max, segment.length), 0);
    const currentStreak = inRun ? runLen : 0;

    return {
        currentStreak,
        bestStreak: Math.max(bestStreak, currentStreak),
        lastBrokenDate,
        daysToBeatBest: Math.max(bestStreak - currentStreak, 0),
        history: history.reverse(),
    };
}

function startOfWeekMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getUTCDay();
    const offset = (day + 6) % 7;
    d.setUTCDate(d.getUTCDate() - offset);
    return d;
}

function endOfWeekSunday(date: Date): Date {
    const d = startOfWeekMonday(date);
    d.setUTCDate(d.getUTCDate() + 6);
    return d;
}

function startOfMonth(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function overlapDays(fromA: Date, toA: Date, fromB: Date, toB: Date): number {
    const start = fromA > fromB ? fromA : fromB;
    const end = toA < toB ? toA : toB;
    if (start > end) return 0;
    return daysInclusive(start, end);
}

function isWorkingDay(date: Date): boolean {
    const day = date.getUTCDay();
    return day >= 1 && day <= 5;
}

function minutesBetween(start: Date, end: Date): number {
    return Math.max(Math.round((end.getTime() - start.getTime()) / 60000), 0);
}

function secondsToMinutes(seconds: number): number {
    return seconds / 60;
}

function buildDateRange(from: Date, to: Date): string[] {
    const dates: string[] = [];
    let cursor = new Date(from);
    while (cursor <= to) {
        dates.push(toDateOnlyString(cursor));
        cursor = addUtcDays(cursor, 1);
    }
    return dates;
}

function calculateExpectedCompletions(
    habit: {
        frequency: HabitFrequency;
        frequencyDays: number[];
        targetCount: number | null;
    },
    range: DateRange,
): number {
    if (range.to < range.from) return 0;

    if (habit.frequency === 'DAILY') {
        return daysInclusive(range.from, range.to);
    }

    if (habit.frequency === 'WEEKLY') {
        let expected = 0;
        let cursor = new Date(range.from);
        while (cursor <= range.to) {
            if (habit.frequencyDays.includes(cursor.getUTCDay())) {
                expected += 1;
            }
            cursor = addUtcDays(cursor, 1);
        }
        return expected;
    }

    const target = habit.targetCount ?? 0;
    if (target <= 0) return 0;

    if (habit.frequency === 'X_PER_WEEK') {
        let expected = 0;
        let weekStart = startOfWeekMonday(range.from);

        while (weekStart <= range.to) {
            const weekEnd = addUtcDays(weekStart, 6);
            const overlap = overlapDays(range.from, range.to, weekStart, weekEnd);
            if (overlap > 0) {
                expected += target * (overlap / 7);
            }
            weekStart = addUtcDays(weekStart, 7);
        }

        return expected;
    }

    let expected = 0;
    let monthCursor = startOfMonth(range.from);
    while (monthCursor <= range.to) {
        const monthEnd = endOfMonth(monthCursor);
        const overlap = overlapDays(range.from, range.to, monthCursor, monthEnd);
        if (overlap > 0) {
            const daysInMonth = daysInclusive(monthCursor, monthEnd);
            expected += target * (overlap / daysInMonth);
        }
        monthCursor = new Date(
            Date.UTC(monthCursor.getUTCFullYear(), monthCursor.getUTCMonth() + 1, 1),
        );
    }

    return expected;
}

@Injectable()
export class ReportsService {
    constructor(private readonly prisma: PrismaService) {}

    async getPriorityCompletionReport(userId: string, query: PriorityCompletionQuery) {
        const range = this.resolveDateRange(query.from, query.to);
        const dateKeys = buildDateRange(range.from, range.to);

        const days = await this.prisma.day.findMany({
            where: {
                userId,
                date: {
                    gte: range.from,
                    lte: range.to,
                },
                ...(query.lifeAreaId ? { lifeAreaId: query.lifeAreaId } : {}),
            },
            select: {
                date: true,
                priorities: {
                    select: {
                        completed: true,
                    },
                },
            },
            orderBy: { date: 'asc' },
        });

        const byDate = new Map<string, { set: number; completed: number }>(
            dateKeys.map((date) => [date, { set: 0, completed: 0 }]),
        );

        for (const day of days) {
            const key = toDateOnlyString(day.date);
            const bucket = byDate.get(key);
            if (!bucket) continue;

            bucket.set += day.priorities.length;
            bucket.completed += day.priorities.filter((priority) => priority.completed).length;
        }

        const daily = dateKeys.map((date) => {
            const bucket = byDate.get(date)!;
            return {
                date,
                set: bucket.set,
                completed: bucket.completed,
                rate: bucket.set > 0 ? round(bucket.completed / bucket.set, 4) : null,
            };
        });

        const daysWithPriorities = daily.filter((day) => day.set > 0);
        const totalSet = daysWithPriorities.reduce((sum, day) => sum + day.set, 0);
        const totalCompleted = daysWithPriorities.reduce((sum, day) => sum + day.completed, 0);

        const avgRate = totalSet > 0 ? round(totalCompleted / totalSet, 4) : null;

        const rollingAvg = (window: number) => {
            const slice = daily.slice(-window).filter((day) => day.rate !== null);
            if (slice.length === 0) return null;
            return round(slice.reduce((sum, day) => sum + (day.rate ?? 0), 0) / slice.length, 4);
        };

        const bestCandidates = daily
            .filter((day) => day.rate === 1)
            .sort((a, b) => (a.date < b.date ? 1 : -1));
        const bestDay = bestCandidates[0] ?? null;

        let currentStreak = 0;
        let worstStreak = 0;
        for (const day of daily) {
            if (day.rate !== null && day.rate < 0.5) {
                currentStreak += 1;
                worstStreak = Math.max(worstStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }

        return {
            days: daily,
            summary: {
                avgRate,
                rolling7DayAvg: rollingAvg(7),
                rolling30DayAvg: rollingAvg(30),
                bestDay,
                worstStreak,
            },
            range: {
                from: toDateOnlyString(range.from),
                to: toDateOnlyString(range.to),
            },
        };
    }

    async getTimeDistributionByLifeAreaReport(
        userId: string,
        query: TimeDistributionByLifeAreaQuery,
    ) {
        const range = this.resolveDateRange(query.from, query.to);

        const blocks = await this.prisma.timeBlock.findMany({
            where: {
                day: {
                    userId,
                    date: {
                        gte: range.from,
                        lte: range.to,
                    },
                },
            },
            select: {
                startTime: true,
                endTime: true,
                day: {
                    select: {
                        lifeAreaId: true,
                    },
                },
            },
            orderBy: { startTime: 'asc' },
        });

        const areaIds = [
            ...new Set(
                blocks
                    .map((block) => block.day.lifeAreaId)
                    .filter((lifeAreaId): lifeAreaId is string => Boolean(lifeAreaId)),
            ),
        ];

        const lifeAreas = areaIds.length
            ? await this.prisma.lifeArea.findMany({
                  where: {
                      userId,
                      id: { in: areaIds },
                  },
                  select: {
                      id: true,
                      name: true,
                      color: true,
                  },
              })
            : [];
        const lifeAreaMap = new Map(lifeAreas.map((area) => [area.id, area]));

        const grouped = new Map<
            string,
            {
                lifeAreaId: string | null;
                name: string;
                color: string;
                hours: number;
                blockCount: number;
            }
        >();

        for (const block of blocks) {
            const lifeAreaId = block.day.lifeAreaId;
            const key = lifeAreaId ?? 'unassigned';
            const metadata = lifeAreaId ? lifeAreaMap.get(lifeAreaId) : null;

            if (!grouped.has(key)) {
                grouped.set(key, {
                    lifeAreaId,
                    name: metadata?.name ?? 'Unassigned',
                    color: metadata?.color ?? '#9CA3AF',
                    hours: 0,
                    blockCount: 0,
                });
            }

            const durationHours = (block.endTime.getTime() - block.startTime.getTime()) / 3_600_000;
            const bucket = grouped.get(key)!;
            bucket.hours += durationHours;
            bucket.blockCount += 1;
        }

        const totalHours = round(
            [...grouped.values()].reduce((sum, bucket) => sum + bucket.hours, 0),
            2,
        );

        const areas = [...grouped.values()]
            .map((bucket) => ({
                lifeAreaId: bucket.lifeAreaId,
                name: bucket.name,
                color: bucket.color,
                hours: round(bucket.hours, 2),
                blockCount: bucket.blockCount,
                percentage: totalHours > 0 ? round(bucket.hours / totalHours, 4) : 0,
            }))
            .sort((a, b) => b.hours - a.hours);

        const unassigned = areas.find((area) => area.lifeAreaId === null);

        return {
            areas,
            summary: {
                totalHours,
                unassignedHours: unassigned?.hours ?? 0,
                areaCount: areas.filter((area) => area.lifeAreaId !== null).length,
                topLifeArea: areas.find((area) => area.lifeAreaId !== null) ?? null,
            },
            range: {
                from: toDateOnlyString(range.from),
                to: toDateOnlyString(range.to),
            },
        };
    }

    async getHabitFailurePatternsReport(userId: string, query: HabitFailurePatternsQuery) {
        const range = this.resolveDateRange(query.from, query.to);

        const habits = await this.prisma.habit.findMany({
            where: {
                userId,
                isArchived: false,
                ...(query.activeOnly ? { isActive: true } : {}),
                ...(query.habitId ? { id: query.habitId } : {}),
                ...(query.lifeAreaId ? { lifeAreaId: query.lifeAreaId } : {}),
            },
            include: {
                logs: {
                    where: {
                        date: {
                            gte: range.from,
                            lte: range.to,
                        },
                    },
                    select: {
                        date: true,
                        completed: true,
                    },
                },
            },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });

        const days = Array.from({ length: 7 }, (_, dayOfWeek) => ({
            dayOfWeek,
            label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
            expected: 0,
            completed: 0,
            skipped: 0,
            skipRate: null as number | null,
        }));

        for (const habit of habits) {
            const completedKeys = new Set(
                habit.logs.filter((log) => log.completed).map((log) => toDateOnlyString(log.date)),
            );

            let cursor = new Date(range.from);
            while (cursor <= range.to) {
                if (!isDueOn(habit, cursor)) {
                    cursor = addUtcDays(cursor, 1);
                    continue;
                }

                const dayOfWeek = cursor.getUTCDay();
                const key = toDateOnlyString(cursor);
                const bucket = days[dayOfWeek];
                bucket.expected += 1;
                if (completedKeys.has(key)) {
                    bucket.completed += 1;
                }

                cursor = addUtcDays(cursor, 1);
            }
        }

        const finalizedDays = days.map((bucket) => {
            const skipped = Math.max(bucket.expected - bucket.completed, 0);
            return {
                ...bucket,
                skipped,
                skipRate: bucket.expected > 0 ? round(skipped / bucket.expected, 4) : null,
            };
        });

        const ranked = finalizedDays.filter((day) => day.skipRate !== null);
        ranked.sort((a, b) => {
            if ((b.skipRate ?? -1) !== (a.skipRate ?? -1)) {
                return (b.skipRate ?? -1) - (a.skipRate ?? -1);
            }
            return b.expected - a.expected;
        });

        return {
            days: finalizedDays,
            summary: {
                habitCount: habits.length,
                mostSkippedDay: ranked[0] ?? null,
                safestDay: ranked[ranked.length - 1] ?? null,
            },
            range: {
                from: toDateOnlyString(range.from),
                to: toDateOnlyString(range.to),
            },
        };
    }

    async getHabitsByLifeAreaReport(userId: string, query: HabitsByLifeAreaQuery) {
        const range = this.resolveDateRange(query.from, query.to);

        const habits = await this.prisma.habit.findMany({
            where: {
                userId,
                isArchived: false,
                ...(query.activeOnly ? { isActive: true } : {}),
            },
            include: {
                logs: {
                    where: {
                        date: {
                            gte: range.from,
                            lte: range.to,
                        },
                    },
                    select: {
                        date: true,
                        completed: true,
                    },
                },
            },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });

        const areaIds = [
            ...new Set(habits.map((habit) => habit.lifeAreaId).filter(Boolean)),
        ] as string[];
        const lifeAreas = areaIds.length
            ? await this.prisma.lifeArea.findMany({
                  where: {
                      userId,
                      id: { in: areaIds },
                  },
                  select: {
                      id: true,
                      name: true,
                      color: true,
                  },
              })
            : [];

        const lifeAreaMap = new Map(lifeAreas.map((area) => [area.id, area]));

        const grouped = new Map<
            string,
            {
                lifeAreaId: string | null;
                name: string;
                color: string;
                habitCount: number;
                completionRates: number[];
            }
        >();

        for (const habit of habits) {
            const key = habit.lifeAreaId ?? 'unassigned';
            const area = habit.lifeAreaId ? lifeAreaMap.get(habit.lifeAreaId) : null;

            if (!grouped.has(key)) {
                grouped.set(key, {
                    lifeAreaId: habit.lifeAreaId,
                    name: area?.name ?? 'Unassigned',
                    color: area?.color ?? '#9CA3AF',
                    habitCount: 0,
                    completionRates: [],
                });
            }

            const completed = habit.logs.filter((log) => log.completed).length;
            const expected = calculateExpectedCompletions(habit, range);
            const completionRate = expected > 0 ? clampRate(completed / expected) : null;

            const bucket = grouped.get(key)!;
            bucket.habitCount += 1;
            if (completionRate !== null) {
                bucket.completionRates.push(completionRate);
            }
        }

        const areas = [...grouped.values()]
            .map((bucket) => ({
                lifeAreaId: bucket.lifeAreaId,
                name: bucket.name,
                color: bucket.color,
                habitCount: bucket.habitCount,
                averageCompletionRate:
                    bucket.completionRates.length > 0
                        ? round(
                              bucket.completionRates.reduce((sum, rate) => sum + rate, 0) /
                                  bucket.completionRates.length,
                              4,
                          )
                        : null,
            }))
            .sort((a, b) => (b.averageCompletionRate ?? -1) - (a.averageCompletionRate ?? -1));

        const ranked = areas.filter((area) => area.averageCompletionRate !== null);

        return {
            areas,
            summary: {
                areaCount: areas.length,
                bestLifeArea: ranked[0] ?? null,
                neglectedLifeArea: ranked[ranked.length - 1] ?? null,
            },
            range: {
                from: toDateOnlyString(range.from),
                to: toDateOnlyString(range.to),
            },
        };
    }

    async getHabitConsistencyReport(userId: string, query: HabitConsistencyQuery) {
        const range = this.resolveDateRange(query.from, query.to);

        const habits = await this.prisma.habit.findMany({
            where: {
                userId,
                isArchived: false,
                ...(query.activeOnly ? { isActive: true } : {}),
                ...(query.lifeAreaId ? { lifeAreaId: query.lifeAreaId } : {}),
            },
            include: {
                logs: {
                    where: {
                        date: {
                            gte: range.from,
                            lte: range.to,
                        },
                    },
                    select: {
                        date: true,
                        completed: true,
                    },
                },
            },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });

        const habitsReport = habits.map((habit) => {
            const completedInRange = habit.logs.filter((log) => log.completed).length;
            const expectedInRange = calculateExpectedCompletions(habit, range);
            const baseScore = expectedInRange > 0 ? (completedInRange / expectedInRange) * 100 : 0;

            const completedKeys = habit.logs
                .filter((log) => log.completed)
                .map((log) => toDateOnlyString(log.date));
            const { currentStreak } = calculateStreaks(habit, completedKeys);

            let streakBonus = 0;
            if (currentStreak > 14) {
                streakBonus = 10;
            } else if (currentStreak > 7) {
                streakBonus = 5;
            }

            const score = round(Math.min(baseScore + streakBonus, 100), 2);

            return {
                id: habit.id,
                name: habit.name,
                emoji: habit.emoji,
                color: habit.color,
                expected: round(expectedInRange, 2),
                completed: completedInRange,
                currentStreak,
                streakBonus,
                score,
            };
        });

        const ranked = [...habitsReport].sort((a, b) => b.score - a.score);
        const averageScore =
            habitsReport.length > 0
                ? round(
                      habitsReport.reduce((sum, habit) => sum + habit.score, 0) /
                          habitsReport.length,
                      2,
                  )
                : null;

        return {
            habits: habitsReport,
            summary: {
                averageScore,
                bestHabit: ranked[0] ?? null,
                worstHabit: ranked[ranked.length - 1] ?? null,
            },
            range: {
                from: toDateOnlyString(range.from),
                to: toDateOnlyString(range.to),
            },
        };
    }

    async getTotalDeepWorkTimeReport(userId: string, query: DeepWorkQuery) {
        const range = this.resolveDateRange(query.from, query.to);
        const dateKeys = buildDateRange(range.from, range.to);

        const sessions = await this.prisma.focusSession.findMany({
            where: {
                completed: true,
                startedAt: {
                    gte: range.from,
                    lte: range.to,
                },
                timeBlock: {
                    day: { userId },
                },
            },
            select: {
                startedAt: true,
                endedAt: true,
                duration: true,
                targetDuration: true,
            },
            orderBy: { startedAt: 'asc' },
        });

        const buckets = new Map<string, DeepWorkBucket>(
            dateKeys.map((date) => [
                date,
                { date, focusMinutes: 0, targetMinutes: 0, sessionCount: 0 },
            ]),
        );

        for (const session of sessions) {
            const key = toDateOnlyString(session.startedAt);
            const bucket = buckets.get(key);
            if (!bucket) continue;

            const focusMinutes =
                session.duration !== null && session.duration !== undefined
                    ? secondsToMinutes(session.duration)
                    : session.endedAt
                      ? minutesBetween(session.startedAt, session.endedAt)
                      : 0;
            bucket.focusMinutes += focusMinutes;
            bucket.targetMinutes +=
                session.targetDuration !== null && session.targetDuration !== undefined
                    ? secondsToMinutes(session.targetDuration)
                    : 0;
            bucket.sessionCount += 1;
        }

        const periods = [...buckets.values()].map((bucket) => ({
            date: bucket.date,
            focusMinutes: round(bucket.focusMinutes, 2),
            targetMinutes: round(bucket.targetMinutes, 2),
            sessionCount: bucket.sessionCount,
        }));

        const totalFocusMinutes = round(
            periods.reduce((sum, period) => sum + period.focusMinutes, 0),
            2,
        );
        const totalTargetMinutes = round(
            periods.reduce((sum, period) => sum + period.targetMinutes, 0),
            2,
        );
        const averageSessionLength =
            sessions.length > 0 ? round(totalFocusMinutes / sessions.length, 2) : null;
        const efficiencyRate =
            totalTargetMinutes > 0 ? round(totalFocusMinutes / totalTargetMinutes, 4) : null;

        const previousRange = {
            to: addUtcDays(range.from, -1),
            from: addUtcDays(range.from, -daysInclusive(range.from, range.to)),
        };

        const previousSessions = await this.prisma.focusSession.findMany({
            where: {
                completed: true,
                startedAt: {
                    gte: previousRange.from,
                    lte: previousRange.to,
                },
                timeBlock: {
                    day: { userId },
                },
            },
            select: {
                startedAt: true,
                endedAt: true,
                duration: true,
            },
        });

        const previousFocusMinutes = round(
            previousSessions.reduce((sum, session) => {
                const focusMinutes =
                    session.duration !== null && session.duration !== undefined
                        ? secondsToMinutes(session.duration)
                        : session.endedAt
                          ? minutesBetween(session.startedAt, session.endedAt)
                          : 0;
                return sum + focusMinutes;
            }, 0),
            2,
        );

        const trend =
            previousFocusMinutes > 0
                ? {
                      previousFocusMinutes,
                      change: round(
                          (totalFocusMinutes - previousFocusMinutes) / previousFocusMinutes,
                          4,
                      ),
                  }
                : null;

        const peakDay = periods.reduce<{
            date: string | null;
            focusMinutes: number;
            targetMinutes: number;
            sessionCount: number;
        }>((current, period) => (period.focusMinutes > current.focusMinutes ? period : current), {
            date: null,
            focusMinutes: 0,
            targetMinutes: 0,
            sessionCount: 0,
        });

        return {
            periods,
            summary: {
                totalFocusMinutes,
                totalTargetMinutes,
                averageSessionLength,
                efficiencyRate,
                completedSessions: sessions.length,
                peakDay: peakDay.date ? peakDay : null,
                trend,
            },
            range: {
                from: toDateOnlyString(range.from),
                to: toDateOnlyString(range.to),
            },
        };
    }

    async getInterruptionFrequencyReport(userId: string, query: { from?: string; to?: string }) {
        const range = this.resolveDateRange(query.from, query.to);

        const sessions = await this.prisma.focusSession.findMany({
            where: {
                interrupted: true,
                startedAt: {
                    gte: range.from,
                    lte: range.to,
                },
                timeBlock: {
                    day: { userId },
                },
            },
            select: {
                startedAt: true,
                endedAt: true,
            },
            orderBy: { startedAt: 'asc' },
        });

        const byHour = Array.from({ length: 24 }, (_, hour) => ({
            hour,
            interruptions: 0,
        }));
        const byDay = Array.from({ length: 7 }, (_, dayOfWeek) => ({
            dayOfWeek,
            label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
            interruptions: 0,
        }));
        const heatmap = Array.from({ length: 7 }, (_, dayOfWeek) =>
            Array.from({ length: 24 }, (_, hour) => ({
                dayOfWeek,
                hour,
                interruptions: 0,
            })),
        ).flat();

        let totalInterruptedMinutes = 0;

        for (const session of sessions) {
            const hour = session.startedAt.getUTCHours();
            const dayOfWeek = session.startedAt.getUTCDay();
            const durationMinutes = session.endedAt
                ? minutesBetween(session.startedAt, session.endedAt)
                : 0;

            byHour[hour].interruptions += 1;
            byDay[dayOfWeek].interruptions += 1;
            heatmap[dayOfWeek * 24 + hour].interruptions += 1;
            totalInterruptedMinutes += durationMinutes;
        }

        const averageTimeBeforeInterruptionMinutes =
            sessions.length > 0 ? round(totalInterruptedMinutes / sessions.length, 2) : null;

        const peakHour = byHour.reduce<{
            hour: number | null;
            interruptions: number;
        }>(
            (current, bucket) =>
                bucket.interruptions > current.interruptions
                    ? { hour: bucket.hour, interruptions: bucket.interruptions }
                    : current,
            { hour: null, interruptions: 0 },
        );

        const peakDay = byDay.reduce<{
            dayOfWeek: number | null;
            label: string | null;
            interruptions: number;
        }>(
            (current, bucket) =>
                bucket.interruptions > current.interruptions
                    ? {
                          dayOfWeek: bucket.dayOfWeek,
                          label: bucket.label,
                          interruptions: bucket.interruptions,
                      }
                    : current,
            { dayOfWeek: null, label: null, interruptions: 0 },
        );

        const previousRange = {
            to: addUtcDays(range.from, -1),
            from: addUtcDays(range.from, -daysInclusive(range.from, range.to)),
        };

        const previousSessions = await this.prisma.focusSession.findMany({
            where: {
                interrupted: true,
                startedAt: {
                    gte: previousRange.from,
                    lte: previousRange.to,
                },
                timeBlock: {
                    day: { userId },
                },
            },
            select: { startedAt: true },
        });

        const trend =
            previousSessions.length > 0
                ? {
                      previousInterruptions: previousSessions.length,
                      change: round(
                          (sessions.length - previousSessions.length) / previousSessions.length,
                          4,
                      ),
                  }
                : null;

        return {
            interruptionsByHour: byHour,
            interruptionsByDay: byDay,
            heatmap,
            summary: {
                totalInterruptions: sessions.length,
                averageTimeBeforeInterruptionMinutes,
                peakHour: peakHour.hour !== null ? peakHour : null,
                peakDay: peakDay.dayOfWeek !== null ? peakDay : null,
                trend,
            },
            range: {
                from: toDateOnlyString(range.from),
                to: toDateOnlyString(range.to),
            },
        };
    }

    async getBestFocusTimesReport(userId: string, query: { from?: string; to?: string }) {
        const range = this.resolveDateRange(query.from, query.to);

        const sessions = await this.prisma.focusSession.findMany({
            where: {
                startedAt: {
                    gte: range.from,
                    lte: range.to,
                },
                timeBlock: {
                    day: { userId },
                },
            },
            select: {
                startedAt: true,
                endedAt: true,
                duration: true,
                completed: true,
                interrupted: true,
            },
            orderBy: { startedAt: 'asc' },
        });

        const hourBuckets = Array.from({ length: 24 }, (_, hour) => ({
            hour,
            count: 0,
            completedCount: 0,
            interruptedCount: 0,
            completedMinutes: 0,
        }));
        const dayBuckets = Array.from({ length: 7 }, (_, dayOfWeek) => ({
            dayOfWeek,
            label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
            count: 0,
            completedCount: 0,
            interruptedCount: 0,
            completedMinutes: 0,
        }));

        for (const session of sessions) {
            const hour = session.startedAt.getUTCHours();
            const dayOfWeek = session.startedAt.getUTCDay();
            const durationMinutes =
                session.completed && session.duration !== null && session.duration !== undefined
                    ? secondsToMinutes(session.duration)
                    : session.completed && session.endedAt
                      ? minutesBetween(session.startedAt, session.endedAt)
                      : 0;

            const hourBucket = hourBuckets[hour];
            hourBucket.count += 1;
            if (session.completed) {
                hourBucket.completedCount += 1;
                hourBucket.completedMinutes += durationMinutes;
            }
            if (session.interrupted) {
                hourBucket.interruptedCount += 1;
            }

            const dayBucket = dayBuckets[dayOfWeek];
            dayBucket.count += 1;
            if (session.completed) {
                dayBucket.completedCount += 1;
                dayBucket.completedMinutes += durationMinutes;
            }
            if (session.interrupted) {
                dayBucket.interruptedCount += 1;
            }
        }

        const hours = hourBuckets.map((bucket) => {
            const completionRate = bucket.count > 0 ? bucket.completedCount / bucket.count : 0;
            const avgDurationMinutes =
                bucket.completedCount > 0 ? bucket.completedMinutes / bucket.completedCount : 0;
            const productivityScore = round(completionRate * avgDurationMinutes, 4);

            return {
                hour: bucket.hour,
                count: bucket.count,
                completedCount: bucket.completedCount,
                interruptedCount: bucket.interruptedCount,
                completionRate: round(completionRate, 4),
                avgDurationMinutes: round(avgDurationMinutes, 2),
                productivityScore,
            };
        });

        const days = dayBuckets.map((bucket) => {
            const interruptionRate = bucket.count > 0 ? bucket.interruptedCount / bucket.count : 0;
            const completionRate = bucket.count > 0 ? bucket.completedCount / bucket.count : 0;
            const avgDurationMinutes =
                bucket.completedCount > 0 ? bucket.completedMinutes / bucket.completedCount : 0;
            const productivityScore = round(completionRate * avgDurationMinutes, 4);

            return {
                dayOfWeek: bucket.dayOfWeek,
                label: bucket.label,
                count: bucket.count,
                completedCount: bucket.completedCount,
                interruptedCount: bucket.interruptedCount,
                interruptionRate: round(interruptionRate, 4),
                completionRate: round(completionRate, 4),
                avgDurationMinutes: round(avgDurationMinutes, 2),
                productivityScore,
            };
        });

        const heatmap = Array.from({ length: 7 }, (_, dayOfWeek) =>
            Array.from({ length: 24 }, (_, hour) => {
                const sessionsInCell = sessions.filter(
                    (session) =>
                        session.startedAt.getUTCDay() === dayOfWeek &&
                        session.startedAt.getUTCHours() === hour,
                );
                const completedCount = sessionsInCell.filter((session) => session.completed).length;
                const completedMinutes = sessionsInCell.reduce((sum, session) => {
                    if (!session.completed) return sum;
                    const durationMinutes =
                        session.duration !== null && session.duration !== undefined
                            ? secondsToMinutes(session.duration)
                            : session.endedAt
                              ? minutesBetween(session.startedAt, session.endedAt)
                              : 0;
                    return sum + durationMinutes;
                }, 0);
                const completionRate =
                    sessionsInCell.length > 0 ? completedCount / sessionsInCell.length : 0;
                const avgDurationMinutes =
                    completedCount > 0 ? completedMinutes / completedCount : 0;

                return {
                    dayOfWeek,
                    hour,
                    sessions: sessionsInCell.length,
                    completionRate: round(completionRate, 4),
                    avgDurationMinutes: round(avgDurationMinutes, 2),
                    productivityScore: round(completionRate * avgDurationMinutes, 4),
                };
            }),
        ).flat();

        const rankedHours = [...hours]
            .filter((hour) => hour.count > 0)
            .sort((a, b) => b.productivityScore - a.productivityScore);
        const rankedDays = [...days]
            .filter((day) => day.count > 0)
            .sort((a, b) => a.interruptionRate - b.interruptionRate);
        const bestDay = rankedDays[0] ?? null;

        return {
            hours,
            days,
            heatmap,
            summary: {
                bestHour: rankedHours[0] ?? null,
                worstHour: rankedHours[rankedHours.length - 1] ?? null,
                bestDay: bestDay,
                topHours: rankedHours.slice(0, 3),
                worstHours: [...rankedHours].slice(-3).reverse(),
            },
            range: {
                from: toDateOnlyString(range.from),
                to: toDateOnlyString(range.to),
            },
        };
    }

    async getFocusTrendsReport(userId: string, query: FocusTrendsQuery) {
        const range = this.resolveDateRange(query.from, query.to);

        const sessions = await this.prisma.focusSession.findMany({
            where: {
                startedAt: {
                    gte: range.from,
                    lte: range.to,
                },
                timeBlock: {
                    day: { userId },
                },
            },
            select: {
                startedAt: true,
                completed: true,
                endedAt: true,
                duration: true,
            },
            orderBy: { startedAt: 'asc' },
        });

        const buckets = new Map<string, FocusTrendWeekBucket>();
        let weekCursor = startOfWeekMonday(range.from);
        while (weekCursor <= range.to) {
            const key = toDateOnlyString(weekCursor);
            buckets.set(key, {
                week: key,
                totalSessions: 0,
                completedSessions: 0,
                deepWorkMinutes: 0,
            });
            weekCursor = addUtcDays(weekCursor, 7);
        }

        for (const session of sessions) {
            const week = toDateOnlyString(startOfWeekMonday(session.startedAt));
            const bucket = buckets.get(week);
            if (!bucket) continue;

            bucket.totalSessions += 1;
            if (session.completed) {
                bucket.completedSessions += 1;
            }

            const minutes =
                session.duration !== null && session.duration !== undefined
                    ? secondsToMinutes(session.duration)
                    : session.endedAt
                      ? minutesBetween(session.startedAt, session.endedAt)
                      : 0;
            bucket.deepWorkMinutes += minutes;
        }

        const weeks = [...buckets.values()].map((bucket) => ({
            week: bucket.week,
            totalSessions: bucket.totalSessions,
            completedSessions: bucket.completedSessions,
            deepWorkMinutes: round(bucket.deepWorkMinutes, 2),
            completionRate:
                bucket.totalSessions > 0
                    ? round(bucket.completedSessions / bucket.totalSessions, 4)
                    : null,
        }));

        const totalSessions = weeks.reduce((sum, week) => sum + week.totalSessions, 0);
        const totalCompletedSessions = weeks.reduce((sum, week) => sum + week.completedSessions, 0);
        const totalDeepWorkMinutes = round(
            weeks.reduce((sum, week) => sum + week.deepWorkMinutes, 0),
            2,
        );

        const currentWeek = weeks[weeks.length - 1] ?? null;
        const previousWeek = weeks.length > 1 ? weeks[weeks.length - 2] : null;

        const wow =
            currentWeek && previousWeek
                ? {
                      sessions:
                          previousWeek.totalSessions > 0
                              ? round(
                                    (currentWeek.totalSessions - previousWeek.totalSessions) /
                                        previousWeek.totalSessions,
                                    4,
                                )
                              : null,
                      completedSessions:
                          previousWeek.completedSessions > 0
                              ? round(
                                    (currentWeek.completedSessions -
                                        previousWeek.completedSessions) /
                                        previousWeek.completedSessions,
                                    4,
                                )
                              : null,
                      deepWorkMinutes:
                          previousWeek.deepWorkMinutes > 0
                              ? round(
                                    (currentWeek.deepWorkMinutes - previousWeek.deepWorkMinutes) /
                                        previousWeek.deepWorkMinutes,
                                    4,
                                )
                              : null,
                  }
                : null;

        return {
            weeks,
            summary: {
                totalSessions,
                totalCompletedSessions,
                totalDeepWorkMinutes,
                completionRate:
                    totalSessions > 0 ? round(totalCompletedSessions / totalSessions, 4) : null,
                wow,
            },
            range: {
                from: toDateOnlyString(range.from),
                to: toDateOnlyString(range.to),
            },
        };
    }

    async getCalendarVsManualBlocksReport(userId: string, query: CalendarVsManualQuery) {
        const range = this.resolveDateRange(query.from, query.to);

        const blocks = await this.prisma.timeBlock.findMany({
            where: {
                day: {
                    userId,
                    date: {
                        gte: range.from,
                        lte: range.to,
                    },
                    ...(query.lifeAreaId ? { lifeAreaId: query.lifeAreaId } : {}),
                },
            },
            select: {
                isFromCalendar: true,
                startTime: true,
                endTime: true,
                day: {
                    select: {
                        date: true,
                    },
                },
            },
            orderBy: { startTime: 'asc' },
        });

        const buckets = new Map<string, CalendarVsManualBucket>();
        let weekCursor = startOfWeekMonday(range.from);
        while (weekCursor <= range.to) {
            const key = toDateOnlyString(weekCursor);
            buckets.set(key, {
                week: key,
                manualHours: 0,
                calendarHours: 0,
                totalHours: 0,
                manualPercentage: 0,
            });
            weekCursor = addUtcDays(weekCursor, 7);
        }

        for (const block of blocks) {
            const durationHours = (block.endTime.getTime() - block.startTime.getTime()) / 3_600_000;
            const weekKey = toDateOnlyString(startOfWeekMonday(block.day.date));
            const bucket = buckets.get(weekKey);
            if (!bucket) continue;

            bucket.totalHours += durationHours;
            if (block.isFromCalendar) {
                bucket.calendarHours += durationHours;
            } else {
                bucket.manualHours += durationHours;
            }
        }

        const periods = [...buckets.values()].map((bucket) => ({
            week: bucket.week,
            manualHours: round(bucket.manualHours, 2),
            calendarHours: round(bucket.calendarHours, 2),
            totalHours: round(bucket.totalHours, 2),
            manualPercentage:
                bucket.totalHours > 0 ? round(bucket.manualHours / bucket.totalHours, 4) : 0,
        }));

        const totalManualHours = round(
            periods.reduce((sum, period) => sum + period.manualHours, 0),
            2,
        );
        const totalCalendarHours = round(
            periods.reduce((sum, period) => sum + period.calendarHours, 0),
            2,
        );
        const totalHours = round(totalManualHours + totalCalendarHours, 2);
        const manualPercentage = totalHours > 0 ? round(totalManualHours / totalHours, 4) : null;

        const previousRange = {
            to: addUtcDays(range.from, -1),
            from: addUtcDays(range.from, -daysInclusive(range.from, range.to)),
        };

        const previousBlocks = await this.prisma.timeBlock.findMany({
            where: {
                day: {
                    userId,
                    date: {
                        gte: previousRange.from,
                        lte: previousRange.to,
                    },
                    ...(query.lifeAreaId ? { lifeAreaId: query.lifeAreaId } : {}),
                },
            },
            select: {
                isFromCalendar: true,
                startTime: true,
                endTime: true,
            },
        });

        const previousManualHours = round(
            previousBlocks
                .filter((block) => !block.isFromCalendar)
                .reduce(
                    (sum, block) =>
                        sum + (block.endTime.getTime() - block.startTime.getTime()) / 3_600_000,
                    0,
                ),
            2,
        );
        const previousTotalHours = round(
            previousBlocks.reduce(
                (sum, block) =>
                    sum + (block.endTime.getTime() - block.startTime.getTime()) / 3_600_000,
                0,
            ),
            2,
        );
        const previousManualPercentage =
            previousTotalHours > 0 ? round(previousManualHours / previousTotalHours, 4) : null;

        const trend =
            manualPercentage !== null && previousManualPercentage !== null
                ? {
                      previousManualPercentage,
                      change: round(manualPercentage - previousManualPercentage, 4),
                  }
                : null;

        return {
            periods,
            summary: {
                totalHours,
                totalManualHours,
                totalCalendarHours,
                manualPercentage,
                calendarPercentage:
                    totalHours > 0 ? round(totalCalendarHours / totalHours, 4) : null,
                trend,
            },
            range: {
                from: toDateOnlyString(range.from),
                to: toDateOnlyString(range.to),
            },
        };
    }

    async getTimeBlockTypeDistribution(userId: string, query: TimeBlockTypeQuery) {
        const range = this.resolveDateRange(query.from, query.to);

        const [blocks, typeMetadata] = await Promise.all([
            this.prisma.timeBlock.findMany({
                where: {
                    day: {
                        userId,
                        date: {
                            gte: range.from,
                            lte: range.to,
                        },
                        ...(query.lifeAreaId ? { lifeAreaId: query.lifeAreaId } : {}),
                    },
                },
                select: {
                    type: true,
                    startTime: true,
                    endTime: true,
                },
                orderBy: { startTime: 'asc' },
            }),
            this.prisma.timeBlockType.findMany({
                where: { userId },
                select: {
                    name: true,
                    color: true,
                    icon: true,
                    isActive: true,
                },
                orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
            }),
        ]);

        const metadataByName = new Map(typeMetadata.map((type) => [type.name, type]));

        const currentTotals = new Map<string, { hours: number; blockCount: number }>();
        for (const block of blocks) {
            const hours = (block.endTime.getTime() - block.startTime.getTime()) / 3_600_000;
            const existing = currentTotals.get(block.type) ?? { hours: 0, blockCount: 0 };
            existing.hours += hours;
            existing.blockCount += 1;
            currentTotals.set(block.type, existing);
        }

        const previousRange = {
            to: addUtcDays(range.from, -1),
            from: addUtcDays(range.from, -daysInclusive(range.from, range.to)),
        };

        const previousBlocks = await this.prisma.timeBlock.findMany({
            where: {
                day: {
                    userId,
                    date: {
                        gte: previousRange.from,
                        lte: previousRange.to,
                    },
                    ...(query.lifeAreaId ? { lifeAreaId: query.lifeAreaId } : {}),
                },
            },
            select: {
                type: true,
                startTime: true,
                endTime: true,
            },
        });

        const previousTotals = new Map<string, number>();
        for (const block of previousBlocks) {
            const hours = (block.endTime.getTime() - block.startTime.getTime()) / 3_600_000;
            previousTotals.set(block.type, (previousTotals.get(block.type) ?? 0) + hours);
        }

        const totalHours = round(
            [...currentTotals.values()].reduce((sum, item) => sum + item.hours, 0),
            2,
        );

        const types: TimeBlockTypeSummaryItem[] = [...currentTotals.entries()]
            .map(([type, totals]) => {
                const metadata = metadataByName.get(type);
                const previousHours = previousTotals.get(type) ?? null;
                const change =
                    previousHours !== null && previousHours > 0
                        ? round((totals.hours - previousHours) / previousHours, 4)
                        : null;

                return {
                    type,
                    name: metadata?.name ?? type,
                    color: metadata?.color ?? '#6366F1',
                    icon: metadata?.icon ?? null,
                    hours: round(totals.hours, 2),
                    blockCount: totals.blockCount,
                    percentage: totalHours > 0 ? round(totals.hours / totalHours, 4) : 0,
                    previousHours: previousHours !== null ? round(previousHours, 2) : null,
                    change,
                };
            })
            .sort((a, b) => b.hours - a.hours);

        const positiveTypes = types.filter((type) => type.hours > 0);
        const mostUsedType = positiveTypes[0] ?? null;
        const leastUsedType = positiveTypes[positiveTypes.length - 1] ?? null;

        const focusHours = round(
            types
                .filter((type) => type.type === 'focus' || type.name === 'Deep Work')
                .reduce((sum, type) => sum + type.hours, 0),
            2,
        );

        return {
            types,
            summary: {
                totalHours,
                typeCount: types.length,
                focusHours,
                focusRatio: totalHours > 0 ? round(focusHours / totalHours, 4) : null,
                mostUsedType,
                leastUsedType,
            },
            range: {
                from: toDateOnlyString(range.from),
                to: toDateOnlyString(range.to),
            },
        };
    }

    async getScheduleDensityReport(userId: string, query: { from?: string; to?: string }) {
        const range = this.resolveDateRange(query.from, query.to);
        const dateKeys = buildDateRange(range.from, range.to);

        const blocks = await this.prisma.timeBlock.findMany({
            where: {
                day: {
                    userId,
                    date: {
                        gte: range.from,
                        lte: range.to,
                    },
                },
            },
            select: {
                startTime: true,
                endTime: true,
                day: {
                    select: {
                        date: true,
                    },
                },
            },
            orderBy: { startTime: 'asc' },
        });

        const buckets = new Map<string, ScheduleDensityBucket>(
            dateKeys.map((date) => [date, { date, hours: 0, blockCount: 0 }]),
        );

        for (const block of blocks) {
            const key = toDateOnlyString(block.day.date);
            const bucket = buckets.get(key);
            if (!bucket) continue;

            bucket.hours += (block.endTime.getTime() - block.startTime.getTime()) / 3_600_000;
            bucket.blockCount += 1;
        }

        const periods = [...buckets.values()].map((bucket) => ({
            date: bucket.date,
            hours: round(bucket.hours, 2),
            blockCount: bucket.blockCount,
        }));

        const totalHours = round(
            periods.reduce((sum, period) => sum + period.hours, 0),
            2,
        );
        const averageHoursPerDay =
            periods.length > 0 ? round(totalHours / periods.length, 2) : null;

        const overScheduledDays = periods.filter((period) => period.hours > 8).length;
        const underScheduledDays = periods.filter(
            (period) => isWorkingDay(parseDateOnly(period.date)) && period.hours < 2,
        ).length;
        const idealRangeDays = periods.filter(
            (period) => period.hours >= 4 && period.hours <= 7,
        ).length;

        const peakDay = periods.reduce<{
            date: string | null;
            hours: number;
            blockCount: number;
        }>((current, period) => (period.hours > current.hours ? period : current), {
            date: null,
            hours: 0,
            blockCount: 0,
        });

        const troughDay = periods.reduce<{
            date: string | null;
            hours: number;
            blockCount: number;
        }>(
            (current, period) => {
                if (current.date === null) return period;
                if (period.hours < current.hours) return period;
                return current;
            },
            { date: null, hours: Number.POSITIVE_INFINITY, blockCount: 0 },
        );

        return {
            periods,
            summary: {
                totalHours,
                averageHoursPerDay,
                overScheduledDays,
                underScheduledDays,
                idealRangeDays,
                peakDay: peakDay.date ? peakDay : null,
                troughDay: troughDay.date ? troughDay : null,
            },
            range: {
                from: toDateOnlyString(range.from),
                to: toDateOnlyString(range.to),
            },
        };
    }

    async getTimeBlockCategoryBreakdown(userId: string, query: TimeBlockCategoryQuery) {
        const range = this.resolveDateRange(query.from, query.to);

        const blocks = await this.prisma.timeBlock.findMany({
            where: {
                ...(query.type ? { type: query.type } : {}),
                day: {
                    userId,
                    date: {
                        gte: range.from,
                        lte: range.to,
                    },
                    ...(query.lifeAreaId ? { lifeAreaId: query.lifeAreaId } : {}),
                },
            },
            select: {
                category: true,
                startTime: true,
                endTime: true,
            },
            orderBy: { startTime: 'asc' },
        });

        const currentTotals = new Map<string, { hours: number; blockCount: number }>();
        for (const block of blocks) {
            const hours = (block.endTime.getTime() - block.startTime.getTime()) / 3_600_000;
            const existing = currentTotals.get(block.category) ?? { hours: 0, blockCount: 0 };
            existing.hours += hours;
            existing.blockCount += 1;
            currentTotals.set(block.category, existing);
        }

        const previousRange = {
            to: addUtcDays(range.from, -1),
            from: addUtcDays(range.from, -daysInclusive(range.from, range.to)),
        };

        const previousBlocks = await this.prisma.timeBlock.findMany({
            where: {
                ...(query.type ? { type: query.type } : {}),
                day: {
                    userId,
                    date: {
                        gte: previousRange.from,
                        lte: previousRange.to,
                    },
                    ...(query.lifeAreaId ? { lifeAreaId: query.lifeAreaId } : {}),
                },
            },
            select: {
                category: true,
                startTime: true,
                endTime: true,
            },
        });

        const previousTotals = new Map<string, number>();
        for (const block of previousBlocks) {
            const hours = (block.endTime.getTime() - block.startTime.getTime()) / 3_600_000;
            previousTotals.set(block.category, (previousTotals.get(block.category) ?? 0) + hours);
        }

        const totalHours = round(
            [...currentTotals.values()].reduce((sum, item) => sum + item.hours, 0),
            2,
        );
        const focusHours = round(currentTotals.get('focus')?.hours ?? 0, 2);

        const categories: CategorySummaryItem[] = [...currentTotals.entries()]
            .map(([category, totals]) => {
                const previousHours = previousTotals.get(category) ?? null;
                const change =
                    previousHours !== null && previousHours > 0
                        ? round((totals.hours - previousHours) / previousHours, 4)
                        : null;

                return {
                    category,
                    hours: round(totals.hours, 2),
                    blockCount: totals.blockCount,
                    percentage: totalHours > 0 ? round(totals.hours / totalHours, 4) : 0,
                    previousHours: previousHours !== null ? round(previousHours, 2) : null,
                    change,
                };
            })
            .sort((a, b) => b.hours - a.hours);

        const focusRatio = totalHours > 0 ? round(focusHours / totalHours, 4) : null;
        const peakCategory = categories[0] ?? null;

        return {
            categories,
            summary: {
                totalHours,
                focusHours,
                focusRatio,
                categoryCount: categories.length,
                peakCategory,
            },
            range: {
                from: toDateOnlyString(range.from),
                to: toDateOnlyString(range.to),
            },
        };
    }

    async getFocusHoursReport(userId: string, query: FocusHoursQuery) {
        const range = this.resolveDateRange(query.from, query.to);
        const dateKeys = buildDateRange(range.from, range.to);
        const category = query.category ?? 'focus';

        const blocks = await this.prisma.timeBlock.findMany({
            where: {
                category,
                ...(query.type ? { type: query.type } : {}),
                day: {
                    userId,
                    date: {
                        gte: range.from,
                        lte: range.to,
                    },
                    ...(query.lifeAreaId ? { lifeAreaId: query.lifeAreaId } : {}),
                },
            },
            select: {
                startTime: true,
                endTime: true,
                day: {
                    select: {
                        date: true,
                    },
                },
            },
            orderBy: { startTime: 'asc' },
        });

        const buckets = new Map<string, FocusHoursBucket>(
            dateKeys.map((date) => [date, { date, hours: 0, blockCount: 0 }]),
        );

        for (const block of blocks) {
            const key = toDateOnlyString(block.day.date);
            const bucket = buckets.get(key);
            if (!bucket) continue;

            const hours = (block.endTime.getTime() - block.startTime.getTime()) / 3_600_000;
            bucket.hours += hours;
            bucket.blockCount += 1;
        }

        const periods = [...buckets.values()].map((bucket) => ({
            date: bucket.date,
            hours: round(bucket.hours, 2),
            blockCount: bucket.blockCount,
        }));

        const totalHours = round(
            periods.reduce((sum, period) => sum + period.hours, 0),
            2,
        );
        const activeDays = periods.filter((period) => period.blockCount > 0).length;
        const avgPerDay = activeDays > 0 ? round(totalHours / activeDays, 2) : null;

        const peak = periods.reduce<{
            date: string | null;
            hours: number;
            blockCount: number;
        }>(
            (current, period) => {
                if (period.hours > current.hours) {
                    return period.hours > 0
                        ? { date: period.date, hours: period.hours, blockCount: period.blockCount }
                        : current;
                }
                return current;
            },
            { date: null, hours: 0, blockCount: 0 },
        );

        const previousRange = {
            to: addUtcDays(range.from, -1),
            from: addUtcDays(range.from, -daysInclusive(range.from, range.to)),
        };

        const previousBlocks = await this.prisma.timeBlock.findMany({
            where: {
                category,
                ...(query.type ? { type: query.type } : {}),
                day: {
                    userId,
                    date: {
                        gte: previousRange.from,
                        lte: previousRange.to,
                    },
                    ...(query.lifeAreaId ? { lifeAreaId: query.lifeAreaId } : {}),
                },
            },
            select: {
                startTime: true,
                endTime: true,
            },
        });

        const previousHours = round(
            previousBlocks.reduce(
                (sum, block) =>
                    sum + (block.endTime.getTime() - block.startTime.getTime()) / 3_600_000,
                0,
            ),
            2,
        );

        const trend =
            previousHours > 0
                ? {
                      previousHours,
                      change: round((totalHours - previousHours) / previousHours, 4),
                  }
                : null;

        return {
            periods,
            summary: {
                totalHours,
                avgPerDay,
                activeDays,
                peak: peak.date ? peak : null,
                trend,
            },
            range: {
                from: toDateOnlyString(range.from),
                to: toDateOnlyString(range.to),
            },
        };
    }

    async getFocusSessionCompletionReport(userId: string, query: FocusSessionCompletionQuery) {
        const range = this.resolveDateRange(query.from, query.to);
        const dateKeys = buildDateRange(range.from, range.to);

        const sessions = await this.prisma.focusSession.findMany({
            where: {
                startedAt: {
                    gte: range.from,
                    lte: range.to,
                },
                ...(query.sessionType ? { sessionType: query.sessionType } : {}),
                timeBlock: {
                    day: { userId },
                },
            },
            select: {
                startedAt: true,
                completed: true,
                interrupted: true,
            },
            orderBy: { startedAt: 'asc' },
        });

        const buckets = new Map<string, FocusDayBucket>(
            dateKeys.map((date) => [
                date,
                { date, total: 0, completed: 0, interrupted: 0, abandoned: 0 },
            ]),
        );

        for (const session of sessions) {
            const date = toDateOnlyString(session.startedAt);
            const bucket = buckets.get(date);
            if (!bucket) continue;

            bucket.total += 1;
            if (session.completed) {
                bucket.completed += 1;
            } else if (session.interrupted) {
                bucket.interrupted += 1;
            } else {
                bucket.abandoned += 1;
            }
        }

        const days = [...buckets.values()];
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter((session) => session.completed).length;
        const interruptedSessions = sessions.filter(
            (session) => !session.completed && session.interrupted,
        ).length;
        const abandonedSessions = sessions.filter(
            (session) => !session.completed && !session.interrupted,
        ).length;

        const completionRate =
            totalSessions > 0 ? round(completedSessions / totalSessions, 4) : null;
        const interruptionRate =
            totalSessions > 0 ? round(interruptedSessions / totalSessions, 4) : null;
        const abandonedRate =
            totalSessions > 0 ? round(abandonedSessions / totalSessions, 4) : null;

        const rankedDays = days.filter((day) => day.total > 0);
        rankedDays.sort((a, b) => {
            const rateA = a.total > 0 ? a.completed / a.total : -1;
            const rateB = b.total > 0 ? b.completed / b.total : -1;
            if (rateB !== rateA) return rateB - rateA;
            return b.total - a.total;
        });

        const bestDay = rankedDays[0]
            ? {
                  date: rankedDays[0].date,
                  completionRate: round(rankedDays[0].completed / rankedDays[0].total, 4),
                  total: rankedDays[0].total,
              }
            : null;

        const worstDay = rankedDays[rankedDays.length - 1]
            ? {
                  date: rankedDays[rankedDays.length - 1].date,
                  completionRate: round(
                      rankedDays[rankedDays.length - 1].completed /
                          rankedDays[rankedDays.length - 1].total,
                      4,
                  ),
                  total: rankedDays[rankedDays.length - 1].total,
              }
            : null;

        return {
            days,
            summary: {
                completionRate,
                interruptionRate,
                abandonedRate,
                totalSessions,
                bestDay,
                worstDay,
            },
            range: {
                from: toDateOnlyString(range.from),
                to: toDateOnlyString(range.to),
            },
        };
    }

    async getHabitStreaksReport(userId: string, query: HabitStreakQuery) {
        const habits = await this.prisma.habit.findMany({
            where: {
                userId,
                isArchived: false,
                ...(query.activeOnly ? { isActive: true } : {}),
                ...(query.lifeAreaId ? { lifeAreaId: query.lifeAreaId } : {}),
            },
            include: {
                logs: {
                    where: { completed: true },
                    select: { date: true },
                    orderBy: { date: 'asc' },
                },
            },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });

        const habitsReport = habits.map((habit) => {
            const completedKeys = habit.logs.map((log) => toDateOnlyString(log.date));
            const streaks = calculateStreakReport(habit, completedKeys);

            return {
                id: habit.id,
                name: habit.name,
                emoji: habit.emoji,
                color: habit.color,
                currentStreak: streaks.currentStreak,
                bestStreak: streaks.bestStreak,
                lastBrokenDate: streaks.lastBrokenDate,
                daysToBeatBest: streaks.daysToBeatBest,
                history: streaks.history,
            };
        });

        const currentStreaks = habitsReport.map((habit) => habit.currentStreak);
        const bestStreaks = habitsReport.map((habit) => habit.bestStreak);

        return {
            habits: habitsReport,
            summary: {
                totalHabits: habitsReport.length,
                activeStreaks: habitsReport.filter((habit) => habit.currentStreak > 0).length,
                averageCurrentStreak:
                    currentStreaks.length > 0
                        ? round(
                              currentStreaks.reduce((sum, value) => sum + value, 0) /
                                  currentStreaks.length,
                              2,
                          )
                        : 0,
                averageBestStreak:
                    bestStreaks.length > 0
                        ? round(
                              bestStreaks.reduce((sum, value) => sum + value, 0) /
                                  bestStreaks.length,
                              2,
                          )
                        : 0,
            },
        };
    }

    async getHabitCompletionReport(userId: string, query: HabitReportQuery) {
        const currentRange = this.resolveDateRange(query.from, query.to);
        const periodLength = daysInclusive(currentRange.from, currentRange.to);
        const previousRange = {
            to: addUtcDays(currentRange.from, -1),
            from: addUtcDays(currentRange.from, -periodLength),
        };

        const habits = await this.prisma.habit.findMany({
            where: {
                userId,
                isArchived: false,
                ...(query.activeOnly ? { isActive: true } : {}),
                ...(query.lifeAreaId ? { lifeAreaId: query.lifeAreaId } : {}),
            },
            include: {
                logs: {
                    select: {
                        date: true,
                        completed: true,
                    },
                },
            },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });

        const habitsReport = habits.map((habit) => {
            const completedKeys = habit.logs
                .filter((log) => log.completed)
                .map((log) => toDateOnlyString(log.date));

            const completedCurrent = habit.logs.filter((log) => {
                if (!log.completed) return false;
                return log.date >= currentRange.from && log.date <= currentRange.to;
            }).length;

            const expectedCurrent = calculateExpectedCompletions(habit, currentRange);
            const completionRate =
                expectedCurrent > 0
                    ? round(clampRate(completedCurrent / expectedCurrent), 4)
                    : null;

            const completedPrevious = habit.logs.filter((log) => {
                if (!log.completed) return false;
                return log.date >= previousRange.from && log.date <= previousRange.to;
            }).length;

            const expectedPrevious = calculateExpectedCompletions(habit, previousRange);
            const previousRate =
                expectedPrevious > 0 ? clampRate(completedPrevious / expectedPrevious) : null;

            const trend =
                completionRate !== null && previousRate !== null
                    ? round(completionRate - previousRate, 4)
                    : null;

            const streaks = calculateStreaks(habit, completedKeys);

            return {
                id: habit.id,
                name: habit.name,
                emoji: habit.emoji,
                color: habit.color,
                completionRate,
                expected: round(expectedCurrent, 2),
                completed: completedCurrent,
                currentStreak: streaks.currentStreak,
                bestStreak: streaks.bestStreak,
                trend,
            };
        });

        const totalExpected = habitsReport.reduce((sum, habit) => sum + habit.expected, 0);
        const totalCompleted = habitsReport.reduce((sum, habit) => sum + habit.completed, 0);
        const overallRate =
            totalExpected > 0 ? round(clampRate(totalCompleted / totalExpected), 4) : null;

        const ranked = habitsReport.filter((habit) => habit.completionRate !== null);
        const sorted = [...ranked].sort(
            (a, b) => (b.completionRate ?? 0) - (a.completionRate ?? 0),
        );

        return {
            habits: habitsReport,
            summary: {
                overallRate,
                bestHabit: sorted[0]
                    ? {
                          id: sorted[0].id,
                          name: sorted[0].name,
                          completionRate: sorted[0].completionRate,
                      }
                    : null,
                worstHabit: sorted[sorted.length - 1]
                    ? {
                          id: sorted[sorted.length - 1].id,
                          name: sorted[sorted.length - 1].name,
                          completionRate: sorted[sorted.length - 1].completionRate,
                      }
                    : null,
            },
            range: {
                from: toDateOnlyString(currentRange.from),
                to: toDateOnlyString(currentRange.to),
            },
        };
    }

    async getCarriedForwardReport(
        userId: string,
        query: { from?: string; to?: string; minCarryCount?: string },
    ) {
        const range = this.resolveDateRange(query.from, query.to);
        const minCarryCount = query.minCarryCount ? parseInt(query.minCarryCount, 10) : 0;

        const priorities = await this.prisma.topPriority.findMany({
            where: {
                day: { userId, date: { gte: range.from, lte: range.to } },
                carriedToDate: { not: null },
            },
            select: {
                id: true,
                title: true,
                completed: true,
                carriedToDate: true,
                createdAt: true,
                day: { select: { date: true } },
            },
            orderBy: { carriedToDate: 'asc' },
        });

        const titleGroups = new Map<
            string,
            { title: string; carryCount: number; completed: boolean; lastCarriedDate: Date | null }
        >();

        for (const p of priorities) {
            const key = p.title.toLowerCase().trim();
            const existing = titleGroups.get(key);
            if (existing) {
                existing.carryCount += 1;
                if (p.completed) existing.completed = true;
                if (
                    p.carriedToDate &&
                    (!existing.lastCarriedDate || p.carriedToDate > existing.lastCarriedDate)
                ) {
                    existing.lastCarriedDate = p.carriedToDate;
                }
            } else {
                titleGroups.set(key, {
                    title: p.title,
                    carryCount: 1,
                    completed: p.completed,
                    lastCarriedDate: p.carriedToDate,
                });
            }
        }

        let items = [...titleGroups.values()]
            .filter((item) => item.carryCount >= minCarryCount)
            .map((item) => ({
                title: item.title,
                carryCount: item.carryCount,
                completed: item.completed,
                lastCarriedDate: item.lastCarriedDate
                    ? toDateOnlyString(item.lastCarriedDate)
                    : null,
            }))
            .sort((a, b) => b.carryCount - a.carryCount);

        const totalCarryEvents = priorities.length;
        const eventuallyCompleted = items.filter((item) => item.completed).length;
        const eventuallyCompletedRate =
            items.length > 0 ? round(eventuallyCompleted / items.length, 4) : null;

        items = items.slice(0, 10);

        return {
            items,
            summary: { totalCarryEvents, eventuallyCompletedRate },
            range: { from: toDateOnlyString(range.from), to: toDateOnlyString(range.to) },
        };
    }

    async getPriorityThroughputReport(
        userId: string,
        query: { from?: string; to?: string; lifeAreaId?: string },
    ) {
        const range = this.resolveDateRange(query.from, query.to);

        const days = await this.prisma.day.findMany({
            where: {
                userId,
                date: { gte: range.from, lte: range.to },
                ...(query.lifeAreaId ? { lifeAreaId: query.lifeAreaId } : {}),
            },
            select: {
                date: true,
                priorities: { select: { completed: true } },
            },
            orderBy: { date: 'asc' },
        });

        const dateKeys = buildDateRange(range.from, range.to);
        const weeklyBuckets = new Map<string, { week: string; set: number; completed: number }>();

        let weekCursor = startOfWeekMonday(range.from);
        while (weekCursor <= range.to) {
            const key = toDateOnlyString(weekCursor);
            weeklyBuckets.set(key, { week: key, set: 0, completed: 0 });
            weekCursor = addUtcDays(weekCursor, 7);
        }

        const daily = dateKeys.map((date) => {
            const day = days.find((d) => toDateOnlyString(d.date) === date);
            const set = day?.priorities.length ?? 0;
            const completed = day?.priorities.filter((p) => p.completed).length ?? 0;
            return { date, set, completed };
        });

        for (const day of daily) {
            const weekKey = toDateOnlyString(startOfWeekMonday(parseDateOnly(day.date)));
            const bucket = weeklyBuckets.get(weekKey);
            if (bucket) {
                bucket.set += day.set;
                bucket.completed += day.completed;
            }
        }

        const weeks = [...weeklyBuckets.values()].map((bucket) => ({
            week: bucket.week,
            set: bucket.set,
            completed: bucket.completed,
            throughputRatio: bucket.set > 0 ? round(bucket.completed / bucket.set, 4) : null,
        }));

        const activeDays = daily.filter((d) => d.set > 0);
        const totalSet = daily.reduce((s, d) => s + d.set, 0);
        const totalCompleted = daily.reduce((s, d) => s + d.completed, 0);
        const avgSetPerDay = activeDays.length > 0 ? round(totalSet / activeDays.length, 2) : null;
        const avgCompletedPerDay =
            activeDays.length > 0 ? round(totalCompleted / activeDays.length, 2) : null;
        const throughputRatio = totalSet > 0 ? round(totalCompleted / totalSet, 4) : null;

        const userSettings = await this.prisma.userSettings.findUnique({
            where: { userId },
            select: { maxTopPriorities: true },
        });

        const maxPriorities = userSettings?.maxTopPriorities ?? 5;
        const overPlanningDays = daily.filter((d) => d.set > maxPriorities).length;

        return {
            daily,
            weeks,
            summary: {
                avgSetPerDay,
                avgCompletedPerDay,
                throughputRatio,
                overPlanningDays,
                maxPriorities,
            },
            range: { from: toDateOnlyString(range.from), to: toDateOnlyString(range.to) },
        };
    }

    async getDailyReviewTrendsReport(userId: string, query: { from?: string; to?: string }) {
        const range = this.resolveDateRange(query.from, query.to);
        const dateKeys = buildDateRange(range.from, range.to);

        const days = await this.prisma.day.findMany({
            where: { userId, date: { gte: range.from, lte: range.to } },
            select: {
                date: true,
                dailyReview: {
                    select: { wentWell: true, didntGoWell: true, createdAt: true },
                },
            },
            orderBy: { date: 'asc' },
        });

        const daily = dateKeys.map((date) => {
            const day = days.find((d) => toDateOnlyString(d.date) === date);
            const review = day?.dailyReview;
            return {
                date,
                hasReview: !!review,
                wentWellLength: review?.wentWell?.length ?? 0,
                didntGoWellLength: review?.didntGoWell?.length ?? 0,
                totalLength: (review?.wentWell?.length ?? 0) + (review?.didntGoWell?.length ?? 0),
            };
        });

        const reviews = days.filter((d) => d.dailyReview).map((d) => d.dailyReview!);

        const completionRate = daily.length > 0 ? round(reviews.length / daily.length, 4) : null;

        let reviewStreak = 0;
        let currentStreak = 0;
        for (const day of daily) {
            if (day.hasReview) {
                currentStreak += 1;
                reviewStreak = Math.max(reviewStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }

        const avgReviewLength =
            reviews.length > 0
                ? round(
                      reviews.reduce(
                          (sum, r) =>
                              sum + (r.wentWell?.length ?? 0) + (r.didntGoWell?.length ?? 0),
                          0,
                      ) / reviews.length,
                      2,
                  )
                : null;

        const STOP_WORDS = new Set([
            'the',
            'a',
            'an',
            'and',
            'or',
            'but',
            'in',
            'on',
            'at',
            'to',
            'for',
            'of',
            'with',
            'by',
            'from',
            'is',
            'was',
            'are',
            'were',
            'be',
            'been',
            'being',
            'have',
            'has',
            'had',
            'do',
            'does',
            'did',
            'will',
            'would',
            'could',
            'should',
            'may',
            'might',
            'shall',
            'can',
            'it',
            'its',
            'this',
            'that',
            'these',
            'those',
            'i',
            'my',
            'me',
            'we',
            'our',
            'you',
            'your',
            'he',
            'she',
            'they',
            'them',
            'his',
            'her',
            'their',
            'not',
            'no',
            'so',
            'if',
            'as',
            'up',
            'out',
            'just',
            'about',
            'also',
            'then',
            'than',
            'very',
            'too',
            'really',
            'all',
            'some',
            'any',
            'each',
            'every',
            'much',
            'more',
            'most',
            'other',
            'got',
            'get',
            'go',
            'went',
            'going',
            'make',
            'made',
            'take',
            'took',
            'come',
            'came',
        ]);

        function tokenize(text: string | null): string[] {
            if (!text) return [];
            return text
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, ' ')
                .split(/\s+/)
                .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
        }

        const wentWellFreq = new Map<string, number>();
        const didntGoWellFreq = new Map<string, number>();

        for (const review of reviews) {
            for (const word of tokenize(review.wentWell)) {
                wentWellFreq.set(word, (wentWellFreq.get(word) ?? 0) + 1);
            }
            for (const word of tokenize(review.didntGoWell)) {
                didntGoWellFreq.set(word, (didntGoWellFreq.get(word) ?? 0) + 1);
            }
        }

        const topWords = (freq: Map<string, number>, limit: number) =>
            [...freq.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .map(([word, count]) => ({ word, count }));

        return {
            daily,
            summary: {
                completionRate,
                reviewStreak,
                avgReviewLength,
                totalReviews: reviews.length,
                totalDays: daily.length,
            },
            wordFrequency: {
                wentWell: topWords(wentWellFreq, 20),
                didntGoWell: topWords(didntGoWellFreq, 20),
            },
            range: { from: toDateOnlyString(range.from), to: toDateOnlyString(range.to) },
        };
    }

    async getDaysWithoutReviewReport(userId: string, query: { from?: string; to?: string }) {
        const range = this.resolveDateRange(query.from, query.to);
        const dateKeys = buildDateRange(range.from, range.to);

        const reviewDays = await this.prisma.dailyReview.findMany({
            where: {
                day: { userId, date: { gte: range.from, lte: range.to } },
            },
            select: { day: { select: { date: true } } },
        });

        const reviewedDates = new Set(reviewDays.map((r) => toDateOnlyString(r.day.date)));

        const daily = dateKeys.map((date) => ({
            date,
            reviewed: reviewedDates.has(date),
        }));

        const daysWithReview = daily.filter((d) => d.reviewed).length;
        const daysWithoutReview = daily.length - daysWithReview;

        let longestGap = 0;
        let currentGap = 0;
        for (const day of daily) {
            if (!day.reviewed) {
                currentGap += 1;
                longestGap = Math.max(longestGap, currentGap);
            } else {
                currentGap = 0;
            }
        }

        let currentGapDays = 0;
        for (let i = daily.length - 1; i >= 0; i--) {
            if (!daily[i].reviewed) {
                currentGapDays += 1;
            } else {
                break;
            }
        }

        const weeklyBuckets = new Map<string, { week: string; reviewed: number; total: number }>();
        let weekCursor = startOfWeekMonday(range.from);
        while (weekCursor <= range.to) {
            const key = toDateOnlyString(weekCursor);
            weeklyBuckets.set(key, { week: key, reviewed: 0, total: 0 });
            weekCursor = addUtcDays(weekCursor, 7);
        }

        for (const day of daily) {
            const weekKey = toDateOnlyString(startOfWeekMonday(parseDateOnly(day.date)));
            const bucket = weeklyBuckets.get(weekKey);
            if (bucket) {
                bucket.total += 1;
                if (day.reviewed) bucket.reviewed += 1;
            }
        }

        const weeklyFrequency = [...weeklyBuckets.values()].map((bucket) => ({
            week: bucket.week,
            reviewed: bucket.reviewed,
            total: bucket.total,
            rate: bucket.total > 0 ? round(bucket.reviewed / bucket.total, 4) : null,
        }));

        return {
            daily,
            weeklyFrequency,
            summary: {
                daysWithReview,
                daysWithoutReview,
                longestGap,
                currentGap: currentGapDays,
                totalDays: daily.length,
            },
            range: { from: toDateOnlyString(range.from), to: toDateOnlyString(range.to) },
        };
    }

    async getLifeAreaBalanceScoreReport(userId: string, query: { from?: string; to?: string }) {
        const range = this.resolveDateRange(query.from, query.to);

        const lifeAreas = await this.prisma.lifeArea.findMany({
            where: { userId, isArchived: false },
            select: { id: true, name: true, color: true },
            orderBy: { order: 'asc' },
        });

        const areaScores: {
            lifeAreaId: string;
            name: string;
            color: string | null;
            balanceScore: number;
            habitRate: number;
            priorityRate: number;
            timeHoursNorm: number;
            hours: number;
        }[] = [];

        for (const area of lifeAreas) {
            const habits = await this.prisma.habit.findMany({
                where: { userId, lifeAreaId: area.id, isArchived: false, isActive: true },
                include: {
                    logs: {
                        where: { date: { gte: range.from, lte: range.to } },
                        select: { date: true, completed: true },
                    },
                },
            });

            let habitRate = 0;
            if (habits.length > 0) {
                const totalExpected = habits.reduce(
                    (s, h) => s + calculateExpectedCompletions(h, range),
                    0,
                );
                const totalCompleted = habits.reduce(
                    (s, h) =>
                        s +
                        h.logs.filter(
                            (l) => l.completed && l.date >= range.from && l.date <= range.to,
                        ).length,
                    0,
                );
                habitRate = totalExpected > 0 ? clampRate(totalCompleted / totalExpected) : 0;
            }

            const priorityDays = await this.prisma.day.findMany({
                where: { userId, lifeAreaId: area.id, date: { gte: range.from, lte: range.to } },
                include: { priorities: { select: { completed: true } } },
            });

            const totalSet = priorityDays.reduce((s, d) => s + d.priorities.length, 0);
            const totalCompleted = priorityDays.reduce(
                (s, d) => s + d.priorities.filter((p) => p.completed).length,
                0,
            );
            const priorityRate = totalSet > 0 ? clampRate(totalCompleted / totalSet) : 0;

            const timeBlocks = await this.prisma.timeBlock.findMany({
                where: {
                    day: { userId, lifeAreaId: area.id, date: { gte: range.from, lte: range.to } },
                },
                select: { startTime: true, endTime: true },
            });

            const hours = timeBlocks.reduce(
                (s, tb) => s + (tb.endTime.getTime() - tb.startTime.getTime()) / 3_600_000,
                0,
            );

            areaScores.push({
                lifeAreaId: area.id,
                name: area.name,
                color: area.color,
                balanceScore: 0,
                habitRate: round(habitRate, 4),
                priorityRate: round(priorityRate, 4),
                timeHoursNorm: 0,
                hours,
            });
        }

        const maxH = Math.max(...areaScores.map((a) => a.hours), 1);

        for (const a of areaScores) {
            a.timeHoursNorm = round(a.hours / maxH, 4);
            a.balanceScore = round(
                0.4 * a.habitRate + 0.4 * a.priorityRate + 0.2 * a.timeHoursNorm,
                4,
            );
        }

        const scores = areaScores.map((a) => a.balanceScore * 100);
        const avgScore =
            scores.length > 0 ? round(scores.reduce((s, v) => s + v, 0) / scores.length, 2) : null;
        const variance =
            scores.length > 0
                ? round(
                      scores.reduce((s, v) => s + (v - (avgScore ?? 0)) ** 2, 0) / scores.length,
                      2,
                  )
                : null;

        const sorted = [...areaScores].sort((a, b) => b.balanceScore - a.balanceScore);

        return {
            areas: areaScores.sort((a, b) => b.balanceScore - a.balanceScore),
            summary: {
                averageScore: avgScore ? round(avgScore, 2) : null,
                balanceVariance: variance,
                mostBalanced: sorted[0] ?? null,
                mostNeglected: sorted[sorted.length - 1] ?? null,
            },
            range: { from: toDateOnlyString(range.from), to: toDateOnlyString(range.to) },
        };
    }

    async getPriorityFocusByLifeAreaReport(userId: string, query: { from?: string; to?: string }) {
        const range = this.resolveDateRange(query.from, query.to);

        const days = await this.prisma.day.findMany({
            where: { userId, date: { gte: range.from, lte: range.to } },
            select: {
                lifeAreaId: true,
                priorities: { select: { completed: true } },
            },
        });

        const grouped = new Map<
            string,
            { lifeAreaId: string | null; set: number; completed: number }
        >();

        for (const day of days) {
            const key = day.lifeAreaId ?? 'unassigned';
            const existing = grouped.get(key) ?? {
                lifeAreaId: day.lifeAreaId,
                set: 0,
                completed: 0,
            };
            existing.set += day.priorities.length;
            existing.completed += day.priorities.filter((p) => p.completed).length;
            grouped.set(key, existing);
        }

        const areaIds = [
            ...new Set([...grouped.keys()].filter((k) => k !== 'unassigned')),
        ] as string[];
        const lifeAreas = areaIds.length
            ? await this.prisma.lifeArea.findMany({
                  where: { userId, id: { in: areaIds } },
                  select: { id: true, name: true, color: true },
              })
            : [];
        const areaMap = new Map(lifeAreas.map((a) => [a.id, a]));

        const totalSet = [...grouped.values()].reduce((s, g) => s + g.set, 0);
        const totalCompleted = [...grouped.values()].reduce((s, g) => s + g.completed, 0);

        const areas = [...grouped.entries()]
            .map(([key, data]) => {
                const meta = key !== 'unassigned' ? areaMap.get(key) : null;
                return {
                    lifeAreaId: data.lifeAreaId,
                    name: meta?.name ?? 'Unassigned',
                    color: meta?.color ?? '#9CA3AF',
                    set: data.set,
                    completed: data.completed,
                    completionRate: data.set > 0 ? round(data.completed / data.set, 4) : null,
                    share: totalSet > 0 ? round(data.set / totalSet, 4) : 0,
                };
            })
            .sort((a, b) => b.set - a.set);

        return {
            areas,
            summary: { totalSet, totalCompleted, areaCount: areas.length },
            range: { from: toDateOnlyString(range.from), to: toDateOnlyString(range.to) },
        };
    }

    async getEisenhowerByLifeAreaReport(userId: string, query: { from?: string; to?: string }) {
        const range = this.resolveDateRange(query.from, query.to);

        const tasks = await this.prisma.eisenhowerTask.findMany({
            where: { userId, createdAt: { gte: range.from, lte: range.to } },
            select: { lifeAreaId: true, quadrant: true },
        });

        const grouped = new Map<
            string,
            { lifeAreaId: string | null; q1: number; q2: number; q3: number; q4: number }
        >();

        for (const task of tasks) {
            const key = task.lifeAreaId ?? 'unassigned';
            const existing = grouped.get(key) ?? {
                lifeAreaId: task.lifeAreaId,
                q1: 0,
                q2: 0,
                q3: 0,
                q4: 0,
            };
            if (task.quadrant === 1) existing.q1 += 1;
            else if (task.quadrant === 2) existing.q2 += 1;
            else if (task.quadrant === 3) existing.q3 += 1;
            else existing.q4 += 1;
            grouped.set(key, existing);
        }

        const areaIds = [
            ...new Set([...grouped.keys()].filter((k) => k !== 'unassigned')),
        ] as string[];
        const lifeAreas = areaIds.length
            ? await this.prisma.lifeArea.findMany({
                  where: { userId, id: { in: areaIds } },
                  select: { id: true, name: true, color: true },
              })
            : [];
        const areaMap = new Map(lifeAreas.map((a) => [a.id, a]));

        const areas = [...grouped.entries()]
            .map(([key, data]) => {
                const meta = key !== 'unassigned' ? areaMap.get(key) : null;
                const q1q2 = data.q1 + data.q2;
                return {
                    lifeAreaId: data.lifeAreaId,
                    name: meta?.name ?? 'Unassigned',
                    color: meta?.color ?? '#9CA3AF',
                    q1: data.q1,
                    q2: data.q2,
                    q3: data.q3,
                    q4: data.q4,
                    total: data.q1 + data.q2 + data.q3 + data.q4,
                    proactivityRatio: q1q2 > 0 ? round(data.q2 / q1q2, 4) : null,
                };
            })
            .sort((a, b) => b.total - a.total);

        return {
            areas,
            summary: {
                totalTasks: tasks.length,
                areaCount: areas.length,
            },
            range: { from: toDateOnlyString(range.from), to: toDateOnlyString(range.to) },
        };
    }

    async getEisenhowerQuadrantDistributionReport(
        userId: string,
        query: { from?: string; to?: string; lifeAreaId?: string },
    ) {
        const range = this.resolveDateRange(query.from, query.to);

        const tasks = await this.prisma.eisenhowerTask.findMany({
            where: {
                userId,
                createdAt: { gte: range.from, lte: range.to },
                ...(query.lifeAreaId ? { lifeAreaId: query.lifeAreaId } : {}),
            },
            select: { quadrant: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
        });

        const total = tasks.length;
        const quadrants = [1, 2, 3, 4].map((q) => {
            const count = tasks.filter((t) => t.quadrant === q).length;
            return {
                quadrant: q,
                label: [
                    '',
                    'Urgent + Important',
                    'Not Urgent + Important',
                    'Urgent + Not Important',
                    'Not Urgent + Not Important',
                ][q],
                count,
                percentage: total > 0 ? round(count / total, 4) : 0,
            };
        });

        const q1 = quadrants[0].count;
        const q2 = quadrants[1].count;
        const q1q2Ratio = q2 > 0 ? round(q1 / q2, 4) : q1 > 0 ? null : null;

        const monthlyBuckets = new Map<
            string,
            { month: string; q1: number; q2: number; total: number }
        >();
        let monthCursor = startOfMonth(range.from);
        while (monthCursor <= range.to) {
            const key = toDateOnlyString(monthCursor);
            monthlyBuckets.set(key, { month: key, q1: 0, q2: 0, total: 0 });
            monthCursor = new Date(
                Date.UTC(monthCursor.getUTCFullYear(), monthCursor.getUTCMonth() + 1, 1),
            );
        }

        for (const task of tasks) {
            const monthKey = toDateOnlyString(startOfMonth(task.createdAt));
            const bucket = monthlyBuckets.get(monthKey);
            if (bucket) {
                bucket.total += 1;
                if (task.quadrant === 1) bucket.q1 += 1;
                if (task.quadrant === 2) bucket.q2 += 1;
            }
        }

        const monthlyTrend = [...monthlyBuckets.values()].map((bucket) => ({
            month: bucket.month,
            q1: bucket.q1,
            q2: bucket.q2,
            total: bucket.total,
            q1Percentage: bucket.total > 0 ? round(bucket.q1 / bucket.total, 4) : null,
            q2Percentage: bucket.total > 0 ? round(bucket.q2 / bucket.total, 4) : null,
        }));

        return {
            quadrants,
            monthlyTrend,
            summary: {
                total,
                q1q2Ratio,
                q1: quadrants[0],
                q2: quadrants[1],
            },
            range: { from: toDateOnlyString(range.from), to: toDateOnlyString(range.to) },
        };
    }

    async getEisenhowerPromotionRateReport(userId: string, query: { from?: string; to?: string }) {
        const range = this.resolveDateRange(query.from, query.to);

        const tasks = await this.prisma.eisenhowerTask.findMany({
            where: { userId, createdAt: { gte: range.from, lte: range.to } },
            select: {
                id: true,
                title: true,
                quadrant: true,
                createdAt: true,
                promotedDate: true,
                promotedPriorityId: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        const promoted = tasks.filter((t) => t.promotedDate !== null);
        const promotionRate = tasks.length > 0 ? round(promoted.length / tasks.length, 4) : null;

        const avgTimeToPromotion =
            promoted.length > 0
                ? round(
                      promoted.reduce(
                          (sum, t) =>
                              sum + (t.promotedDate!.getTime() - t.createdAt.getTime()) / 86400000,
                          0,
                      ) / promoted.length,
                      2,
                  )
                : null;

        const q2Tasks = tasks.filter((t) => t.quadrant === 2);
        const q2Promoted = q2Tasks.filter((t) => t.promotedDate !== null);
        const q2PromotionRate =
            q2Tasks.length > 0 ? round(q2Promoted.length / q2Tasks.length, 4) : null;

        const thirtyDaysAgo = addUtcDays(new Date(), -30);
        const neverPromoted = tasks.filter(
            (t) => t.promotedDate === null && t.createdAt <= thirtyDaysAgo,
        );

        const histogram = new Map<number, number>();
        for (const t of promoted) {
            const daysToPromote = Math.round(
                (t.promotedDate!.getTime() - t.createdAt.getTime()) / 86400000,
            );
            histogram.set(daysToPromote, (histogram.get(daysToPromote) ?? 0) + 1);
        }

        return {
            promotionFunnel: {
                totalCreated: tasks.length,
                promoted: promoted.length,
                promotionRate,
                q2Total: q2Tasks.length,
                q2Promoted: q2Promoted.length,
                q2PromotionRate,
            },
            timing: {
                avgDaysToPromotion: avgTimeToPromotion,
                neverPromotedOlderThan30d: neverPromoted.length,
                histogram: [...histogram.entries()]
                    .map(([days, count]) => ({ days, count }))
                    .sort((a, b) => a.days - b.days),
            },
            range: { from: toDateOnlyString(range.from), to: toDateOnlyString(range.to) },
        };
    }

    async getEisenhowerTaskAgingReport(userId: string, query: { from?: string; to?: string }) {
        const now = new Date();

        const tasks = await this.prisma.eisenhowerTask.findMany({
            where: {
                userId,
                promotedDate: null,
                ...(query.from && query.to
                    ? {
                          createdAt: {
                              gte: parseDateOnly(query.from),
                              lte: parseDateOnly(query.to),
                          },
                      }
                    : {}),
            },
            select: {
                id: true,
                title: true,
                quadrant: true,
                createdAt: true,
                updatedAt: true,
                lifeAreaId: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        const byQuadrant = new Map<number, number[]>();
        for (const task of tasks) {
            const ageDays = Math.round((now.getTime() - task.createdAt.getTime()) / 86400000);
            const existing = byQuadrant.get(task.quadrant) ?? [];
            existing.push(ageDays);
            byQuadrant.set(task.quadrant, existing);
        }

        const quadrantAging = [1, 2, 3, 4].map((q) => {
            const ages = byQuadrant.get(q) ?? [];
            return {
                quadrant: q,
                label: [
                    '',
                    'Urgent + Important',
                    'Not Urgent + Important',
                    'Urgent + Not Important',
                    'Not Urgent + Not Important',
                ][q],
                taskCount: ages.length,
                avgAgeDays:
                    ages.length > 0
                        ? round(ages.reduce((s, a) => s + a, 0) / ages.length, 2)
                        : null,
                maxAgeDays: ages.length > 0 ? Math.max(...ages) : null,
            };
        });

        const stale = tasks
            .filter((t) => {
                const ageDays = Math.round((now.getTime() - t.createdAt.getTime()) / 86400000);
                return ageDays > 30;
            })
            .map((t) => ({
                id: t.id,
                title: t.title,
                quadrant: t.quadrant,
                lifeAreaId: t.lifeAreaId,
                ageDays: Math.round((now.getTime() - t.createdAt.getTime()) / 86400000),
                createdAt: t.createdAt.toISOString(),
            }))
            .sort((a, b) => b.ageDays - a.ageDays)
            .slice(0, 10);

        const oldest =
            tasks.length > 0
                ? Math.round((now.getTime() - tasks[0].createdAt.getTime()) / 86400000)
                : null;

        return {
            quadrantAging,
            stale,
            summary: {
                totalUnpromoted: tasks.length,
                staleCount: stale.length,
                oldestTaskAgeDays: oldest,
            },
        };
    }

    async getEisenhowerQ1Q2RatioTrendReport(userId: string, query: { from?: string; to?: string }) {
        const range = this.resolveDateRange(query.from, query.to);

        const tasks = await this.prisma.eisenhowerTask.findMany({
            where: { userId, createdAt: { gte: range.from, lte: range.to } },
            select: { quadrant: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
        });

        const monthlyBuckets = new Map<string, { month: string; q1: number; q2: number }>();
        let monthCursor = startOfMonth(range.from);
        while (monthCursor <= range.to) {
            const key = toDateOnlyString(monthCursor);
            monthlyBuckets.set(key, { month: key, q1: 0, q2: 0 });
            monthCursor = new Date(
                Date.UTC(monthCursor.getUTCFullYear(), monthCursor.getUTCMonth() + 1, 1),
            );
        }

        for (const task of tasks) {
            const monthKey = toDateOnlyString(startOfMonth(task.createdAt));
            const bucket = monthlyBuckets.get(monthKey);
            if (bucket) {
                if (task.quadrant === 1) bucket.q1 += 1;
                if (task.quadrant === 2) bucket.q2 += 1;
            }
        }

        const months = [...monthlyBuckets.values()].map((bucket) => ({
            month: bucket.month,
            q1: bucket.q1,
            q2: bucket.q2,
            ratio: bucket.q2 > 0 ? round(bucket.q1 / bucket.q2, 4) : bucket.q1 > 0 ? null : null,
            isHealthy: bucket.q2 > 0 && bucket.q1 / bucket.q2 < 1,
        }));

        const allQ1 = tasks.filter((t) => t.quadrant === 1).length;
        const allQ2 = tasks.filter((t) => t.quadrant === 2).length;
        const overallRatio = allQ2 > 0 ? round(allQ1 / allQ2, 4) : allQ1 > 0 ? null : null;

        return {
            months,
            summary: {
                overallRatio,
                direction:
                    months.length >= 2
                        ? (() => {
                              const recent = months.slice(-3);
                              const earlier = months.slice(0, -3);
                              const recentAvg =
                                  recent
                                      .filter((m) => m.ratio !== null)
                                      .reduce((s, m) => s + (m.ratio ?? 0), 0) /
                                  recent.filter((m) => m.ratio !== null).length;
                              const earlierAvg =
                                  earlier.filter((m) => m.ratio !== null).length > 0
                                      ? earlier
                                            .filter((m) => m.ratio !== null)
                                            .reduce((s, m) => s + (m.ratio ?? 0), 0) /
                                        earlier.filter((m) => m.ratio !== null).length
                                      : null;
                              if (earlierAvg === null) return null;
                              return recentAvg < earlierAvg
                                  ? 'improving'
                                  : recentAvg > earlierAvg
                                    ? 'declining'
                                    : 'stable';
                          })()
                        : null,
            },
            range: { from: toDateOnlyString(range.from), to: toDateOnlyString(range.to) },
        };
    }

    async getDecisionVolumeReport(
        userId: string,
        query: { from?: string; to?: string; lifeAreaId?: string },
    ) {
        const range = this.resolveDateRange(query.from, query.to);

        const decisions = await this.prisma.decisionEntry.findMany({
            where: {
                userId,
                date: { gte: range.from, lte: range.to },
                ...(query.lifeAreaId ? { lifeAreaId: query.lifeAreaId } : {}),
            },
            select: { id: true, date: true, lifeAreaId: true },
            orderBy: { date: 'asc' },
        });

        const totalDays = daysInclusive(range.from, range.to);
        const totalWeeks = Math.max(Math.ceil(totalDays / 7), 1);
        const avgPerWeek = round(decisions.length / totalWeeks, 2);

        const weeklyBuckets = new Map<string, { week: string; count: number }>();
        let weekCursor = startOfWeekMonday(range.from);
        while (weekCursor <= range.to) {
            const key = toDateOnlyString(weekCursor);
            weeklyBuckets.set(key, { week: key, count: 0 });
            weekCursor = addUtcDays(weekCursor, 7);
        }

        for (const decision of decisions) {
            const weekKey = toDateOnlyString(
                startOfWeekMonday(
                    decision.date instanceof Date ? decision.date : new Date(decision.date),
                ),
            );
            const bucket = weeklyBuckets.get(weekKey);
            if (bucket) bucket.count += 1;
        }

        const weekly = [...weeklyBuckets.values()].map((bucket) => ({
            week: bucket.week,
            count: bucket.count,
        }));

        const previousRange = {
            to: addUtcDays(range.from, -1),
            from: addUtcDays(range.from, -totalDays),
        };

        const previousDecisions = await this.prisma.decisionEntry.count({
            where: {
                userId,
                date: { gte: previousRange.from, lte: previousRange.to },
                ...(query.lifeAreaId ? { lifeAreaId: query.lifeAreaId } : {}),
            },
        });

        const momChange =
            previousDecisions > 0
                ? round((decisions.length - previousDecisions) / previousDecisions, 4)
                : null;

        return {
            weekly,
            summary: {
                totalDecisions: decisions.length,
                avgPerWeek,
                momChange,
            },
            range: { from: toDateOnlyString(range.from), to: toDateOnlyString(range.to) },
        };
    }

    async getDecisionOutcomeTrackingReport(userId: string, query: { from?: string; to?: string }) {
        const range = this.resolveDateRange(query.from, query.to);

        const decisions = await this.prisma.decisionEntry.findMany({
            where: { userId, date: { gte: range.from, lte: range.to } },
            select: {
                id: true,
                title: true,
                decision: true,
                outcome: true,
                date: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { date: 'desc' },
        });

        const withOutcome = decisions.filter((d) => d.outcome !== null && d.outcome !== '');
        const withoutOutcome = decisions.filter((d) => !d.outcome || d.outcome === '');

        const outcomeRate =
            decisions.length > 0 ? round(withOutcome.length / decisions.length, 4) : null;

        const avgTimeToOutcome =
            withOutcome.length > 0
                ? round(
                      withOutcome.reduce((sum, d) => {
                          const decisionDate = d.date instanceof Date ? d.date : new Date(d.date);
                          const updatedDate = d.updatedAt;
                          return sum + (updatedDate.getTime() - decisionDate.getTime()) / 86400000;
                      }, 0) / withOutcome.length,
                      2,
                  )
                : null;

        const awaitingOutcome = withoutOutcome.slice(0, 10).map((d) => ({
            id: d.id,
            title: d.title,
            decision: d.decision,
            date: toDateOnlyString(d.date instanceof Date ? d.date : new Date(d.date)),
        }));

        return {
            outcomeTracking: {
                withOutcome: withOutcome.length,
                withoutOutcome: withoutOutcome.length,
                outcomeRate,
                avgDaysToOutcome: avgTimeToOutcome,
            },
            awaitingOutcome,
            summary: {
                totalDecisions: decisions.length,
            },
            range: { from: toDateOnlyString(range.from), to: toDateOnlyString(range.to) },
        };
    }

    async getDecisionByLifeAreaReport(userId: string, query: { from?: string; to?: string }) {
        const range = this.resolveDateRange(query.from, query.to);

        const decisions = await this.prisma.decisionEntry.findMany({
            where: { userId, date: { gte: range.from, lte: range.to } },
            select: { lifeAreaId: true, outcome: true },
        });

        const grouped = new Map<
            string,
            { lifeAreaId: string | null; count: number; withOutcome: number }
        >();

        for (const d of decisions) {
            const key = d.lifeAreaId ?? 'unassigned';
            const existing = grouped.get(key) ?? {
                lifeAreaId: d.lifeAreaId,
                count: 0,
                withOutcome: 0,
            };
            existing.count += 1;
            if (d.outcome !== null && d.outcome !== '') existing.withOutcome += 1;
            grouped.set(key, existing);
        }

        const areaIds = [
            ...new Set([...grouped.keys()].filter((k) => k !== 'unassigned')),
        ] as string[];
        const lifeAreas = areaIds.length
            ? await this.prisma.lifeArea.findMany({
                  where: { userId, id: { in: areaIds } },
                  select: { id: true, name: true, color: true },
              })
            : [];
        const areaMap = new Map(lifeAreas.map((a) => [a.id, a]));

        const total = decisions.length;
        const areas = [...grouped.entries()]
            .map(([key, data]) => {
                const meta = key !== 'unassigned' ? areaMap.get(key) : null;
                return {
                    lifeAreaId: data.lifeAreaId,
                    name: meta?.name ?? 'Unassigned',
                    color: meta?.color ?? '#9CA3AF',
                    count: data.count,
                    percentage: total > 0 ? round(data.count / total, 4) : 0,
                    outcomeRate: data.count > 0 ? round(data.withOutcome / data.count, 4) : null,
                };
            })
            .sort((a, b) => b.count - a.count);

        return {
            areas,
            summary: { totalDecisions: total, areaCount: areas.length },
            range: { from: toDateOnlyString(range.from), to: toDateOnlyString(range.to) },
        };
    }

    async getFocusTimePerDecisionReport(userId: string, query: { from?: string; to?: string }) {
        const range = this.resolveDateRange(query.from, query.to);

        const links = await this.prisma.decisionFocusSession.findMany({
            where: {
                decision: { userId },
                focusSession: { startedAt: { gte: range.from, lte: range.to } },
            },
            select: {
                decisionId: true,
                focusSession: {
                    select: {
                        duration: true,
                        endedAt: true,
                        startedAt: true,
                        completed: true,
                    },
                },
            },
        });

        const decisionMinutes = new Map<string, number>();
        for (const link of links) {
            const minutes =
                link.focusSession.duration !== null && link.focusSession.duration !== undefined
                    ? secondsToMinutes(link.focusSession.duration)
                    : link.focusSession.endedAt
                      ? minutesBetween(link.focusSession.startedAt, link.focusSession.endedAt)
                      : 0;
            decisionMinutes.set(
                link.decisionId,
                (decisionMinutes.get(link.decisionId) ?? 0) + minutes,
            );
        }

        const decisionIds = [...new Set(links.map((l) => l.decisionId))];
        const decisions = decisionIds.length
            ? await this.prisma.decisionEntry.findMany({
                  where: { id: { in: decisionIds } },
                  select: { id: true, title: true },
              })
            : [];
        const decisionMap = new Map(decisions.map((d) => [d.id, d]));

        const ranked = [...decisionMinutes.entries()]
            .map(([id, minutes]) => ({
                decisionId: id,
                title: decisionMap.get(id)?.title ?? 'Unknown',
                focusMinutes: round(minutes, 2),
            }))
            .sort((a, b) => b.focusMinutes - a.focusMinutes);

        const allDecisions = await this.prisma.decisionEntry.count({
            where: { userId, date: { gte: range.from, lte: range.to } },
        });

        const avgFocusPerDecision =
            decisionIds.length > 0
                ? round(
                      [...decisionMinutes.values()].reduce((s, v) => s + v, 0) / decisionIds.length,
                      2,
                  )
                : null;

        return {
            decisions: ranked.slice(0, 10),
            summary: {
                linkedDecisions: decisionIds.length,
                unlinkedDecisions: allDecisions - decisionIds.length,
                avgFocusMinutesPerDecision: avgFocusPerDecision,
                totalFocusMinutes: round(
                    [...decisionMinutes.values()].reduce((s, v) => s + v, 0),
                    2,
                ),
            },
            range: { from: toDateOnlyString(range.from), to: toDateOnlyString(range.to) },
        };
    }

    async getCalendarSyncHealthReport(userId: string, query: { from?: string; to?: string }) {
        const range = this.resolveDateRange(query.from, query.to);

        const connections = await this.prisma.calendarConnection.findMany({
            where: { userId },
            select: {
                id: true,
                provider: true,
                status: true,
                lastSyncAt: true,
                errorMessage: true,
                lastErrorAt: true,
            },
        });

        const connectionIds = connections.map((c) => c.id);

        const auditLogs =
            connectionIds.length > 0
                ? await this.prisma.syncAuditLog.findMany({
                      where: {
                          connectionId: { in: connectionIds },
                          createdAt: { gte: range.from, lte: range.to },
                      },
                      select: {
                          connectionId: true,
                          action: true,
                          status: true,
                          eventsProcessed: true,
                          eventsCreated: true,
                          eventsUpdated: true,
                          eventsDeleted: true,
                          durationMs: true,
                          createdAt: true,
                      },
                      orderBy: { createdAt: 'desc' },
                  })
                : [];

        const successLogs = auditLogs.filter((l) => l.status === 'success');
        const syncSuccessRate =
            auditLogs.length > 0 ? round(successLogs.length / auditLogs.length, 4) : null;

        const avgSyncDuration =
            auditLogs.length > 0
                ? round(
                      auditLogs.reduce((s, l) => s + (l.durationMs ?? 0), 0) / auditLogs.length,
                      2,
                  )
                : null;

        const dailyEvents = new Map<string, number>();
        for (const log of auditLogs) {
            const key = toDateOnlyString(log.createdAt);
            dailyEvents.set(key, (dailyEvents.get(key) ?? 0) + (log.eventsProcessed ?? 0));
        }

        const eventsPerDay = [...dailyEvents.entries()]
            .map(([date, events]) => ({ date, events }))
            .sort((a, b) => a.date.localeCompare(b.date));

        const lastSuccessLog = successLogs[0] ?? null;

        const connectionStatuses = connections.map((c) => ({
            connectionId: c.id,
            provider: c.provider,
            status: c.status,
            lastSyncAt: c.lastSyncAt?.toISOString() ?? null,
            errorMessage: c.errorMessage ?? null,
            lastErrorAt: c.lastErrorAt?.toISOString() ?? null,
        }));

        return {
            connections: connectionStatuses,
            eventsPerDay,
            summary: {
                totalConnections: connections.length,
                syncSuccessRate,
                avgSyncDurationMs: avgSyncDuration,
                lastSuccessfulSync: lastSuccessLog?.createdAt.toISOString() ?? null,
                totalSyncs: auditLogs.length,
            },
            range: { from: toDateOnlyString(range.from), to: toDateOnlyString(range.to) },
        };
    }

    async getCalendarConflictStatsReport(userId: string, query: { from?: string; to?: string }) {
        const range = this.resolveDateRange(query.from, query.to);

        const connections = await this.prisma.calendarConnection.findMany({
            where: { userId },
            select: { id: true },
        });
        const connectionIds = connections.map((c) => c.id);

        const conflicts =
            connectionIds.length > 0
                ? await this.prisma.calendarConflict.findMany({
                      where: {
                          connectionId: { in: connectionIds },
                          createdAt: { gte: range.from, lte: range.to },
                      },
                      select: {
                          id: true,
                          conflictType: true,
                          resolved: true,
                          resolvedAt: true,
                          createdAt: true,
                          localTitle: true,
                          remoteTitle: true,
                      },
                      orderBy: { createdAt: 'desc' },
                  })
                : [];

        const resolved = conflicts.filter((c) => c.resolved);
        const unresolved = conflicts.filter((c) => !c.resolved);
        const resolutionRate =
            conflicts.length > 0 ? round(resolved.length / conflicts.length, 4) : null;

        const avgTimeToResolve =
            resolved.length > 0
                ? round(
                      resolved.reduce(
                          (sum, c) =>
                              sum + (c.resolvedAt!.getTime() - c.createdAt.getTime()) / 3600000,
                          0,
                      ) / resolved.length,
                      2,
                  )
                : null;

        const byType = new Map<string, { count: number; resolved: number }>();
        for (const c of conflicts) {
            const existing = byType.get(c.conflictType) ?? { count: 0, resolved: 0 };
            existing.count += 1;
            if (c.resolved) existing.resolved += 1;
            byType.set(c.conflictType, existing);
        }

        const conflictTypes = [...byType.entries()]
            .map(([type, data]) => ({
                type,
                count: data.count,
                resolved: data.resolved,
                resolutionRate: data.count > 0 ? round(data.resolved / data.count, 4) : null,
            }))
            .sort((a, b) => b.count - a.count);

        return {
            conflictsByType: conflictTypes,
            timeline: conflicts.slice(0, 20).map((c) => ({
                id: c.id,
                conflictType: c.conflictType,
                localTitle: c.localTitle,
                remoteTitle: c.remoteTitle,
                resolved: c.resolved,
                resolvedAt: c.resolvedAt?.toISOString() ?? null,
                createdAt: c.createdAt.toISOString(),
            })),
            summary: {
                totalConflicts: conflicts.length,
                resolved: resolved.length,
                unresolved: unresolved.length,
                resolutionRate,
                avgHoursToResolve: avgTimeToResolve,
            },
            range: { from: toDateOnlyString(range.from), to: toDateOnlyString(range.to) },
        };
    }

    async getWeeklyReviewReport(userId: string, query: { date?: string }) {
        const targetDate = query.date ? parseDateOnly(query.date) : new Date();
        const weekStart = startOfWeekMonday(targetDate);
        const weekEnd = endOfWeekSunday(weekStart);
        const range: DateRange = { from: weekStart, to: weekEnd };

        const [priorityDays, focusSessions, habitData, decisionEntries, reviewDays] =
            await Promise.all([
                this.prisma.day.findMany({
                    where: { userId, date: { gte: range.from, lte: range.to } },
                    include: { priorities: { select: { title: true, completed: true } } },
                }),
                this.prisma.focusSession.findMany({
                    where: {
                        startedAt: { gte: range.from, lte: range.to },
                        timeBlock: { day: { userId } },
                    },
                    select: { completed: true, duration: true, endedAt: true, startedAt: true },
                }),
                this.prisma.habit.findMany({
                    where: { userId, isArchived: false, isActive: true },
                    include: {
                        logs: {
                            where: { date: { gte: range.from, lte: range.to } },
                            select: { date: true, completed: true },
                        },
                    },
                }),
                this.prisma.decisionEntry.findMany({
                    where: { userId, date: { gte: range.from, lte: range.to } },
                    select: { outcome: true },
                }),
                this.prisma.dailyReview.findMany({
                    where: {
                        day: { userId, date: { gte: range.from, lte: range.to } },
                    },
                    select: { wentWell: true, didntGoWell: true },
                }),
            ]);

        const allPriorities = priorityDays.flatMap((d) => d.priorities);
        const totalSet = allPriorities.length;
        const totalCompleted = allPriorities.filter((p) => p.completed).length;
        const incomplete = allPriorities
            .filter((p) => !p.completed)
            .map((p) => p.title)
            .slice(0, 3);

        const scheduledHours = await this.prisma.timeBlock.count({
            where: {
                day: { userId, date: { gte: range.from, lte: range.to } },
                category: 'focus',
            },
        });

        const completedSessions = focusSessions.filter((s) => s.completed);
        const actualMinutes = completedSessions.reduce((sum, s) => {
            const minutes =
                s.duration !== null && s.duration !== undefined
                    ? secondsToMinutes(s.duration)
                    : s.endedAt
                      ? minutesBetween(s.startedAt, s.endedAt)
                      : 0;
            return sum + minutes;
        }, 0);

        const habitResults = habitData.map((h) => {
            const expected = calculateExpectedCompletions(h, range);
            const completed = h.logs.filter(
                (l) => l.completed && l.date >= range.from && l.date <= range.to,
            ).length;
            return {
                name: h.name,
                expected,
                completed,
                rate: expected > 0 ? round(completed / expected, 4) : null,
            };
        });

        const onTrack = habitResults.filter((h) => h.rate !== null && h.rate >= 0.7).length;
        const best = [...habitResults].sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1))[0];
        const needsAttention = [...habitResults].sort((a, b) => (a.rate ?? 1) - (b.rate ?? 1))[0];

        const decisionsWithOutcome = decisionEntries.filter(
            (d) => d.outcome !== null && d.outcome !== '',
        ).length;

        const STOP_WORDS = new Set([
            'the',
            'a',
            'an',
            'and',
            'or',
            'but',
            'in',
            'on',
            'at',
            'to',
            'for',
            'of',
            'with',
            'by',
            'from',
            'is',
            'was',
            'are',
            'were',
            'be',
            'been',
            'being',
            'have',
            'has',
            'had',
            'do',
            'does',
            'did',
            'will',
            'would',
            'could',
            'should',
            'may',
            'might',
            'shall',
            'can',
            'it',
            'its',
            'this',
            'that',
            'these',
            'those',
            'i',
            'my',
            'me',
            'we',
            'our',
            'you',
            'your',
            'he',
            'she',
            'they',
            'them',
            'his',
            'her',
            'their',
            'not',
            'no',
            'so',
            'if',
            'as',
            'up',
            'out',
            'just',
            'about',
            'also',
            'then',
            'than',
            'very',
            'too',
            'really',
            'all',
            'some',
            'any',
            'each',
            'every',
            'much',
            'more',
            'most',
            'other',
        ]);

        function tokenize(text: string | null): string[] {
            if (!text) return [];
            return text
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, ' ')
                .split(/\s+/)
                .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
        }

        const winsFreq = new Map<string, number>();
        const blockersFreq = new Map<string, number>();
        for (const review of reviewDays) {
            for (const w of tokenize(review.wentWell)) winsFreq.set(w, (winsFreq.get(w) ?? 0) + 1);
            for (const w of tokenize(review.didntGoWell))
                blockersFreq.set(w, (blockersFreq.get(w) ?? 0) + 1);
        }

        const topWords = (freq: Map<string, number>, limit: number) =>
            [...freq.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .map(([word, count]) => ({ word, count }));

        return {
            week: { from: toDateOnlyString(range.from), to: toDateOnlyString(range.to) },
            priorities: {
                set: totalSet,
                completed: totalCompleted,
                rate: totalSet > 0 ? round(totalCompleted / totalSet, 4) : null,
                incomplete,
            },
            focus: {
                scheduledHours,
                actualMinutes: round(actualMinutes, 2),
                sessions: focusSessions.length,
                completionRate:
                    focusSessions.length > 0
                        ? round(completedSessions.length / focusSessions.length, 4)
                        : null,
            },
            habits: {
                onTrack,
                total: habitData.length,
                best: best ? { name: best.name, rate: best.rate } : null,
                needsAttention: needsAttention
                    ? { name: needsAttention.name, rate: needsAttention.rate }
                    : null,
            },
            decisions: {
                count: decisionEntries.length,
                withOutcome: decisionsWithOutcome,
            },
            dailyReview: {
                completed: reviewDays.length,
                total: 7,
                wins: topWords(winsFreq, 5),
                blockers: topWords(blockersFreq, 5),
            },
        };
    }

    async getMonthlyProductivityScoreReport(userId: string, query: { date?: string }) {
        const targetDate = query.date ? parseDateOnly(query.date) : new Date();
        const monthStart = startOfMonth(targetDate);
        const monthEnd = endOfMonth(targetDate);
        const range: DateRange = { from: monthStart, to: monthEnd };

        const [priorityDays, focusSessions, habits, reviewCount, lifeAreas] = await Promise.all([
            this.prisma.day.findMany({
                where: { userId, date: { gte: range.from, lte: range.to } },
                include: { priorities: { select: { completed: true } } },
            }),
            this.prisma.focusSession.findMany({
                where: {
                    startedAt: { gte: range.from, lte: range.to },
                    timeBlock: { day: { userId } },
                },
                select: { completed: true },
            }),
            this.prisma.habit.findMany({
                where: { userId, isArchived: false, isActive: true },
                include: {
                    logs: {
                        where: { date: { gte: range.from, lte: range.to } },
                        select: { date: true, completed: true },
                    },
                },
            }),
            this.prisma.dailyReview.count({
                where: { day: { userId, date: { gte: range.from, lte: range.to } } },
            }),
            this.prisma.lifeArea.findMany({
                where: { userId, isArchived: false },
                select: { id: true },
            }),
        ]);

        const totalPriorities = priorityDays.flatMap((d) => d.priorities);
        const priorityRate =
            totalPriorities.length > 0
                ? clampRate(
                      totalPriorities.filter((p) => p.completed).length / totalPriorities.length,
                  )
                : 0;

        const focusRate =
            focusSessions.length > 0
                ? clampRate(focusSessions.filter((s) => s.completed).length / focusSessions.length)
                : 0;

        let habitRate = 0;
        if (habits.length > 0) {
            const totalExpected = habits.reduce(
                (s, h) => s + calculateExpectedCompletions(h, range),
                0,
            );
            const totalCompleted = habits.reduce(
                (s, h) =>
                    s +
                    h.logs.filter((l) => l.completed && l.date >= range.from && l.date <= range.to)
                        .length,
                0,
            );
            habitRate = totalExpected > 0 ? clampRate(totalCompleted / totalExpected) : 0;
        }

        const totalDays = daysInclusive(range.from, range.to);
        const reviewRate = totalDays > 0 ? clampRate(reviewCount / totalDays) : 0;

        const lifeAreaScores: number[] = [];
        for (const area of lifeAreas) {
            const areaHabits = await this.prisma.habit.findMany({
                where: { userId, lifeAreaId: area.id, isArchived: false, isActive: true },
                include: {
                    logs: {
                        where: { date: { gte: range.from, lte: range.to } },
                        select: { date: true, completed: true },
                    },
                },
            });
            const areaPriorityDays = await this.prisma.day.findMany({
                where: { userId, lifeAreaId: area.id, date: { gte: range.from, lte: range.to } },
                include: { priorities: { select: { completed: true } } },
            });

            const areaHabitRate =
                areaHabits.length > 0
                    ? (() => {
                          const exp = areaHabits.reduce(
                              (s, h) => s + calculateExpectedCompletions(h, range),
                              0,
                          );
                          const comp = areaHabits.reduce(
                              (s, h) =>
                                  s +
                                  h.logs.filter(
                                      (l) =>
                                          l.completed && l.date >= range.from && l.date <= range.to,
                                  ).length,
                              0,
                          );
                          return exp > 0 ? comp / exp : 0;
                      })()
                    : 0;

            const areaPSet = areaPriorityDays.reduce((s, d) => s + d.priorities.length, 0);
            const areaPComp = areaPriorityDays.reduce(
                (s, d) => s + d.priorities.filter((p) => p.completed).length,
                0,
            );
            const areaPriorityRate = areaPSet > 0 ? areaPComp / areaPSet : 0;

            lifeAreaScores.push(round(0.5 * areaHabitRate + 0.5 * areaPriorityRate, 4));
        }

        const balanceScore =
            lifeAreaScores.length > 0
                ? lifeAreaScores.reduce((s, v) => s + v, 0) / lifeAreaScores.length
                : 0;

        const score = round(
            (0.25 * priorityRate +
                0.2 * focusRate +
                0.25 * habitRate +
                0.15 * reviewRate +
                0.15 * balanceScore) *
                100,
            2,
        );

        const prevMonthEnd = addUtcDays(monthStart, -1);
        const prevMonthStart = startOfMonth(prevMonthEnd);
        const prevMonthEnd2 = endOfMonth(prevMonthStart);

        const [prevPriorityDays, prevFocusSessions, prevHabits, prevReviewCount] =
            await Promise.all([
                this.prisma.day.findMany({
                    where: { userId, date: { gte: prevMonthStart, lte: prevMonthEnd2 } },
                    include: { priorities: { select: { completed: true } } },
                }),
                this.prisma.focusSession.findMany({
                    where: {
                        startedAt: { gte: prevMonthStart, lte: prevMonthEnd2 },
                        timeBlock: { day: { userId } },
                    },
                    select: { completed: true },
                }),
                this.prisma.habit.findMany({
                    where: { userId, isArchived: false, isActive: true },
                    include: {
                        logs: {
                            where: { date: { gte: prevMonthStart, lte: prevMonthEnd2 } },
                            select: { date: true, completed: true },
                        },
                    },
                }),
                this.prisma.dailyReview.count({
                    where: { day: { userId, date: { gte: prevMonthStart, lte: prevMonthEnd2 } } },
                }),
            ]);

        const prevTotal = prevPriorityDays.flatMap((d) => d.priorities);
        const prevPriorityRate =
            prevTotal.length > 0
                ? prevTotal.filter((p) => p.completed).length / prevTotal.length
                : 0;
        const prevFocusRate =
            prevFocusSessions.length > 0
                ? prevFocusSessions.filter((s) => s.completed).length / prevFocusSessions.length
                : 0;
        const prevDays = daysInclusive(prevMonthStart, prevMonthEnd2);
        let prevHabitRate = 0;
        if (prevHabits.length > 0) {
            const exp = prevHabits.reduce(
                (s, h) =>
                    s +
                    calculateExpectedCompletions(h, { from: prevMonthStart, to: prevMonthEnd2 }),
                0,
            );
            const comp = prevHabits.reduce(
                (s, h) =>
                    s +
                    h.logs.filter(
                        (l) => l.completed && l.date >= prevMonthStart && l.date <= prevMonthEnd2,
                    ).length,
                0,
            );
            prevHabitRate = exp > 0 ? comp / exp : 0;
        }
        const prevReviewRate = prevDays > 0 ? prevReviewCount / prevDays : 0;

        const prevScore = round(
            (0.25 * prevPriorityRate +
                0.2 * prevFocusRate +
                0.25 * prevHabitRate +
                0.15 * prevReviewRate +
                0.15 * balanceScore) *
                100,
            2,
        );

        const momChange = round(score - prevScore, 2);

        return {
            score,
            components: {
                priorityRate: round(priorityRate, 4),
                focusRate: round(focusRate, 4),
                habitRate: round(habitRate, 4),
                reviewRate: round(reviewRate, 4),
                balanceScore: round(balanceScore, 4),
            },
            month: toDateOnlyString(monthStart),
            summary: {
                score,
                previousMonthScore: prevScore,
                change: momChange,
                direction: momChange > 0 ? 'improving' : momChange < 0 ? 'declining' : 'stable',
            },
        };
    }

    async getStreakDashboardReport(userId: string) {
        const today = new Date();

        const [days, focusSessions, reviews, habits] = await Promise.all([
            this.prisma.day.findMany({
                where: { userId },
                select: { date: true, priorities: { select: { id: true } } },
                orderBy: { date: 'desc' },
            }),
            this.prisma.focusSession.findMany({
                where: {
                    completed: true,
                    timeBlock: { day: { userId } },
                },
                select: { startedAt: true },
                orderBy: { startedAt: 'desc' },
            }),
            this.prisma.dailyReview.findMany({
                where: { day: { userId } },
                select: { day: { select: { date: true } } },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.habit.findMany({
                where: { userId, isArchived: false, isActive: true },
                include: { logs: { where: { completed: true }, select: { date: true } } },
                orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
            }),
        ]);

        const planningDates = new Set(
            days.filter((d) => d.priorities.length > 0).map((d) => toDateOnlyString(d.date)),
        );
        const focusDates = new Set(focusSessions.map((s) => toDateOnlyString(s.startedAt)));
        const reviewDates = new Set(reviews.map((r) => toDateOnlyString(r.day.date)));

        function calculateStreak(dates: Set<string>): { current: number; best: number } {
            if (dates.size === 0) return { current: 0, best: 0 };

            const sorted = [...dates].sort();
            let current = 0;
            let cursor = new Date(today);

            if (dates.has(toDateOnlyString(cursor))) {
                current = 1;
                cursor = addUtcDays(cursor, -1);
                while (dates.has(toDateOnlyString(cursor))) {
                    current += 1;
                    cursor = addUtcDays(cursor, -1);
                }
            }

            let best = 0;
            let run = 0;
            let scan = parseDateOnly(sorted[0]);
            const lastDate = parseDateOnly(sorted[sorted.length - 1]);
            while (scan <= lastDate) {
                if (dates.has(toDateOnlyString(scan))) {
                    run += 1;
                    if (run > best) best = run;
                } else {
                    run = 0;
                }
                scan = addUtcDays(scan, 1);
            }

            return { current, best: Math.max(best, current) };
        }

        const planningStreak = calculateStreak(planningDates);
        const focusStreak = calculateStreak(focusDates);
        const reviewStreak = calculateStreak(reviewDates);

        const habitStreaks = habits.map((habit) => {
            const completedKeys = habit.logs.map((log) => toDateOnlyString(log.date));
            const streaks = calculateStreaks(habit, completedKeys);
            return {
                id: habit.id,
                name: habit.name,
                emoji: habit.emoji,
                color: habit.color,
                currentStreak: streaks.currentStreak,
                bestStreak: streaks.bestStreak,
            };
        });

        const allStreaks = [
            {
                type: 'daily_planning',
                label: 'Daily Planning',
                current: planningStreak.current,
                best: planningStreak.best,
            },
            {
                type: 'focus_sessions',
                label: 'Focus Sessions',
                current: focusStreak.current,
                best: focusStreak.best,
            },
            {
                type: 'daily_review',
                label: 'Daily Review',
                current: reviewStreak.current,
                best: reviewStreak.best,
            },
            ...habitStreaks.map((h) => ({
                type: `habit_${h.id}`,
                label: h.name,
                current: h.currentStreak,
                best: h.bestStreak,
            })),
        ];

        const leaderboard = [...allStreaks].sort((a, b) => b.best - a.best);

        return {
            streaks: {
                dailyPlanning: {
                    current: planningStreak.current,
                    best: planningStreak.best,
                },
                focusSessions: {
                    current: focusStreak.current,
                    best: focusStreak.best,
                },
                dailyReview: {
                    current: reviewStreak.current,
                    best: reviewStreak.best,
                },
                habits: habitStreaks,
            },
            leaderboard: leaderboard.map((s) => ({
                type: s.type,
                label: s.label,
                current: s.current,
                best: s.best,
            })),
        };
    }

    async getGoalVelocityReport(userId: string, query: { from?: string; to?: string }) {
        const range = this.resolveDateRange(query.from, query.to);

        const days = await this.prisma.day.findMany({
            where: { userId, date: { gte: range.from, lte: range.to } },
            include: { priorities: { select: { completed: true } } },
            orderBy: { date: 'asc' },
        });

        const weeklyBuckets = new Map<string, { week: string; completions: number }>();
        let weekCursor = startOfWeekMonday(range.from);
        while (weekCursor <= range.to) {
            const key = toDateOnlyString(weekCursor);
            weeklyBuckets.set(key, { week: key, completions: 0 });
            weekCursor = addUtcDays(weekCursor, 7);
        }

        for (const day of days) {
            const completed = day.priorities.filter((p) => p.completed).length;
            const weekKey = toDateOnlyString(startOfWeekMonday(day.date));
            const bucket = weeklyBuckets.get(weekKey);
            if (bucket) bucket.completions += completed;
        }

        const weeks = [...weeklyBuckets.values()].map((bucket) => ({
            week: bucket.week,
            completions: bucket.completions,
        }));

        const velocity = weeks.map((w, i) => {
            if (i === 0) return { ...w, wowChange: null };
            const prev = weeks[i - 1].completions;
            return {
                ...w,
                wowChange: prev > 0 ? round((w.completions - prev) / prev, 4) : null,
            };
        });

        const recentWeeks = velocity.slice(-4);
        const avgVelocity =
            recentWeeks.length > 0
                ? round(recentWeeks.reduce((s, w) => s + w.completions, 0) / recentWeeks.length, 2)
                : null;

        const acceleration =
            velocity.length >= 3
                ? (() => {
                      const last3 = velocity.slice(-3);
                      if (last3.some((w) => w.wowChange === null)) return null;
                      const changes = last3.map((w) => w.wowChange ?? 0);
                      const avgChange = changes.reduce((s, c) => s + c, 0) / changes.length;
                      return round(avgChange, 4);
                  })()
                : null;

        const projectedWeekly = avgVelocity ?? null;

        return {
            weeks: velocity,
            summary: {
                avgVelocity,
                acceleration,
                projectedWeekly,
                trend:
                    velocity.length >= 2
                        ? (() => {
                              const firstHalf = velocity.slice(0, Math.floor(velocity.length / 2));
                              const secondHalf = velocity.slice(Math.floor(velocity.length / 2));
                              const firstAvg =
                                  firstHalf.reduce((s, w) => s + w.completions, 0) /
                                  firstHalf.length;
                              const secondAvg =
                                  secondHalf.reduce((s, w) => s + w.completions, 0) /
                                  secondHalf.length;
                              if (secondAvg > firstAvg * 1.05) return 'accelerating';
                              if (secondAvg < firstAvg * 0.95) return 'decelerating';
                              return 'stable';
                          })()
                        : null,
            },
            range: { from: toDateOnlyString(range.from), to: toDateOnlyString(range.to) },
        };
    }

    private resolveDateRange(from?: string, to?: string): DateRange {
        if (!from || !to) {
            const end = parseDateOnly(toDateOnlyString(new Date()));
            const start = addUtcDays(end, -29);
            return { from: start, to: end };
        }

        const parsedFrom = parseDateOnly(from);
        const parsedTo = parseDateOnly(to);

        if (parsedFrom > parsedTo) {
            throw new BadRequestException('from must be before or equal to to');
        }

        return { from: parsedFrom, to: parsedTo };
    }
}
