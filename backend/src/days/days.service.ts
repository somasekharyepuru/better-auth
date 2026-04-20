import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DaysService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get or create a day for the given date, user, and life area
   */
  async getOrCreateDay(
    userId: string,
    dateStr: string,
    lifeAreaId?: string | null,
  ) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    // Try to find existing day with the specific lifeAreaId
    let day = await this.prisma.day.findFirst({
      where: {
        userId,
        date,
        lifeAreaId: lifeAreaId || null,
      },
      include: {
        priorities: { orderBy: { order: "asc" } },
        discussionItems: { orderBy: { order: "asc" } },
        timeBlocks: { orderBy: { startTime: "asc" } },
        quickNote: true,
        dailyReview: true,
        lifeArea: true,
      },
    });

    if (!day) {
      day = await this.prisma.day.create({
        data: {
          userId,
          date,
          lifeAreaId: lifeAreaId || null,
        },
        include: {
          priorities: { orderBy: { order: "asc" } },
          discussionItems: { orderBy: { order: "asc" } },
          timeBlocks: { orderBy: { startTime: "asc" } },
          quickNote: true,
          dailyReview: true,
          lifeArea: true,
        },
      });
    }

    return day;
  }

  /**
   * Get day progress - how many priorities completed (per life area)
   */
  async getDayProgress(
    userId: string,
    dateStr: string,
    lifeAreaId?: string | null,
  ) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    const day = await this.prisma.day.findFirst({
      where: {
        userId,
        date,
        lifeAreaId: lifeAreaId || null,
      },
      include: {
        priorities: true,
      },
    });

    if (!day) {
      return { total: 0, completed: 0 };
    }

    const total = day.priorities.length;
    const completed = day.priorities.filter((p) => p.completed).length;

    return { total, completed };
  }

  /**
   * Get a lightweight summary for every date in [start, end] inclusive.
   *
   * Returns one entry per calendar date even when no `Day` row exists yet
   * (we never auto-create rows here — week/month overviews must stay read-only).
   *
   * IMPORTANT: storage normalization here MUST match `getOrCreateDay` exactly
   * (`new Date(str)` then `setHours(0,0,0,0)`) or rows won't be found. We
   * additionally key the response by the ORIGINAL input string so we never
   * have to round-trip a stored Date back to a YYYY-MM-DD — which is fragile
   * across timezones (a stored Date for "2026-04-20" can read back as
   * "2026-04-19" in negative-UTC zones).
   */
  async getRangeSummary(
    userId: string,
    startStr: string,
    endStr: string,
    lifeAreaId?: string | null,
  ) {
    if (!this.isValidIsoDate(startStr) || !this.isValidIsoDate(endStr)) {
      return [];
    }
    if (startStr > endStr) {
      return [];
    }

    // Hard cap to protect the API: ~3 months max
    const MAX_DAYS = 100;
    const diffDays = this.diffDaysIso(startStr, endStr) + 1;
    if (diffDays > MAX_DAYS) {
      throw new Error(`Range too large: ${diffDays} days (max ${MAX_DAYS})`);
    }

    const start = this.parseStoredDate(startStr);
    const end = this.parseStoredDate(endStr);

    const days = await this.prisma.day.findMany({
      where: {
        userId,
        lifeAreaId: lifeAreaId || null,
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        priorities: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            completed: true,
            order: true,
          },
        },
        timeBlocks: {
          orderBy: { startTime: "asc" },
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            type: true,
          },
        },
        quickNote: { select: { id: true } },
        dailyReview: { select: { id: true } },
      },
    });

    // Index existing days by their stored Date's epoch ms. We never derive an
    // ISO key from `day.date` itself (see header comment above).
    const byTime = new Map<number, (typeof days)[number]>();
    for (const day of days) {
      byTime.set(day.date.getTime(), day);
    }

    const result: Array<{
      date: string;
      dayId: string | null;
      lifeAreaId: string | null;
      priorities: Array<{
        id: string;
        title: string;
        completed: boolean;
        order: number;
      }>;
      prioritiesTotal: number;
      prioritiesCompleted: number;
      timeBlocks: Array<{
        id: string;
        title: string;
        startTime: Date;
        endTime: Date;
        type: string;
      }>;
      timeBlocksCount: number;
      hasQuickNote: boolean;
      hasReview: boolean;
    }> = [];

    let cursorIso = startStr;
    while (cursorIso <= endStr) {
      const cursorTime = this.parseStoredDate(cursorIso).getTime();
      const day = byTime.get(cursorTime);
      if (day) {
        result.push({
          date: cursorIso,
          dayId: day.id,
          lifeAreaId: day.lifeAreaId ?? null,
          priorities: day.priorities,
          prioritiesTotal: day.priorities.length,
          prioritiesCompleted: day.priorities.filter((p) => p.completed).length,
          timeBlocks: day.timeBlocks,
          timeBlocksCount: day.timeBlocks.length,
          hasQuickNote: !!day.quickNote,
          hasReview: !!day.dailyReview,
        });
      } else {
        result.push({
          date: cursorIso,
          dayId: null,
          lifeAreaId: lifeAreaId || null,
          priorities: [],
          prioritiesTotal: 0,
          prioritiesCompleted: 0,
          timeBlocks: [],
          timeBlocksCount: 0,
          hasQuickNote: false,
          hasReview: false,
        });
      }
      cursorIso = this.addDaysIso(cursorIso, 1);
    }

    return result;
  }

  /**
   * Match the existing `getOrCreateDay` parsing exactly so range lookups hit
   * the same stored Date values. Do not "fix" this in isolation — it must
   * stay byte-for-byte equivalent to how rows are written.
   */
  private parseStoredDate(isoDateStr: string): Date {
    const date = new Date(isoDateStr);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private isValidIsoDate(s: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const t = Date.parse(s);
    return !Number.isNaN(t);
  }

  /**
   * Compute calendar-day delta between two YYYY-MM-DD strings without
   * relying on Date arithmetic (which drifts across DST + timezone changes).
   */
  private diffDaysIso(a: string, b: string): number {
    const [ay, am, ad] = a.split("-").map(Number);
    const [by, bm, bd] = b.split("-").map(Number);
    const utcA = Date.UTC(ay, am - 1, ad);
    const utcB = Date.UTC(by, bm - 1, bd);
    return Math.round((utcB - utcA) / 86_400_000);
  }

  /**
   * Add `n` calendar days to a YYYY-MM-DD string and return YYYY-MM-DD.
   * Done via UTC math so it never shifts across DST boundaries.
   */
  private addDaysIso(iso: string, n: number): string {
    const [y, m, d] = iso.split("-").map(Number);
    const next = new Date(Date.UTC(y, m - 1, d + n));
    const ny = next.getUTCFullYear();
    const nm = String(next.getUTCMonth() + 1).padStart(2, "0");
    const nd = String(next.getUTCDate()).padStart(2, "0");
    return `${ny}-${nm}-${nd}`;
  }

  /**
   * Verify day belongs to user
   */
  async verifyDayOwnership(dayId: string, userId: string) {
    const day = await this.prisma.day.findUnique({
      where: { id: dayId },
    });

    if (!day || day.userId !== userId) {
      throw new UnauthorizedException("Access denied");
    }

    return day;
  }
}
