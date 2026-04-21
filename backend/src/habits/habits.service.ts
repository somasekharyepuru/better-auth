import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HabitFrequency } from '@prisma/client';

// ─── DTOs ──────────────────────────────────────────────────────────────────

export interface CreateHabitDto {
  name: string;
  description?: string;
  emoji?: string;
  color?: string;
  frequency?: HabitFrequency;
  /** For WEEKLY: day-of-week indices [0..6] */
  frequencyDays?: number[];
  /** For X_PER_WEEK / X_PER_MONTH: target count */
  targetCount?: number;
  lifeAreaId?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateHabitDto {
  name?: string;
  description?: string;
  emoji?: string;
  color?: string;
  frequency?: HabitFrequency;
  frequencyDays?: number[];
  targetCount?: number;
  lifeAreaId?: string | null;
  isArchived?: boolean;
  /** Pause (false) or resume (true) without archiving */
  isActive?: boolean;
  order?: number;
}

export interface LogHabitDto {
  /** ISO date string, e.g. "2026-04-21". Defaults to today. */
  date?: string;
  note?: string;
}

// ─── Streak helpers ─────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + n);
  return toDateStr(d);
}

/**
 * Returns true if the habit is "due" on the given date based on its frequency.
 * - DAILY: every day
 * - WEEKLY: only on the configured day-of-week indices
 * - X_PER_WEEK / X_PER_MONTH: every day is a candidate (the user picks when)
 */
function isDueOn(
  habit: { frequency: HabitFrequency; frequencyDays: number[] },
  dateStr: string,
): boolean {
  if (habit.frequency === 'DAILY') return true;
  if (habit.frequency === 'WEEKLY') {
    const dow = new Date(dateStr).getUTCDay();
    return habit.frequencyDays.includes(dow);
  }
  return true;
}

/**
 * Streak counts only "due" days. A missed off-day for a WEEKLY habit does
 * not break the streak.
 */
function computeStreaks(
  habit: { frequency: HabitFrequency; frequencyDays: number[] },
  logDates: string[],
): { currentStreak: number; longestStreak: number } {
  const logSet = new Set(logDates);
  if (logSet.size === 0) return { currentStreak: 0, longestStreak: 0 };

  const today = toDateStr(new Date());

  // Current streak: walk backwards from today across due days only.
  // Skip today if it's due but not yet logged (don't break the streak just
  // because it's still early in the day).
  let currentStreak = 0;
  let cursor = today;
  if (isDueOn(habit, cursor) && !logSet.has(cursor)) {
    cursor = addDays(cursor, -1);
  }
  while (true) {
    if (isDueOn(habit, cursor)) {
      if (logSet.has(cursor)) {
        currentStreak++;
      } else {
        break;
      }
    }
    cursor = addDays(cursor, -1);
    // Safety: don't walk further back than the earliest log
    if (cursor < (logDates[0] ?? today) && !logSet.has(cursor)) break;
  }

  // Longest streak: scan from earliest log forward across due days only.
  const sortedLogs = [...logSet].sort();
  const earliest = sortedLogs[0];
  let longest = 0;
  let run = 0;
  let scan = earliest;
  while (scan <= today) {
    if (isDueOn(habit, scan)) {
      if (logSet.has(scan)) {
        run++;
        if (run > longest) longest = run;
      } else {
        run = 0;
      }
    }
    scan = addDays(scan, 1);
  }

  return { currentStreak, longestStreak: Math.max(longest, currentStreak) };
}

/**
 * Completion rate over the last `windowDays`, denominated by the number of
 * days the habit was actually due in that window (not every calendar day).
 */
function computeCompletionRate(
  habit: { frequency: HabitFrequency; frequencyDays: number[] },
  logDates: string[],
  windowDays = 30,
): number {
  const logSet = new Set(logDates);
  const today = toDateStr(new Date());
  let due = 0;
  let done = 0;
  for (let i = 0; i < windowDays; i++) {
    const d = addDays(today, -i);
    if (!isDueOn(habit, d)) continue;
    due++;
    if (logSet.has(d)) done++;
  }
  if (due === 0) return 0;
  return Math.round((done / due) * 100);
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class HabitsService {
  constructor(private prisma: PrismaService) {}

  // ── List / today ──────────────────────────────────────────────────────────

  async getAllHabits(userId: string, includeInactive = false) {
    const habits = await this.prisma.habit.findMany({
      where: {
        userId,
        isArchived: false,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        lifeArea: { select: { id: true, name: true, color: true } },
        logs: { select: { date: true, completed: true, note: true } },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    return habits.map((h) => this.enrichHabit(h));
  }

  /**
   * Habits due on `dateStr` (YYYY-MM-DD): active, non-archived, with streak stats
   * and completion flag for that date.
   */
  async getHabitsForDate(userId: string, dateStr: string) {
    const habits = await this.prisma.habit.findMany({
      where: { userId, isArchived: false, isActive: true },
      include: {
        lifeArea: { select: { id: true, name: true, color: true } },
        logs: { select: { date: true, completed: true, note: true } },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    const todayStr = toDateStr(new Date());

    return habits
      .filter((h) => isDueOn(h, dateStr))
      .map((h) => {
        const enriched = this.enrichHabit(h);
        const dayLog = h.logs.find((l) => toDateStr(l.date) === dateStr);
        const completedForDate = dayLog?.completed ?? false;
        return {
          ...enriched,
          completedForDate,
          ...(dateStr === todayStr ? { completedToday: completedForDate } : {}),
        };
      });
  }

  async getTodayHabits(userId: string) {
    return this.getHabitsForDate(userId, toDateStr(new Date()));
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async createHabit(userId: string, data: CreateHabitDto) {
    if (data.lifeAreaId) {
      await this.assertLifeAreaOwnership(data.lifeAreaId, userId);
    }
    this.validateFrequency(data);

    const maxOrder = await this.prisma.habit.aggregate({
      where: { userId },
      _max: { order: true },
    });

    const habit = await this.prisma.habit.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        emoji: data.emoji,
        color: data.color ?? '#6366F1',
        frequency: data.frequency ?? 'DAILY',
        frequencyDays: data.frequencyDays ?? [],
        targetCount: data.targetCount,
        lifeAreaId: data.lifeAreaId,
        order: data.order ?? (maxOrder._max.order ?? 0) + 1,
        isActive: data.isActive ?? true,
      },
      include: {
        lifeArea: { select: { id: true, name: true, color: true } },
        logs: { select: { date: true, completed: true, note: true } },
      },
    });

    return this.enrichHabit(habit);
  }

  async updateHabit(id: string, userId: string, data: UpdateHabitDto) {
    await this.assertHabitOwnership(id, userId);

    if (data.lifeAreaId) {
      await this.assertLifeAreaOwnership(data.lifeAreaId, userId);
    }
    if (data.frequency) {
      this.validateFrequency(data);
    }

    const habit = await this.prisma.habit.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.emoji !== undefined && { emoji: data.emoji }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.frequency !== undefined && { frequency: data.frequency }),
        ...(data.frequencyDays !== undefined && {
          frequencyDays: data.frequencyDays,
        }),
        ...(data.targetCount !== undefined && { targetCount: data.targetCount }),
        ...(data.lifeAreaId !== undefined && { lifeAreaId: data.lifeAreaId }),
        ...(data.isArchived !== undefined && { isArchived: data.isArchived }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.order !== undefined && { order: data.order }),
      },
      include: {
        lifeArea: { select: { id: true, name: true, color: true } },
        logs: { select: { date: true, completed: true, note: true } },
      },
    });

    return this.enrichHabit(habit);
  }

  async deleteHabit(id: string, userId: string) {
    await this.assertHabitOwnership(id, userId);
    return this.prisma.habit.delete({ where: { id } });
  }

  async archiveHabit(id: string, userId: string) {
    await this.assertHabitOwnership(id, userId);
    return this.prisma.habit.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  // ── Logging ───────────────────────────────────────────────────────────────

  async logHabit(id: string, userId: string, data: LogHabitDto) {
    const existing = await this.assertHabitOwnership(id, userId);
    if (!existing.isActive) {
      throw new BadRequestException(
        'This habit is paused. Resume it in Work Habits to check in.',
      );
    }

    const dateStr = data.date ?? toDateStr(new Date());
    const date = new Date(dateStr);

    const log = await this.prisma.habitLog.upsert({
      where: { habitId_date: { habitId: id, date } },
      update: { completed: true, note: data.note },
      create: { habitId: id, date, completed: true, note: data.note },
    });

    return log;
  }

  async unlogHabit(id: string, userId: string, dateStr: string) {
    await this.assertHabitOwnership(id, userId);

    const date = new Date(dateStr);
    const log = await this.prisma.habitLog.findUnique({
      where: { habitId_date: { habitId: id, date } },
    });
    if (!log) {
      throw new NotFoundException('Log entry not found for that date');
    }

    return this.prisma.habitLog.delete({
      where: { habitId_date: { habitId: id, date } },
    });
  }

  async getHabitLogs(id: string, userId: string, days = 90) {
    await this.assertHabitOwnership(id, userId);

    const since = new Date(Date.now() - days * 86400000);

    const logs = await this.prisma.habitLog.findMany({
      where: { habitId: id, date: { gte: since } },
      orderBy: { date: 'desc' },
    });

    const habit = await this.prisma.habit.findUnique({
      where: { id },
      include: { logs: { select: { date: true } } },
    });

    const allDates = habit!.logs.map((l) => toDateStr(l.date));
    const streaks = computeStreaks(habit!, allDates);
    const completionRate = computeCompletionRate(habit!, allDates);

    return { logs, ...streaks, completionRate };
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private enrichHabit(habit: any) {
    const logDates: string[] = habit.logs.map((l: any) => toDateStr(l.date));
    const streaks = computeStreaks(habit, logDates);
    const completionRate = computeCompletionRate(habit, logDates);
    return { ...habit, ...streaks, completionRate };
  }

  private validateFrequency(
    data: Pick<CreateHabitDto, 'frequency' | 'frequencyDays' | 'targetCount'>,
  ) {
    if (
      data.frequency === 'WEEKLY' &&
      (!data.frequencyDays || data.frequencyDays.length === 0)
    ) {
      throw new BadRequestException(
        'frequencyDays is required for WEEKLY habits',
      );
    }
    if (
      (data.frequency === 'X_PER_WEEK' || data.frequency === 'X_PER_MONTH') &&
      !data.targetCount
    ) {
      throw new BadRequestException(
        'targetCount is required for X_PER_WEEK and X_PER_MONTH habits',
      );
    }
  }

  private async assertHabitOwnership(id: string, userId: string) {
    const habit = await this.prisma.habit.findFirst({ where: { id, userId } });
    if (!habit) throw new NotFoundException('Habit not found');
    return habit;
  }

  private async assertLifeAreaOwnership(lifeAreaId: string, userId: string) {
    const area = await this.prisma.lifeArea.findFirst({
      where: { id: lifeAreaId, userId, isArchived: false },
    });
    if (!area)
      throw new NotFoundException('Life area not found or does not belong to you');
  }
}
