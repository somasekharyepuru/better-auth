import { BadRequestException } from '@nestjs/common';
import { HabitFrequency } from '@prisma/client';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  const prisma = {
    day: {
      findMany: jest.fn(),
    },
    habit: {
      findMany: jest.fn(),
    },
    focusSession: {
      findMany: jest.fn(),
    },
    lifeArea: {
      findMany: jest.fn(),
    },
    timeBlock: {
      findMany: jest.fn(),
    },
    timeBlockType: {
      findMany: jest.fn(),
    },
  } as any;

  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];

  function daysAgo(days: number) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - days);
    return date;
  }

  function weekdayFrom(daysAgoCount: number) {
    return daysAgo(daysAgoCount).getUTCDay();
  }

  function weekdayOffset(targetWeekday: number): number {
    const current = today.getUTCDay();
    return (current - targetWeekday + 7) % 7;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReportsService(prisma);
  });

  it('builds priority completion report with daily rates and rolling averages', async () => {
    prisma.day.findMany.mockResolvedValue([
      {
        date: new Date('2026-04-20T00:00:00.000Z'),
        priorities: [{ completed: true }, { completed: false }],
      },
      {
        date: new Date('2026-04-21T00:00:00.000Z'),
        priorities: [{ completed: true }],
      },
      {
        date: new Date('2026-04-22T00:00:00.000Z'),
        priorities: [{ completed: false }, { completed: false }],
      },
    ]);

    const result = await service.getPriorityCompletionReport('u1', {
      from: '2026-04-20',
      to: '2026-04-22',
    });

    expect(result.days).toEqual([
      { date: '2026-04-20', set: 2, completed: 1, rate: 0.5 },
      { date: '2026-04-21', set: 1, completed: 1, rate: 1 },
      { date: '2026-04-22', set: 2, completed: 0, rate: 0 },
    ]);

    expect(result.summary).toMatchObject({
      avgRate: 0.4,
      rolling7DayAvg: 0.5,
      rolling30DayAvg: 0.5,
      bestDay: { date: '2026-04-21', set: 1, completed: 1, rate: 1 },
      worstStreak: 1,
    });
  });

  it('builds habit completion report with expected/completed/rates', async () => {
    prisma.habit.findMany.mockResolvedValue([
      {
        id: 'h1',
        name: 'Read',
        emoji: '📚',
        color: '#111111',
        frequency: HabitFrequency.DAILY,
        frequencyDays: [],
        targetCount: null,
        order: 0,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        logs: [
          { date: new Date('2026-04-01T00:00:00.000Z'), completed: true },
          { date: new Date('2026-04-02T00:00:00.000Z'), completed: true },
        ],
      },
    ]);

    const result = await service.getHabitCompletionReport('u1', {
      from: '2026-04-01',
      to: '2026-04-04',
      activeOnly: true,
    });

    expect(prisma.habit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'u1', isActive: true }),
      }),
    );

    expect(result.habits[0]).toMatchObject({
      id: 'h1',
      expected: 4,
      completed: 2,
      completionRate: 0.5,
    });
    expect(result.summary.overallRate).toBe(0.5);
  });

  it('applies lifeArea filter and supports activeOnly=false', async () => {
    prisma.habit.findMany.mockResolvedValue([]);

    await service.getHabitCompletionReport('u2', {
      from: '2026-04-01',
      to: '2026-04-07',
      lifeAreaId: 'la1',
      activeOnly: false,
    });

    expect(prisma.habit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'u2',
          lifeAreaId: 'la1',
          isArchived: false,
        }),
      }),
    );

    const whereArg = prisma.habit.findMany.mock.calls[0][0].where;
    expect(whereArg.isActive).toBeUndefined();
  });

  it('prorates X_PER_WEEK expected counts for partial week ranges', async () => {
    prisma.habit.findMany.mockResolvedValue([
      {
        id: 'h2',
        name: 'Workout',
        emoji: null,
        color: '#222222',
        frequency: HabitFrequency.X_PER_WEEK,
        frequencyDays: [],
        targetCount: 4,
        order: 0,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        logs: [],
      },
    ]);

    const result = await service.getHabitCompletionReport('u1', {
      from: '2026-04-01',
      to: '2026-04-03',
      activeOnly: true,
    });

    expect(result.habits[0].expected).toBeCloseTo(1.71, 2);
    expect(result.habits[0].completionRate).toBe(0);
  });

  it('throws when from is after to', async () => {
    await expect(
      service.getHabitCompletionReport('u1', {
        from: '2026-04-10',
        to: '2026-04-01',
        activeOnly: true,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('builds habit streak report with history and break date', async () => {
    prisma.habit.findMany.mockResolvedValue([
      {
        id: 'h1',
        name: 'Read',
        emoji: '📚',
        color: '#111111',
        frequency: HabitFrequency.DAILY,
        frequencyDays: [],
        targetCount: null,
        order: 0,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        logs: [
          { date: daysAgo(0), completed: true },
          { date: daysAgo(1), completed: true },
          { date: daysAgo(3), completed: true },
        ],
      },
    ]);

    const result = await service.getHabitStreaksReport('u1', {
      activeOnly: true,
    });

    expect(prisma.habit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'u1', isActive: true }),
      }),
    );

    expect(result.habits[0]).toMatchObject({
      id: 'h1',
      currentStreak: 2,
      bestStreak: 2,
      lastBrokenDate: todayKey ? daysAgo(2).toISOString().split('T')[0] : null,
      daysToBeatBest: 0,
    });
    expect(result.habits[0].history).toHaveLength(2);
    expect(result.summary).toMatchObject({
      totalHabits: 1,
      activeStreaks: 1,
      averageCurrentStreak: 2,
      averageBestStreak: 2,
    });
  });

  it('keeps weekly habits streaks across non-scheduled days', async () => {
    const mondayOffset = weekdayOffset(1);
    const olderMondayOffset = mondayOffset + 7;

    prisma.habit.findMany.mockResolvedValue([
      {
        id: 'h2',
        name: 'Weekly Review',
        emoji: null,
        color: '#222222',
        frequency: HabitFrequency.WEEKLY,
        frequencyDays: [1],
        targetCount: null,
        order: 0,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        logs: [
          { date: daysAgo(mondayOffset), completed: true },
          { date: daysAgo(olderMondayOffset), completed: true },
        ],
      },
    ]);

    const result = await service.getHabitStreaksReport('u1', {
      activeOnly: true,
    });

    expect(result.habits[0]).toMatchObject({
      id: 'h2',
      currentStreak: 2,
      bestStreak: 2,
      daysToBeatBest: 0,
    });
  });

  it('builds habit consistency report with streak bonus and capped score', async () => {
    const rangeStart = new Date('2026-04-01T00:00:00.000Z');
    const fullCompletionLogs = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(rangeStart.getTime() + i * 86400000),
      completed: true,
    }));

    prisma.habit.findMany.mockResolvedValue([
      {
        id: 'h1',
        name: 'Read',
        emoji: '📚',
        color: '#111111',
        frequency: HabitFrequency.DAILY,
        frequencyDays: [],
        targetCount: null,
        order: 0,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        logs: fullCompletionLogs,
      },
      {
        id: 'h2',
        name: 'Workout',
        emoji: null,
        color: '#222222',
        frequency: HabitFrequency.DAILY,
        frequencyDays: [],
        targetCount: null,
        order: 1,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        logs: fullCompletionLogs.map((log, idx) => ({
          date: log.date,
          completed: idx < 15,
        })),
      },
    ]);

    const result = await service.getHabitConsistencyReport('u1', {
      from: '2026-04-01',
      to: '2026-04-30',
      activeOnly: true,
    });

    expect(result.habits[0]).toMatchObject({
      id: 'h1',
      expected: 30,
      completed: 30,
      streakBonus: 10,
      score: 100,
    });
    expect(result.habits[1]).toMatchObject({
      id: 'h2',
      expected: 30,
      completed: 15,
      score: 50,
    });

    expect(result.summary).toMatchObject({
      averageScore: 75,
      bestHabit: expect.objectContaining({ id: 'h1', score: 100 }),
      worstHabit: expect.objectContaining({ id: 'h2', score: 50 }),
    });
  });

  it('builds habits by life area report with average completion rates', async () => {
    prisma.habit.findMany.mockResolvedValue([
      {
        id: 'h1',
        name: 'Read',
        emoji: '📚',
        color: '#111111',
        frequency: HabitFrequency.DAILY,
        frequencyDays: [],
        targetCount: null,
        lifeAreaId: 'la1',
        order: 0,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        logs: [
          { date: new Date('2026-04-01T00:00:00.000Z'), completed: true },
          { date: new Date('2026-04-02T00:00:00.000Z'), completed: true },
        ],
      },
      {
        id: 'h2',
        name: 'Workout',
        emoji: null,
        color: '#222222',
        frequency: HabitFrequency.DAILY,
        frequencyDays: [],
        targetCount: null,
        lifeAreaId: 'la1',
        order: 1,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        logs: [{ date: new Date('2026-04-01T00:00:00.000Z'), completed: true }],
      },
      {
        id: 'h3',
        name: 'Meditate',
        emoji: null,
        color: '#333333',
        frequency: HabitFrequency.DAILY,
        frequencyDays: [],
        targetCount: null,
        lifeAreaId: 'la2',
        order: 2,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        logs: [],
      },
    ]);

    prisma.lifeArea.findMany.mockResolvedValue([
      { id: 'la1', name: 'Health', color: '#22C55E' },
      { id: 'la2', name: 'Mind', color: '#3B82F6' },
    ]);

    const result = await service.getHabitsByLifeAreaReport('u1', {
      from: '2026-04-01',
      to: '2026-04-02',
      activeOnly: true,
    });

    expect(result.areas).toEqual([
      {
        lifeAreaId: 'la1',
        name: 'Health',
        color: '#22C55E',
        habitCount: 2,
        averageCompletionRate: 0.75,
      },
      {
        lifeAreaId: 'la2',
        name: 'Mind',
        color: '#3B82F6',
        habitCount: 1,
        averageCompletionRate: 0,
      },
    ]);

    expect(result.summary).toMatchObject({
      areaCount: 2,
      bestLifeArea: expect.objectContaining({ lifeAreaId: 'la1' }),
      neglectedLifeArea: expect.objectContaining({ lifeAreaId: 'la2' }),
    });
  });

  it('builds habit failure patterns by day of week', async () => {
    prisma.habit.findMany.mockResolvedValue([
      {
        id: 'h1',
        name: 'Read',
        emoji: '📚',
        color: '#111111',
        frequency: HabitFrequency.DAILY,
        frequencyDays: [],
        targetCount: null,
        lifeAreaId: 'la1',
        order: 0,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        logs: [
          { date: new Date('2026-04-20T00:00:00.000Z'), completed: true }, // Mon
          { date: new Date('2026-04-21T00:00:00.000Z'), completed: true }, // Tue
          { date: new Date('2026-04-22T00:00:00.000Z'), completed: false },
        ],
      },
    ]);

    const result = await service.getHabitFailurePatternsReport('u1', {
      from: '2026-04-20',
      to: '2026-04-22',
      activeOnly: true,
    });

    expect(result.days.find((day) => day.dayOfWeek === 1)).toMatchObject({
      label: 'Mon',
      expected: 1,
      completed: 1,
      skipped: 0,
      skipRate: 0,
    });
    expect(result.days.find((day) => day.dayOfWeek === 3)).toMatchObject({
      label: 'Wed',
      expected: 1,
      completed: 0,
      skipped: 1,
      skipRate: 1,
    });

    expect(result.summary).toMatchObject({
      habitCount: 1,
      mostSkippedDay: expect.objectContaining({ dayOfWeek: 3, skipRate: 1 }),
      safestDay: expect.objectContaining({ dayOfWeek: 2, skipRate: 0 }),
    });
  });

  it('builds focus session completion report with daily breakdown and summary', async () => {
    prisma.focusSession.findMany.mockResolvedValue([
      {
        startedAt: new Date('2026-04-20T10:00:00.000Z'),
        completed: true,
        interrupted: false,
      },
      {
        startedAt: new Date('2026-04-20T12:00:00.000Z'),
        completed: false,
        interrupted: true,
      },
      {
        startedAt: new Date('2026-04-21T09:00:00.000Z'),
        completed: false,
        interrupted: false,
      },
    ]);

    const result = await service.getFocusSessionCompletionReport('u1', {
      from: '2026-04-20',
      to: '2026-04-21',
    });

    expect(prisma.focusSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          timeBlock: { day: { userId: 'u1' } },
        }),
      }),
    );

    expect(result.days).toEqual([
      {
        date: '2026-04-20',
        total: 2,
        completed: 1,
        interrupted: 1,
        abandoned: 0,
      },
      {
        date: '2026-04-21',
        total: 1,
        completed: 0,
        interrupted: 0,
        abandoned: 1,
      },
    ]);

    expect(result.summary).toMatchObject({
      totalSessions: 3,
      completionRate: 0.3333,
      interruptionRate: 0.3333,
      abandonedRate: 0.3333,
      bestDay: {
        date: '2026-04-20',
        completionRate: 0.5,
        total: 2,
      },
      worstDay: {
        date: '2026-04-21',
        completionRate: 0,
        total: 1,
      },
    });
  });

  it('filters focus sessions by session type', async () => {
    prisma.focusSession.findMany.mockResolvedValue([]);

    await service.getFocusSessionCompletionReport('u1', {
      from: '2026-04-20',
      to: '2026-04-21',
      sessionType: 'focus',
    });

    expect(prisma.focusSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ sessionType: 'focus' }),
      }),
    );
  });

  it('builds total deep work time report with daily buckets and summary', async () => {
    prisma.focusSession.findMany
      .mockResolvedValueOnce([
        {
          startedAt: new Date('2026-04-20T10:00:00.000Z'),
          endedAt: new Date('2026-04-20T10:30:00.000Z'),
          duration: 1800,
          targetDuration: 1500,
        },
        {
          startedAt: new Date('2026-04-20T12:00:00.000Z'),
          endedAt: new Date('2026-04-20T12:45:00.000Z'),
          duration: 2700,
          targetDuration: 1800,
        },
        {
          startedAt: new Date('2026-04-21T09:00:00.000Z'),
          endedAt: new Date('2026-04-21T09:25:00.000Z'),
          duration: 1500,
          targetDuration: null,
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await service.getTotalDeepWorkTimeReport('u1', {
      from: '2026-04-20',
      to: '2026-04-21',
    });

    expect(result.periods).toEqual([
      { date: '2026-04-20', focusMinutes: 75, targetMinutes: 55, sessionCount: 2 },
      { date: '2026-04-21', focusMinutes: 25, targetMinutes: 0, sessionCount: 1 },
    ]);

    expect(result.summary).toMatchObject({
      totalFocusMinutes: 100,
      totalTargetMinutes: 55,
      averageSessionLength: 33.33,
      efficiencyRate: 1.8182,
      completedSessions: 3,
      peakDay: { date: '2026-04-20', focusMinutes: 75, targetMinutes: 55, sessionCount: 2 },
      trend: null,
    });
  });

  it('computes total deep work trend when a previous period exists', async () => {
    prisma.focusSession.findMany
      .mockResolvedValueOnce([
        {
          startedAt: new Date('2026-04-20T10:00:00.000Z'),
          endedAt: new Date('2026-04-20T11:00:00.000Z'),
          duration: 3600,
          targetDuration: 3600,
        },
      ])
      .mockResolvedValueOnce([
        {
          startedAt: new Date('2026-04-13T10:00:00.000Z'),
          endedAt: new Date('2026-04-13T10:30:00.000Z'),
          duration: 1800,
        },
      ]);

    const result = await service.getTotalDeepWorkTimeReport('u1', {
      from: '2026-04-20',
      to: '2026-04-20',
    });

    expect(result.summary.trend).toMatchObject({
      previousFocusMinutes: 30,
      change: 1,
    });
  });

  it('builds interruption frequency report with hour and day breakdowns', async () => {
    prisma.focusSession.findMany
      .mockResolvedValueOnce([
        {
          startedAt: new Date('2026-04-20T09:00:00.000Z'),
          endedAt: new Date('2026-04-20T09:15:00.000Z'),
        },
        {
          startedAt: new Date('2026-04-20T09:30:00.000Z'),
          endedAt: new Date('2026-04-20T10:00:00.000Z'),
        },
        {
          startedAt: new Date('2026-04-21T14:00:00.000Z'),
          endedAt: new Date('2026-04-21T14:10:00.000Z'),
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await service.getInterruptionFrequencyReport('u1', {
      from: '2026-04-20',
      to: '2026-04-21',
    });

    expect(result.interruptionsByHour[9]).toMatchObject({
      hour: 9,
      interruptions: 2,
    });
    expect(result.interruptionsByDay[1]).toMatchObject({
      dayOfWeek: 1,
      label: 'Mon',
      interruptions: 2,
    });
    expect(result.summary).toMatchObject({
      totalInterruptions: 3,
      averageTimeBeforeInterruptionMinutes: 18.33,
      peakHour: { hour: 9, interruptions: 2 },
      peakDay: { dayOfWeek: 1, label: 'Mon', interruptions: 2 },
      trend: null,
    });
  });

  it('computes interruption trend when a previous period exists', async () => {
    prisma.focusSession.findMany
      .mockResolvedValueOnce([
        {
          startedAt: new Date('2026-04-20T09:00:00.000Z'),
          endedAt: new Date('2026-04-20T09:15:00.000Z'),
        },
      ])
      .mockResolvedValueOnce([
        {
          startedAt: new Date('2026-04-13T09:00:00.000Z'),
          endedAt: new Date('2026-04-13T09:30:00.000Z'),
        },
        {
          startedAt: new Date('2026-04-13T10:00:00.000Z'),
          endedAt: new Date('2026-04-13T10:10:00.000Z'),
        },
      ]);

    const result = await service.getInterruptionFrequencyReport('u1', {
      from: '2026-04-20',
      to: '2026-04-20',
    });

    expect(result.summary.trend).toMatchObject({
      previousInterruptions: 2,
      change: -0.5,
    });
  });

  it('builds best focus times report with ranked hours and days', async () => {
    prisma.focusSession.findMany.mockResolvedValue([
      {
        startedAt: new Date('2026-04-20T09:00:00.000Z'),
        endedAt: new Date('2026-04-20T10:00:00.000Z'),
        duration: 3000,
        completed: true,
        interrupted: false,
      },
      {
        startedAt: new Date('2026-04-20T09:30:00.000Z'),
        endedAt: new Date('2026-04-20T10:30:00.000Z'),
        duration: 3600,
        completed: true,
        interrupted: false,
      },
      {
        startedAt: new Date('2026-04-20T14:00:00.000Z'),
        endedAt: new Date('2026-04-20T14:20:00.000Z'),
        duration: 1200,
        completed: false,
        interrupted: true,
      },
      {
        startedAt: new Date('2026-04-21T11:00:00.000Z'),
        endedAt: new Date('2026-04-21T11:45:00.000Z'),
        duration: 2700,
        completed: true,
        interrupted: false,
      },
      {
        startedAt: new Date('2026-04-21T14:00:00.000Z'),
        endedAt: new Date('2026-04-21T14:15:00.000Z'),
        duration: 900,
        completed: false,
        interrupted: true,
      },
    ]);

    const result = await service.getBestFocusTimesReport('u1', {
      from: '2026-04-20',
      to: '2026-04-21',
    });

    expect(result.summary.bestHour).toMatchObject({
      hour: 9,
      completionRate: 1,
      avgDurationMinutes: 55,
      productivityScore: 55,
    });
    expect(result.summary.worstHour).toMatchObject({
      hour: 14,
      completionRate: 0,
      avgDurationMinutes: 0,
      productivityScore: 0,
    });
    expect(result.summary.bestDay).toMatchObject({
      dayOfWeek: 1,
      label: 'Mon',
      interruptionRate: 0.3333,
    });
    expect(result.summary.topHours[0]).toMatchObject({ hour: 9 });
    expect(result.heatmap.find((cell) => cell.dayOfWeek === 1 && cell.hour === 9)).toMatchObject({
      sessions: 2,
      completionRate: 1,
      avgDurationMinutes: 55,
      productivityScore: 55,
    });
  });

  it('builds focus trends report by week with wow changes', async () => {
    prisma.focusSession.findMany.mockResolvedValue([
      {
        startedAt: new Date('2026-04-13T09:00:00.000Z'),
        endedAt: new Date('2026-04-13T09:30:00.000Z'),
        completed: true,
        duration: 1800,
      },
      {
        startedAt: new Date('2026-04-14T10:00:00.000Z'),
        endedAt: new Date('2026-04-14T10:20:00.000Z'),
        completed: false,
        duration: 1200,
      },
      {
        startedAt: new Date('2026-04-21T11:00:00.000Z'),
        endedAt: new Date('2026-04-21T11:45:00.000Z'),
        completed: true,
        duration: 2700,
      },
      {
        startedAt: new Date('2026-04-22T11:00:00.000Z'),
        endedAt: new Date('2026-04-22T11:30:00.000Z'),
        completed: true,
        duration: 1800,
      },
      {
        startedAt: new Date('2026-04-23T12:00:00.000Z'),
        endedAt: new Date('2026-04-23T12:15:00.000Z'),
        completed: false,
        duration: 900,
      },
    ]);

    const result = await service.getFocusTrendsReport('u1', {
      from: '2026-04-13',
      to: '2026-04-26',
    });

    expect(result.weeks).toEqual([
      {
        week: '2026-04-13',
        totalSessions: 2,
        completedSessions: 1,
        deepWorkMinutes: 50,
        completionRate: 0.5,
      },
      {
        week: '2026-04-20',
        totalSessions: 3,
        completedSessions: 2,
        deepWorkMinutes: 90,
        completionRate: 0.6667,
      },
    ]);

    expect(result.summary).toMatchObject({
      totalSessions: 5,
      totalCompletedSessions: 3,
      totalDeepWorkMinutes: 140,
      completionRate: 0.6,
      wow: {
        sessions: 0.5,
        completedSessions: 1,
        deepWorkMinutes: 0.8,
      },
    });
  });

  it('builds focus hours report with daily buckets and summary', async () => {
    prisma.timeBlock.findMany
      .mockResolvedValueOnce([
        {
          startTime: new Date('2026-04-20T10:00:00.000Z'),
          endTime: new Date('2026-04-20T12:30:00.000Z'),
          day: { date: new Date('2026-04-20T00:00:00.000Z') },
        },
        {
          startTime: new Date('2026-04-20T14:00:00.000Z'),
          endTime: new Date('2026-04-20T15:00:00.000Z'),
          day: { date: new Date('2026-04-20T00:00:00.000Z') },
        },
        {
          startTime: new Date('2026-04-21T09:00:00.000Z'),
          endTime: new Date('2026-04-21T10:30:00.000Z'),
          day: { date: new Date('2026-04-21T00:00:00.000Z') },
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await service.getFocusHoursReport('u1', {
      from: '2026-04-20',
      to: '2026-04-21',
      category: 'focus',
    });

    expect(prisma.timeBlock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: 'focus',
          day: expect.objectContaining({ userId: 'u1' }),
        }),
      }),
    );

    expect(result.periods).toEqual([
      { date: '2026-04-20', hours: 3.5, blockCount: 2 },
      { date: '2026-04-21', hours: 1.5, blockCount: 1 },
    ]);
    expect(result.summary).toMatchObject({
      totalHours: 5,
      avgPerDay: 2.5,
      activeDays: 2,
      peak: { date: '2026-04-20', hours: 3.5, blockCount: 2 },
      trend: null,
    });
  });

  it('filters focus hours by life area and type and computes trend when prior period exists', async () => {
    prisma.timeBlock.findMany
      .mockResolvedValueOnce([
        {
          startTime: new Date('2026-04-20T10:00:00.000Z'),
          endTime: new Date('2026-04-20T11:00:00.000Z'),
          day: { date: new Date('2026-04-20T00:00:00.000Z') },
        },
      ])
      .mockResolvedValueOnce([
        {
          startTime: new Date('2026-04-18T10:00:00.000Z'),
          endTime: new Date('2026-04-18T12:00:00.000Z'),
        },
      ]);

    const result = await service.getFocusHoursReport('u1', {
      from: '2026-04-20',
      to: '2026-04-20',
      lifeAreaId: 'la1',
      type: 'Deep Work',
    });

    expect(prisma.timeBlock.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          category: 'focus',
          type: 'Deep Work',
          day: expect.objectContaining({ lifeAreaId: 'la1' }),
        }),
      }),
    );

    expect(result.summary.trend).toMatchObject({
      previousHours: 2,
      change: -0.5,
    });
  });

  it('builds time block category breakdown with percentages and focus ratio', async () => {
    prisma.timeBlock.findMany
      .mockResolvedValueOnce([
        {
          category: 'focus',
          startTime: new Date('2026-04-20T10:00:00.000Z'),
          endTime: new Date('2026-04-20T13:00:00.000Z'),
        },
        {
          category: 'meeting',
          startTime: new Date('2026-04-20T14:00:00.000Z'),
          endTime: new Date('2026-04-20T15:00:00.000Z'),
        },
        {
          category: 'admin',
          startTime: new Date('2026-04-21T09:00:00.000Z'),
          endTime: new Date('2026-04-21T10:00:00.000Z'),
        },
      ])
      .mockResolvedValueOnce([
        {
          category: 'focus',
          startTime: new Date('2026-04-18T10:00:00.000Z'),
          endTime: new Date('2026-04-18T11:00:00.000Z'),
        },
      ]);

    const result = await service.getTimeBlockCategoryBreakdown('u1', {
      from: '2026-04-20',
      to: '2026-04-21',
    });

    expect(prisma.timeBlock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          day: expect.objectContaining({ userId: 'u1' }),
        }),
      }),
    );

    expect(result.categories).toEqual([
      {
        category: 'focus',
        hours: 3,
        blockCount: 1,
        percentage: 0.6,
        previousHours: 1,
        change: 2,
      },
      {
        category: 'meeting',
        hours: 1,
        blockCount: 1,
        percentage: 0.2,
        previousHours: null,
        change: null,
      },
      {
        category: 'admin',
        hours: 1,
        blockCount: 1,
        percentage: 0.2,
        previousHours: null,
        change: null,
      },
    ]);

    expect(result.summary).toMatchObject({
      totalHours: 5,
      focusHours: 3,
      focusRatio: 0.6,
      categoryCount: 3,
      peakCategory: {
        category: 'focus',
        hours: 3,
        blockCount: 1,
        percentage: 0.6,
        previousHours: 1,
        change: 2,
      },
    });
  });

  it('filters category breakdown by life area and type', async () => {
    prisma.timeBlock.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await service.getTimeBlockCategoryBreakdown('u1', {
      from: '2026-04-20',
      to: '2026-04-21',
      lifeAreaId: 'la1',
      type: 'Deep Work',
    });

    expect(prisma.timeBlock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: 'Deep Work',
          day: expect.objectContaining({ lifeAreaId: 'la1' }),
        }),
      }),
    );
  });

  it('builds time block type distribution with metadata enrichment and fallback types', async () => {
    prisma.timeBlock.findMany
      .mockResolvedValueOnce([
        {
          type: 'Deep Work',
          startTime: new Date('2026-04-20T10:00:00.000Z'),
          endTime: new Date('2026-04-20T13:00:00.000Z'),
        },
        {
          type: 'Meeting',
          startTime: new Date('2026-04-20T14:00:00.000Z'),
          endTime: new Date('2026-04-20T15:00:00.000Z'),
        },
        {
          type: 'Custom Focus',
          startTime: new Date('2026-04-21T09:00:00.000Z'),
          endTime: new Date('2026-04-21T10:30:00.000Z'),
        },
      ])
      .mockResolvedValueOnce([]);
    prisma.timeBlockType.findMany.mockResolvedValue([
      { name: 'Deep Work', color: '#3B82F6', icon: 'brain', isActive: true },
      { name: 'Meeting', color: '#8B5CF6', icon: 'users', isActive: true },
    ]);

    const result = await service.getTimeBlockTypeDistribution('u1', {
      from: '2026-04-20',
      to: '2026-04-21',
    });

    expect(prisma.timeBlock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          day: expect.objectContaining({ userId: 'u1' }),
        }),
      }),
    );
    expect(prisma.timeBlockType.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } }),
    );

    expect(result.types).toEqual([
      {
        type: 'Deep Work',
        name: 'Deep Work',
        color: '#3B82F6',
        icon: 'brain',
        hours: 3,
        blockCount: 1,
        percentage: 0.5455,
        previousHours: null,
        change: null,
      },
      {
        type: 'Custom Focus',
        name: 'Custom Focus',
        color: '#6366F1',
        icon: null,
        hours: 1.5,
        blockCount: 1,
        percentage: 0.2727,
        previousHours: null,
        change: null,
      },
      {
        type: 'Meeting',
        name: 'Meeting',
        color: '#8B5CF6',
        icon: 'users',
        hours: 1,
        blockCount: 1,
        percentage: 0.1818,
        previousHours: null,
        change: null,
      },
    ]);

    expect(result.summary).toMatchObject({
      totalHours: 5.5,
      typeCount: 3,
      focusHours: 3,
      focusRatio: 0.5455,
      mostUsedType: expect.objectContaining({ type: 'Deep Work', hours: 3 }),
      leastUsedType: expect.objectContaining({ type: 'Meeting', hours: 1 }),
    });
  });

  it('filters type distribution by life area', async () => {
    prisma.timeBlock.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    prisma.timeBlockType.findMany.mockResolvedValue([]);

    await service.getTimeBlockTypeDistribution('u1', {
      from: '2026-04-20',
      to: '2026-04-21',
      lifeAreaId: 'la1',
    });

    expect(prisma.timeBlock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          day: expect.objectContaining({ lifeAreaId: 'la1' }),
        }),
      }),
    );
  });

  it('builds calendar vs manual blocks report with weekly buckets and summary', async () => {
    prisma.timeBlock.findMany
      .mockResolvedValueOnce([
        {
          isFromCalendar: false,
          startTime: new Date('2026-04-20T10:00:00.000Z'),
          endTime: new Date('2026-04-20T13:00:00.000Z'),
          day: { date: new Date('2026-04-20T00:00:00.000Z') },
        },
        {
          isFromCalendar: true,
          startTime: new Date('2026-04-21T14:00:00.000Z'),
          endTime: new Date('2026-04-21T16:00:00.000Z'),
          day: { date: new Date('2026-04-21T00:00:00.000Z') },
        },
        {
          isFromCalendar: false,
          startTime: new Date('2026-04-27T09:00:00.000Z'),
          endTime: new Date('2026-04-27T11:00:00.000Z'),
          day: { date: new Date('2026-04-27T00:00:00.000Z') },
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await service.getCalendarVsManualBlocksReport('u1', {
      from: '2026-04-20',
      to: '2026-04-27',
    });

    expect(prisma.timeBlock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          day: expect.objectContaining({ userId: 'u1' }),
        }),
      }),
    );

    expect(result.periods).toEqual([
      {
        week: '2026-04-20',
        manualHours: 3,
        calendarHours: 2,
        totalHours: 5,
        manualPercentage: 0.6,
      },
      {
        week: '2026-04-27',
        manualHours: 2,
        calendarHours: 0,
        totalHours: 2,
        manualPercentage: 1,
      },
    ]);

    expect(result.summary).toMatchObject({
      totalHours: 7,
      totalManualHours: 5,
      totalCalendarHours: 2,
      manualPercentage: 0.7143,
      calendarPercentage: 0.2857,
      trend: null,
    });
  });

  it('computes calendar vs manual trend when a previous period exists', async () => {
    prisma.timeBlock.findMany
      .mockResolvedValueOnce([
        {
          isFromCalendar: false,
          startTime: new Date('2026-04-20T10:00:00.000Z'),
          endTime: new Date('2026-04-20T12:00:00.000Z'),
          day: { date: new Date('2026-04-20T00:00:00.000Z') },
        },
      ])
      .mockResolvedValueOnce([
        {
          isFromCalendar: false,
          startTime: new Date('2026-04-13T10:00:00.000Z'),
          endTime: new Date('2026-04-13T11:00:00.000Z'),
        },
      ]);

    const result = await service.getCalendarVsManualBlocksReport('u1', {
      from: '2026-04-20',
      to: '2026-04-20',
      lifeAreaId: 'la1',
    });

    expect(result.summary.trend).toMatchObject({
      previousManualPercentage: 1,
      change: 0,
    });
  });

  it('builds schedule density report with daily buckets and summary', async () => {
    prisma.timeBlock.findMany.mockResolvedValue([
      {
        startTime: new Date('2026-04-20T09:00:00.000Z'),
        endTime: new Date('2026-04-20T13:00:00.000Z'),
        day: { date: new Date('2026-04-20T00:00:00.000Z') },
      },
      {
        startTime: new Date('2026-04-20T15:00:00.000Z'),
        endTime: new Date('2026-04-20T18:00:00.000Z'),
        day: { date: new Date('2026-04-20T00:00:00.000Z') },
      },
      {
        startTime: new Date('2026-04-21T10:00:00.000Z'),
        endTime: new Date('2026-04-21T11:00:00.000Z'),
        day: { date: new Date('2026-04-21T00:00:00.000Z') },
      },
      {
        startTime: new Date('2026-04-22T10:00:00.000Z'),
        endTime: new Date('2026-04-22T20:00:00.000Z'),
        day: { date: new Date('2026-04-22T00:00:00.000Z') },
      },
    ]);

    const result = await service.getScheduleDensityReport('u1', {
      from: '2026-04-20',
      to: '2026-04-22',
    });

    expect(result.periods).toEqual([
      { date: '2026-04-20', hours: 7, blockCount: 2 },
      { date: '2026-04-21', hours: 1, blockCount: 1 },
      { date: '2026-04-22', hours: 10, blockCount: 1 },
    ]);

    expect(result.summary).toMatchObject({
      totalHours: 18,
      averageHoursPerDay: 6,
      overScheduledDays: 1,
      underScheduledDays: 1,
      idealRangeDays: 1,
      peakDay: { date: '2026-04-22', hours: 10, blockCount: 1 },
      troughDay: { date: '2026-04-21', hours: 1, blockCount: 1 },
    });
  });

  it('builds time distribution by life area with unassigned time', async () => {
    prisma.timeBlock.findMany.mockResolvedValue([
      {
        startTime: new Date('2026-04-20T10:00:00.000Z'),
        endTime: new Date('2026-04-20T12:00:00.000Z'),
        day: { lifeAreaId: 'la1' },
      },
      {
        startTime: new Date('2026-04-20T13:00:00.000Z'),
        endTime: new Date('2026-04-20T16:00:00.000Z'),
        day: { lifeAreaId: 'la2' },
      },
      {
        startTime: new Date('2026-04-21T09:00:00.000Z'),
        endTime: new Date('2026-04-21T10:00:00.000Z'),
        day: { lifeAreaId: null },
      },
    ]);

    prisma.lifeArea.findMany.mockResolvedValue([
      { id: 'la1', name: 'Health', color: '#22C55E' },
      { id: 'la2', name: 'Career', color: '#3B82F6' },
    ]);

    const result = await service.getTimeDistributionByLifeAreaReport('u1', {
      from: '2026-04-20',
      to: '2026-04-21',
    });

    expect(result.areas).toEqual([
      {
        lifeAreaId: 'la2',
        name: 'Career',
        color: '#3B82F6',
        hours: 3,
        blockCount: 1,
        percentage: 0.5,
      },
      {
        lifeAreaId: 'la1',
        name: 'Health',
        color: '#22C55E',
        hours: 2,
        blockCount: 1,
        percentage: 0.3333,
      },
      {
        lifeAreaId: null,
        name: 'Unassigned',
        color: '#9CA3AF',
        hours: 1,
        blockCount: 1,
        percentage: 0.1667,
      },
    ]);

    expect(result.summary).toMatchObject({
      totalHours: 6,
      unassignedHours: 1,
      areaCount: 2,
      topLifeArea: expect.objectContaining({ lifeAreaId: 'la2', hours: 3 }),
    });
  });
});
