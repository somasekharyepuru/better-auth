'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePlan } from '@/contexts/plan-context';
import { subscriptionApi, isUnlimited, planLabel } from '@/lib/subscription-api';

function UsageBar({ label, current, max }: { label: string; current: number; max: number }) {
  if (isUnlimited(max)) {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-green-600">Unlimited</span>
      </div>
    );
  }
  const pct = Math.min(100, Math.round((current / max) * 100));
  const atLimit = current >= max;
  return (
    <div className="py-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`text-sm font-medium ${atLimit ? 'text-red-600' : 'text-foreground'}`}>
          {current} / {max}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${atLimit ? 'bg-red-500' : 'bg-primary'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function BillingSettingsPage() {
  const { plan, limits, usage, subscription, isLoading, refresh } = usePlan();
  const [portalLoading, setPortalLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Refresh plan data after a successful Stripe redirect
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      refresh();
    }
  }, [searchParams, refresh]);

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      await subscriptionApi.openBillingPortal();
    } catch {
      router.push('/pricing');
    } finally {
      setPortalLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        Loading billing info…
      </div>
    );
  }

  const isFree = plan === 'FREE';
  const isTrialing = subscription?.isTrialing;
  const trialEnd = subscription?.trialEnd ? new Date(subscription.trialEnd) : null;
  const periodEnd = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="mt-1 text-muted-foreground">Manage your subscription and usage.</p>
      </div>

      {/* Current plan card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{planLabel(plan)} Plan</h2>
              {isTrialing && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  Trial
                </span>
              )}
              {subscription?.status === 'PAST_DUE' && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  Payment failed
                </span>
              )}
            </div>

            {isFree && (
              <p className="mt-1 text-sm text-muted-foreground">
                Free forever · no credit card required
              </p>
            )}
            {isTrialing && trialEnd && (
              <p className="mt-1 text-sm text-amber-600">
                Trial ends {trialEnd.toLocaleDateString()} · No CC charged unless you subscribe
              </p>
            )}
            {!isFree && !isTrialing && subscription?.billingInterval && periodEnd && (
              <p className="mt-1 text-sm text-muted-foreground">
                Billed {subscription.billingInterval === 'ANNUAL' ? 'annually' : 'monthly'} ·
                {subscription.cancelAtPeriodEnd
                  ? ` Cancels ${periodEnd.toLocaleDateString()}`
                  : ` Renews ${periodEnd.toLocaleDateString()}`}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {isFree ? (
              <button
                onClick={() => router.push('/pricing')}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Upgrade
              </button>
            ) : (
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                {portalLoading ? 'Loading…' : 'Manage billing'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Daily usage */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-semibold">Today's usage</h2>
        <div className="divide-y divide-border">
          <UsageBar label="Daily priorities" current={usage.prioritiesCreatedToday} max={limits.maxDailyPriorities} />
          <UsageBar label="Pomodoro sessions" current={usage.pomodoroSessionsToday} max={limits.maxDailyPomodoro} />
        </div>
      </div>

      {/* Account limits */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-semibold">Account limits</h2>
        <div className="divide-y divide-border">
          <UsageBar label="Life Areas" current={usage.activeLifeAreas} max={limits.maxLifeAreas} />
          <UsageBar label="Active habits" current={usage.activeHabits} max={limits.maxActiveHabits} />
          <UsageBar label="Calendar connections" current={usage.calendarConnections} max={limits.maxCalendarConnections} />
        </div>
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          {[
            { label: 'Review history', value: isUnlimited(limits.historyDays) ? 'Unlimited' : `Last ${limits.historyDays} days` },
            { label: 'Eisenhower Matrix', value: limits.eisenhowerMatrix ? '✓ Included' : '✕ Not included' },
            { label: 'Decision Log', value: limits.decisionLog ? '✓ Included' : '✕ Not included' },
            { label: 'Organization workspaces', value: limits.canJoinOrg ? '✓ Included' : '✕ Not included' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className={`text-sm font-medium ${value.startsWith('✕') ? 'text-muted-foreground/50' : value.startsWith('✓') ? 'text-green-600' : ''}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {isFree && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
          <p className="font-semibold">Ready for unlimited planning?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Premium is $12/month or $100/year. Data is always preserved if you downgrade.
          </p>
          <button
            onClick={() => router.push('/pricing')}
            className="mt-4 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            View plans
          </button>
        </div>
      )}
    </div>
  );
}
