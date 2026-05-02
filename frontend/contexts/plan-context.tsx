'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  subscriptionApi,
  MySubscriptionResponse,
  PlanType,
  PlanLimits,
  DailyUsage,
  isUnlimited,
  meetsRequirement,
} from '@/lib/subscription-api';

// ─── Context shape ────────────────────────────────────────────────────────────

interface PlanContextValue {
  plan: PlanType;
  limits: PlanLimits;
  usage: DailyUsage;
  subscription: MySubscriptionResponse['subscription'];
  isLoading: boolean;
  /** Can the user access this boolean feature flag? */
  canAccess: (feature: keyof PlanLimits) => boolean;
  /** Has the user hit a daily numeric limit? */
  hasReachedLimit: (metric: 'priorities' | 'pomodoro') => boolean;
  /** How many slots remain for a given metric (-1 = unlimited) */
  remaining: (metric: 'priorities' | 'pomodoro' | 'lifeAreas' | 'habits' | 'calendars') => number;
  /** Refresh plan data (e.g. after a successful checkout redirect) */
  refresh: () => Promise<void>;
}

// ─── Defaults (FREE plan) ─────────────────────────────────────────────────────

const FREE_LIMITS: PlanLimits = {
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
  canJoinOrg: false,
};

const FREE_USAGE: DailyUsage = {
  prioritiesCreatedToday: 0,
  pomodoroSessionsToday: 0,
  activeLifeAreas: 0,
  activeHabits: 0,
  calendarConnections: 0,
};

const PlanContext = createContext<PlanContextValue>({
  plan: 'FREE',
  limits: FREE_LIMITS,
  usage: FREE_USAGE,
  subscription: null,
  isLoading: true,
  canAccess: () => false,
  hasReachedLimit: () => false,
  remaining: () => -1,
  refresh: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<MySubscriptionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const result = await subscriptionApi.getMySubscription();
      setData(result);
    } catch {
      // Silently fail — treat as free plan
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const plan = data?.plan ?? 'FREE';
  const limits = data?.limits ?? FREE_LIMITS;
  const usage = data?.usage ?? FREE_USAGE;
  const subscription = data?.subscription ?? null;

  const canAccess = useCallback(
    (feature: keyof PlanLimits): boolean => {
      const val = limits[feature];
      if (typeof val === 'boolean') return val;
      if (typeof val === 'number') return isUnlimited(val) || val > 0;
      return false;
    },
    [limits],
  );

  const hasReachedLimit = useCallback(
    (metric: 'priorities' | 'pomodoro'): boolean => {
      if (metric === 'priorities') {
        return !isUnlimited(limits.maxDailyPriorities) &&
          usage.prioritiesCreatedToday >= limits.maxDailyPriorities;
      }
      if (metric === 'pomodoro') {
        return !isUnlimited(limits.maxDailyPomodoro) &&
          usage.pomodoroSessionsToday >= limits.maxDailyPomodoro;
      }
      return false;
    },
    [limits, usage],
  );

  const remaining = useCallback(
    (metric: 'priorities' | 'pomodoro' | 'lifeAreas' | 'habits' | 'calendars'): number => {
      const map = {
        priorities: { max: limits.maxDailyPriorities, used: usage.prioritiesCreatedToday },
        pomodoro: { max: limits.maxDailyPomodoro, used: usage.pomodoroSessionsToday },
        lifeAreas: { max: limits.maxLifeAreas, used: usage.activeLifeAreas },
        habits: { max: limits.maxActiveHabits, used: usage.activeHabits },
        calendars: { max: limits.maxCalendarConnections, used: usage.calendarConnections },
      };
      const { max, used } = map[metric];
      if (isUnlimited(max)) return -1;
      return Math.max(0, max - used);
    },
    [limits, usage],
  );

  return (
    <PlanContext.Provider
      value={{
        plan,
        limits,
        usage,
        subscription,
        isLoading,
        canAccess,
        hasReachedLimit,
        remaining,
        refresh: fetchData,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlan() {
  return useContext(PlanContext);
}

/** Convenience: check if user is on or above a required plan */
export function usePlanMeets(required: PlanType) {
  const { plan } = usePlan();
  return meetsRequirement(plan, required);
}
