import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanType } from '@prisma/client';

// ─── Limit definitions ───────────────────────────────────────────────────────

export const PLAN_LIMITS = {
  FREE: {
    maxDailyPriorities: 3,
    maxDailyPomodoro: 3,
    maxLifeAreas: 2,
    maxActiveHabits: 3,
    historyDays: 7,
    maxCalendarConnections: 1,
    eisenhowerMatrix: false,
    decisionLog: false,
    mobileFullAccess: false,
    canCreateOrg: false,
    canJoinOrg: false,      // Free users cannot join org workspaces
  },
  PREMIUM: {
    maxDailyPriorities: Infinity,
    maxDailyPomodoro: Infinity,
    maxLifeAreas: Infinity,
    maxActiveHabits: Infinity,
    historyDays: Infinity,
    maxCalendarConnections: Infinity,
    eisenhowerMatrix: true,
    decisionLog: true,
    mobileFullAccess: true,
    canCreateOrg: false,    // Premium can join but not create orgs
    canJoinOrg: true,
  },
  TEAM: {
    maxDailyPriorities: Infinity,
    maxDailyPomodoro: Infinity,
    maxLifeAreas: Infinity,
    maxActiveHabits: Infinity,
    historyDays: Infinity,
    maxCalendarConnections: Infinity,
    eisenhowerMatrix: true,
    decisionLog: true,
    mobileFullAccess: true,
    canCreateOrg: true,
    canJoinOrg: true,
    customRoles: true,
    auditLogDays: 90,
    adminConsole: true,
  },
  ENTERPRISE: {
    maxDailyPriorities: Infinity,
    maxDailyPomodoro: Infinity,
    maxLifeAreas: Infinity,
    maxActiveHabits: Infinity,
    historyDays: Infinity,
    maxCalendarConnections: Infinity,
    eisenhowerMatrix: true,
    decisionLog: true,
    mobileFullAccess: true,
    canCreateOrg: true,
    canJoinOrg: true,
    customRoles: true,
    auditLogDays: Infinity,
    adminConsole: true,
    sso: true,
    customPasswordPolicy: true,
    dataExport: true,
    sla: true,
  },
} as const;

export type PlanLimits = (typeof PLAN_LIMITS)[keyof typeof PLAN_LIMITS];
export type PlanFeatureKey = keyof typeof PLAN_LIMITS.FREE;

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class PlanLimitsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve the effective plan for a user.
   * Org membership (Team/Enterprise) takes precedence over individual subscription.
   * Data is always preserved — downgrade just re-applies limits.
   */
  async getUserPlan(userId: string): Promise<PlanType> {
    // 1. Check if user is an active org member with a paid org subscription
    const membership = await this.prisma.member.findFirst({
      where: { userId },
      include: {
        organization: {
          include: { orgSubscription: true },
        },
      },
    });

    const orgSub = membership?.organization?.orgSubscription;
    if (orgSub && (orgSub.status === 'ACTIVE' || orgSub.status === 'TRIALING')) {
      return orgSub.plan;
    }

    // 2. Fall back to individual subscription
    const sub = await this.prisma.userSubscription.findUnique({
      where: { userId },
    });

    if (sub && (sub.status === 'ACTIVE' || sub.status === 'TRIALING')) {
      return sub.plan;
    }

    return PlanType.FREE;
  }

  /** Get resolved limits for a user */
  async getLimitsForUser(userId: string) {
    const plan = await this.getUserPlan(userId);
    return { plan, limits: PLAN_LIMITS[plan] };
  }

  // ─── Daily limit checks ───────────────────────────────────────────────────

  async canCreatePriority(userId: string): Promise<{ allowed: boolean; current: number; max: number }> {
    const plan = await this.getUserPlan(userId);
    const max = PLAN_LIMITS[plan].maxDailyPriorities;

    if (max === Infinity) return { allowed: true, current: 0, max: -1 };

    const today = this.todayStart();
    const current = await this.prisma.topPriority.count({
      where: {
        day: {
          userId,
          date: { gte: today },
        },
      },
    });

    return { allowed: current < max, current, max };
  }

  async canStartPomodoroSession(userId: string): Promise<{ allowed: boolean; current: number; max: number }> {
    const plan = await this.getUserPlan(userId);
    const max = PLAN_LIMITS[plan].maxDailyPomodoro;

    if (max === Infinity) return { allowed: true, current: 0, max: -1 };

    const today = this.todayStart();
    const current = await this.prisma.focusSession.count({
      where: {
        startedAt: { gte: today },
        sessionType: 'focus',
        timeBlock: { day: { userId } },
      },
    });

    return { allowed: current < max, current, max };
  }

  async canCreateLifeArea(userId: string): Promise<{ allowed: boolean; current: number; max: number }> {
    const plan = await this.getUserPlan(userId);
    const max = PLAN_LIMITS[plan].maxLifeAreas;

    if (max === Infinity) return { allowed: true, current: 0, max: -1 };

    const current = await this.prisma.lifeArea.count({
      where: { userId, isArchived: false },
    });

    return { allowed: current < max, current, max };
  }

  async canCreateHabit(userId: string): Promise<{ allowed: boolean; current: number; max: number }> {
    const plan = await this.getUserPlan(userId);
    const max = PLAN_LIMITS[plan].maxActiveHabits;

    if (max === Infinity) return { allowed: true, current: 0, max: -1 };

    const current = await this.prisma.habit.count({
      where: { userId, isArchived: false, isActive: true },
    });

    return { allowed: current < max, current, max };
  }

  async canAddCalendarConnection(userId: string): Promise<{ allowed: boolean; current: number; max: number }> {
    const plan = await this.getUserPlan(userId);
    const max = PLAN_LIMITS[plan].maxCalendarConnections;

    if (max === Infinity) return { allowed: true, current: 0, max: -1 };

    const current = await this.prisma.calendarConnection.count({
      where: { userId, enabled: true },
    });

    return { allowed: current < max, current, max };
  }

  // ─── Feature flags ────────────────────────────────────────────────────────

  async canAccessEisenhower(userId: string): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    return PLAN_LIMITS[plan].eisenhowerMatrix;
  }

  async canAccessDecisionLog(userId: string): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    return PLAN_LIMITS[plan].decisionLog;
  }

  async canJoinOrg(userId: string): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    return PLAN_LIMITS[plan].canJoinOrg;
  }

  async canCreateOrg(userId: string): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    return PLAN_LIMITS[plan].canCreateOrg;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private todayStart(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /** Build a consistent ForbiddenException payload for plan-limit errors */
  static limitPayload(feature: string, current: number, max: number, requiredPlan = 'PREMIUM') {
    return {
      code: 'PLAN_LIMIT_REACHED',
      feature,
      current,
      max,
      requiredPlan,
      upgradeUrl: '/pricing',
    };
  }

  static featurePayload(feature: string, requiredPlan = 'PREMIUM') {
    return {
      code: 'FEATURE_NOT_AVAILABLE',
      feature,
      requiredPlan,
      upgradeUrl: '/pricing',
    };
  }

  static orgJoinPayload() {
    return {
      code: 'ORG_JOIN_RESTRICTED',
      message: 'Upgrade to Premium or Team to join an organization workspace.',
      requiredPlan: 'PREMIUM',
      upgradeUrl: '/pricing',
    };
  }
}
