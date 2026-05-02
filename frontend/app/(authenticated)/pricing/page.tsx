'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlan } from '@/contexts/plan-context';
import { subscriptionApi, BillingInterval, PlanType, planLabel } from '@/lib/subscription-api';

// ─── Plan data ────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'FREE' as PlanType,
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Start planning your day with the essentials.',
    cta: 'Current plan',
    ctaAction: null,
    features: [
      '3 daily priorities',
      '3 Pomodoro sessions/day',
      '2 Life Areas',
      '3 active habits',
      '7-day review history',
      '1 calendar connection',
      'Basic time blocking',
      'Daily review',
    ],
    locked: [
      'Eisenhower Matrix',
      'Decision Log',
      'Full mobile app',
      'Organization workspaces',
      'Multi-calendar sync',
    ],
  },
  {
    id: 'PREMIUM' as PlanType,
    name: 'Premium',
    monthlyPrice: 12,
    annualPrice: 100,
    description: 'Unlimited planning with powerful productivity tools.',
    cta: 'Start Premium',
    highlighted: true,
    badge: 'Most popular',
    features: [
      'Unlimited daily priorities',
      'Unlimited Pomodoro sessions',
      'Unlimited Life Areas',
      'Unlimited habits',
      'Full review history',
      'All calendar connections',
      'Eisenhower Matrix',
      'Decision Log',
      'Full mobile app (iOS & Android)',
      'Priority support (24hr)',
      'Early access to new features',
    ],
  },
  {
    id: 'TEAM' as PlanType,
    name: 'Team',
    monthlyPrice: 10,
    annualPrice: 84,
    perSeat: true,
    minSeats: 3,
    description: 'All Premium features for your whole team.',
    cta: 'Start Team plan',
    features: [
      'Everything in Premium (per seat)',
      'Organization workspace',
      'Admin console',
      'Custom roles & permissions',
      'Member & team management',
      '90-day audit log',
      'Centralized billing',
      'Priority support',
    ],
  },
  {
    id: 'ENTERPRISE' as PlanType,
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    description: 'For companies needing compliance and dedicated support.',
    cta: 'Contact sales',
    features: [
      'Everything in Team',
      'SSO / SAML',
      'Full audit log + export',
      'Custom password policy',
      'Dedicated account manager',
      '99.9% SLA',
      'Invoice billing',
      'Custom data retention',
      'Onboarding & training call',
    ],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const { plan: currentPlan, subscription, isLoading } = usePlan();
  const [interval, setInterval] = useState<BillingInterval>('ANNUAL');
  const [seats, setSeats] = useState(3);
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const router = useRouter();

  const handleSelectPlan = async (planId: PlanType) => {
    setLoadingPlan(planId);

    try {
      if (planId === 'PREMIUM') {
        await subscriptionApi.checkoutIndividual(interval);
      } else if (planId === 'TEAM') {
        // For team, we need an org — send to org creation flow first
        router.push('/organizations/create?upgrade=team');
      } else if (planId === 'ENTERPRISE') {
        window.open('mailto:sales@daymark.app?subject=Enterprise+inquiry', '_blank');
      }
    } catch (err) {
      console.error('Checkout error', err);
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      await subscriptionApi.openBillingPortal();
    } catch {
      router.push('/settings/billing');
    }
  };

  const annualSavingsPct = Math.round((1 - 100 / (12 * 12)) * 100); // 31%

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Choose your plan</h1>
        <p className="mt-2 text-muted-foreground">
          Start free. Upgrade when you're ready for unlimited planning.
        </p>

        {/* Billing toggle */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted p-1">
          <button
            onClick={() => setInterval('MONTHLY')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              interval === 'MONTHLY'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('ANNUAL')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              interval === 'ANNUAL'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Annual
            <span className="ml-1.5 rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
              Save {annualSavingsPct}%
            </span>
          </button>
        </div>
      </div>

      {/* Active subscription banner */}
      {currentPlan !== 'FREE' && !isLoading && (
        <div className="mb-8 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-5 py-4">
          <div>
            <span className="font-semibold text-primary">
              You're on {planLabel(currentPlan)}
            </span>
            {subscription?.isTrialing && subscription?.trialEnd && (
              <span className="ml-2 text-sm text-muted-foreground">
                · Trial ends {new Date(subscription.trialEnd).toLocaleDateString()}
              </span>
            )}
            {subscription?.cancelAtPeriodEnd && subscription?.currentPeriodEnd && (
              <span className="ml-2 text-sm text-amber-600">
                · Cancels {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            )}
          </div>
          <button
            onClick={handleManageBilling}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Manage billing
          </button>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((p) => {
          const isCurrentPlan = currentPlan === p.id;
          const price =
            p.monthlyPrice === null
              ? null
              : interval === 'ANNUAL'
              ? p.annualPrice
              : p.monthlyPrice;
          const perMonth =
            interval === 'ANNUAL' && p.annualPrice
              ? (p.annualPrice / 12).toFixed(2)
              : null;

          return (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl border p-6 transition-shadow hover:shadow-md ${
                (p as any).highlighted
                  ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary'
                  : 'border-border bg-card'
              }`}
            >
              {/* Badge */}
              {(p as any).badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    {(p as any).badge}
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-lg font-bold">{p.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                {price === null ? (
                  <p className="text-2xl font-bold">Custom</p>
                ) : price === 0 ? (
                  <p className="text-2xl font-bold">Free</p>
                ) : (
                  <>
                    <p className="text-2xl font-bold">
                      ${interval === 'ANNUAL' && perMonth ? perMonth : price}
                      <span className="text-base font-normal text-muted-foreground">
                        /{(p as any).perSeat ? 'seat/' : ''}mo
                      </span>
                    </p>
                    {interval === 'ANNUAL' && price > 0 && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        ${price}/yr{(p as any).perSeat ? ' per seat' : ''}
                      </p>
                    )}
                    {(p as any).perSeat && (
                      <p className="mt-1 text-xs text-muted-foreground">Minimum 3 seats</p>
                    )}
                  </>
                )}
              </div>

              {/* Team seat picker */}
              {p.id === 'TEAM' && (
                <div className="mb-4 flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Seats:</label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSeats(Math.max(3, seats - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded border border-border text-sm hover:bg-muted"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{seats}</span>
                    <button
                      onClick={() => setSeats(seats + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-border text-sm hover:bg-muted"
                    >
                      +
                    </button>
                  </div>
                  {price !== null && (
                    <span className="ml-auto text-sm font-semibold">
                      ${(price * seats).toFixed(0)}/mo
                    </span>
                  )}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={() => handleSelectPlan(p.id)}
                disabled={isCurrentPlan || loadingPlan === p.id}
                className={`mb-6 w-full rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                  isCurrentPlan
                    ? 'border border-border bg-muted text-muted-foreground'
                    : (p as any).highlighted
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border border-border hover:bg-muted'
                }`}
              >
                {loadingPlan === p.id
                  ? 'Loading…'
                  : isCurrentPlan
                  ? '✓ Current plan'
                  : p.cta}
              </button>

              {/* Features */}
              <ul className="space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm">
                    <span className="mt-0.5 shrink-0 text-green-500">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
                {(p as any).locked?.map((f: string) => (
                  <li key={f} className="flex gap-2 text-sm text-muted-foreground/60">
                    <span className="mt-0.5 shrink-0">✕</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="mt-16 text-center">
        <p className="text-sm text-muted-foreground">
          All plans include a{' '}
          <strong>30-day money-back guarantee</strong>.
          Questions? Email{' '}
          <a href="mailto:hello@daymark.app" className="underline">
            hello@daymark.app
          </a>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Data is always preserved when you downgrade — no information is ever deleted.
        </p>
      </div>
    </div>
  );
}
