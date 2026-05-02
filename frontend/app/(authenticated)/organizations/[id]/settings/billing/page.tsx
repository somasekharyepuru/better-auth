'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  subscriptionApi,
  OrgSubscriptionResponse,
  BillingInterval,
  planLabel,
} from '@/lib/subscription-api';

export default function OrgBillingPage() {
  const { id: orgId } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<OrgSubscriptionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [interval, setInterval] = useState<BillingInterval>('ANNUAL');
  const [seats, setSeats] = useState(3);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [seatLoading, setSeatLoading] = useState(false);

  const fetchData = async () => {
    try {
      const result = await subscriptionApi.getOrgSubscription(orgId);
      setData(result);
      if (result.subscription) {
        setSeats(result.subscription.seatCount);
        if (result.subscription.billingInterval) {
          setInterval(result.subscription.billingInterval.toLowerCase() as BillingInterval);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [orgId]);

  // Refresh after Stripe redirect
  useEffect(() => {
    if (searchParams.get('success') === 'true') fetchData();
  }, [searchParams]);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      await subscriptionApi.checkoutTeam(orgId, seats, interval);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleBillingPortal = async () => {
    setPortalLoading(true);
    try {
      await subscriptionApi.openOrgBillingPortal(orgId);
    } catch {
      router.push('/pricing');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpdateSeats = async (newSeats: number) => {
    if (newSeats < 3) return;
    setSeatLoading(true);
    try {
      await subscriptionApi.updateOrgSeats(orgId, newSeats);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSeatLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-40 items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const sub = data?.subscription;
  const isActive = sub?.status === 'ACTIVE';
  const memberCount = data?.memberCount ?? 0;
  const seatLimit = sub?.seatLimit ?? 0;
  const atSeatLimit = memberCount >= seatLimit;
  const periodEnd = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;

  const monthlyTotal = interval === 'ANNUAL'
    ? ((84 * seats) / 12).toFixed(2)
    : (10 * seats).toFixed(2);

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Organization Billing</h1>
        <p className="mt-1 text-muted-foreground">Manage your team plan and seats.</p>
      </div>

      {/* Active subscription */}
      {isActive && sub ? (
        <>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{planLabel(data!.plan)} Plan</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {sub.billingInterval === 'ANNUAL' ? 'Annual billing' : 'Monthly billing'}
                  {periodEnd && ` · ${sub.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} ${periodEnd.toLocaleDateString()}`}
                </p>
              </div>
              <button
                onClick={handleBillingPortal}
                disabled={portalLoading}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                {portalLoading ? 'Loading…' : 'Manage billing'}
              </button>
            </div>
          </div>

          {/* Seat management */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-semibold">Seat management</h2>

            {/* Usage bar */}
            <div className="mb-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Members</span>
                <span className={`text-sm font-medium ${atSeatLimit ? 'text-red-600' : ''}`}>
                  {memberCount} / {seatLimit} seats used
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${atSeatLimit ? 'bg-red-500' : 'bg-primary'}`}
                  style={{ width: `${Math.min(100, (memberCount / seatLimit) * 100)}%` }}
                />
              </div>
              {atSeatLimit && (
                <p className="mt-2 text-sm text-red-600">
                  Seat limit reached. Add more seats below to invite new members.
                </p>
              )}
            </div>

            {/* Seat adjuster */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Adjust seats:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSeats(Math.max(Math.max(3, memberCount), seats - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded border border-border hover:bg-muted"
                >
                  −
                </button>
                <span className="w-10 text-center font-semibold">{seats}</span>
                <button
                  onClick={() => setSeats(seats + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded border border-border hover:bg-muted"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => handleUpdateSeats(seats)}
                disabled={seatLoading || seats === sub.seatCount}
                className="ml-auto rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {seatLoading ? 'Updating…' : 'Update seats'}
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Seat changes are prorated and billed immediately. Minimum 3 seats.
            </p>
          </div>
        </>
      ) : (
        /* No active subscription — show upgrade flow */
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-1 font-semibold">Upgrade to Team</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            $10/seat/month · $84/seat/year · Minimum 3 seats
          </p>

          {/* Billing interval */}
          <div className="mb-4 inline-flex rounded-lg border border-border p-1">
            {(['MONTHLY', 'ANNUAL'] as BillingInterval[]).map((i) => (
              <button
                key={i}
                onClick={() => setInterval(i)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  interval === i ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                {i === 'ANNUAL' ? 'Annual (save 30%)' : 'Monthly'}
              </button>
            ))}
          </div>

          {/* Seat picker */}
          <div className="mb-6 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Seats:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSeats(Math.max(3, seats - 1))}
                className="flex h-8 w-8 items-center justify-center rounded border border-border hover:bg-muted"
              >
                −
              </button>
              <span className="w-10 text-center font-semibold">{seats}</span>
              <button
                onClick={() => setSeats(seats + 1)}
                className="flex h-8 w-8 items-center justify-center rounded border border-border hover:bg-muted"
              >
                +
              </button>
            </div>
            <span className="ml-auto text-sm font-semibold">
              ~${monthlyTotal}/mo total
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={checkoutLoading}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {checkoutLoading ? 'Redirecting to checkout…' : `Start Team plan · ${seats} seats`}
          </button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            30-day money-back guarantee · Data preserved if you cancel
          </p>
        </div>
      )}

      {/* Enterprise CTA */}
      <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
        <p className="font-medium">Need Enterprise?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          SSO, full audit logs, dedicated support, and custom pricing.
        </p>
        <a
          href="mailto:sales@daymark.app?subject=Enterprise+inquiry"
          className="mt-3 inline-block rounded-lg border border-border px-5 py-2 text-sm font-medium hover:bg-muted"
        >
          Contact sales →
        </a>
      </div>
    </div>
  );
}
