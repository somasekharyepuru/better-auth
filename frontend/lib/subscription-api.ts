/**
 * Daymark Subscription API client
 * All plan / billing calls go through here.
 */

const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3002';

export type PlanType = 'FREE' | 'PREMIUM' | 'TEAM' | 'ENTERPRISE';
export type BillingInterval = 'MONTHLY' | 'ANNUAL';

export interface PlanLimits {
  maxDailyPriorities: number;   // -1 = unlimited
  maxDailyPomodoro: number;
  maxLifeAreas: number;
  maxActiveHabits: number;
  historyDays: number;
  maxCalendarConnections: number;
  eisenhowerMatrix: boolean;
  decisionLog: boolean;
  mobileFullAccess: boolean;
  canCreateOrg: boolean;
  canJoinOrg: boolean;
}

export interface DailyUsage {
  prioritiesCreatedToday: number;
  pomodoroSessionsToday: number;
  activeLifeAreas: number;
  activeHabits: number;
  calendarConnections: number;
}

export interface SubscriptionInfo {
  status: string;
  billingInterval: BillingInterval | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  isTrialing: boolean;
}

export interface MySubscriptionResponse {
  plan: PlanType;
  limits: PlanLimits;
  subscription: SubscriptionInfo | null;
  usage: DailyUsage;
}

export interface OrgSubscriptionResponse {
  plan: PlanType;
  subscription: {
    status: string;
    billingInterval: BillingInterval | null;
    seatCount: number;
    seatLimit: number;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  memberCount: number;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(err?.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export const subscriptionApi = {
  /** Get current user's plan, limits and daily usage */
  getMySubscription: () =>
    apiFetch<MySubscriptionResponse>('/api/subscription/me'),

  /** Check if user qualifies for a free 14-day trial */
  getTrialEligibility: () =>
    apiFetch<{ eligible: boolean }>('/api/subscription/trial-eligibility'),

  /** Get org plan, seats, member count */
  getOrgSubscription: (orgId: string) =>
    apiFetch<OrgSubscriptionResponse>(`/api/subscription/org/${orgId}`),

  // ─── Checkout ──────────────────────────────────────────────────────────────

  /** Redirect to Stripe Checkout for Premium plan */
  checkoutIndividual: async (interval: BillingInterval): Promise<void> => {
    const { url } = await apiFetch<{ url: string }>('/api/subscription/checkout/individual', {
      method: 'POST',
      body: JSON.stringify({ interval }),
    });
    window.location.href = url;
  },

  /** Redirect to Stripe Checkout for Team plan */
  checkoutTeam: async (orgId: string, seats: number, interval: BillingInterval): Promise<void> => {
    const { url } = await apiFetch<{ url: string }>('/api/subscription/checkout/team', {
      method: 'POST',
      body: JSON.stringify({ orgId, seats, interval }),
    });
    window.location.href = url;
  },

  // ─── Billing portal ────────────────────────────────────────────────────────

  openBillingPortal: async (): Promise<void> => {
    const returnUrl = window.location.href;
    const { url } = await apiFetch<{ url: string }>('/api/subscription/portal', {
      method: 'POST',
      body: JSON.stringify({ returnUrl }),
    });
    window.location.href = url;
  },

  openOrgBillingPortal: async (orgId: string): Promise<void> => {
    const returnUrl = window.location.href;
    const { url } = await apiFetch<{ url: string }>(`/api/subscription/org/${orgId}/portal`, {
      method: 'POST',
      body: JSON.stringify({ returnUrl }),
    });
    window.location.href = url;
  },

  // ─── Seats ─────────────────────────────────────────────────────────────────

  updateOrgSeats: (orgId: string, seats: number) =>
    apiFetch(`/api/subscription/org/${orgId}/seats`, {
      method: 'POST',
      body: JSON.stringify({ seats }),
    }),

  // ─── Trial ─────────────────────────────────────────────────────────────────

  activateTrial: () =>
    apiFetch<{ message: string }>('/api/subscription/trial/activate', { method: 'POST' }),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isUnlimited(value: number) {
  return value === -1 || value === Infinity;
}

export function planLabel(plan: PlanType): string {
  return { FREE: 'Free', PREMIUM: 'Premium', TEAM: 'Team', ENTERPRISE: 'Enterprise' }[plan];
}

export function planOrder(plan: PlanType): number {
  return { FREE: 0, PREMIUM: 1, TEAM: 2, ENTERPRISE: 3 }[plan];
}

export function meetsRequirement(userPlan: PlanType, required: PlanType): boolean {
  return planOrder(userPlan) >= planOrder(required);
}
