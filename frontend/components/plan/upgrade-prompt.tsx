'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlanType, PlanLimits, planLabel, subscriptionApi } from '@/lib/subscription-api';

// ─── Feature metadata ─────────────────────────────────────────────────────────

const FEATURE_META: Partial<Record<keyof PlanLimits, { label: string; description: string; icon: string }>> = {
  eisenhowerMatrix: {
    label: 'Eisenhower Matrix',
    description: 'Prioritize tasks by urgency and importance. Build a strategic view of your work.',
    icon: '📊',
  },
  decisionLog: {
    label: 'Decision Log',
    description: 'Track key decisions, context, and outcomes. Stop re-litigating old choices.',
    icon: '📝',
  },
  mobileFullAccess: {
    label: 'Full Mobile App',
    description: 'Access all features from the native iOS and Android app.',
    icon: '📱',
  },
  canJoinOrg: {
    label: 'Organization Workspace',
    description: 'Join team workspaces and collaborate with colleagues.',
    icon: '🏢',
  },
};

// ─── Inline banner (used when hitting a daily limit) ─────────────────────────

interface LimitBannerProps {
  metric: string;
  current: number;
  max: number;
  onUpgrade?: () => void;
}

export function LimitBanner({ metric, current, max, onUpgrade }: LimitBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  if (dismissed) return null;

  const handleUpgrade = () => {
    if (onUpgrade) { onUpgrade(); return; }
    router.push('/pricing');
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-800 dark:bg-amber-950/30">
      <span className="shrink-0 text-amber-500">⚡</span>
      <p className="flex-1 text-amber-800 dark:text-amber-200">
        You've used {current}/{max} {metric} today.{' '}
        <button
          onClick={handleUpgrade}
          className="font-semibold underline underline-offset-2 hover:no-underline"
        >
          Upgrade for unlimited
        </button>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-amber-400 hover:text-amber-600"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Feature gate card (used inside locked pages/sections) ────────────────────

interface UpgradePromptProps {
  feature: keyof PlanLimits;
  requiredPlan?: PlanType;
  className?: string;
}

export function UpgradePrompt({ feature, requiredPlan = 'PREMIUM', className = '' }: UpgradePromptProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const meta = FEATURE_META[feature];

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await subscriptionApi.checkoutIndividual('MONTHLY');
    } catch {
      router.push('/pricing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center ${className}`}>
      <div className="mb-3 text-4xl">{meta?.icon ?? '🔒'}</div>
      <h3 className="mb-1 text-lg font-semibold text-foreground">
        {meta?.label ?? 'Premium Feature'}
      </h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        {meta?.description ?? 'This feature requires a Premium plan.'}
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Redirecting…' : `Upgrade to ${planLabel(requiredPlan)}`}
        </button>
        <button
          onClick={() => router.push('/pricing')}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
        >
          See all plans
        </button>
      </div>
    </div>
  );
}

// ─── Usage badge (shown next to section titles) ───────────────────────────────

interface UsageBadgeProps {
  current: number;
  max: number;         // -1 = unlimited
  label?: string;
}

export function UsageBadge({ current, max, label }: UsageBadgeProps) {
  if (max === -1) return null;

  const pct = Math.min(100, (current / max) * 100);
  const atLimit = current >= max;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        atLimit
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          : 'bg-muted text-muted-foreground'
      }`}
      title={label}
    >
      {current}/{max}
    </span>
  );
}
