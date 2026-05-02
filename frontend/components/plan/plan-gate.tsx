'use client';

import React from 'react';
import { usePlan } from '@/contexts/plan-context';
import { PlanType, PlanLimits, planLabel } from '@/lib/subscription-api';
import { UpgradePrompt } from './upgrade-prompt';

interface PlanGateProps {
  /** Boolean feature key from PlanLimits (e.g. 'eisenhowerMatrix') */
  feature: keyof PlanLimits;
  /** Minimum plan required. Defaults to PREMIUM. */
  requiredPlan?: PlanType;
  /** Custom locked state UI. Defaults to <UpgradePrompt />. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Renders children only when the current user's plan includes `feature`.
 * Otherwise renders a contextual upgrade prompt.
 *
 * Usage:
 *   <PlanGate feature="eisenhowerMatrix">
 *     <EisenhowerMatrix />
 *   </PlanGate>
 */
export function PlanGate({ feature, requiredPlan = 'PREMIUM', fallback, children }: PlanGateProps) {
  const { canAccess, isLoading } = usePlan();

  if (isLoading) return null;

  if (!canAccess(feature)) {
    return (
      <>
        {fallback ?? (
          <UpgradePrompt
            feature={feature}
            requiredPlan={requiredPlan}
          />
        )}
      </>
    );
  }

  return <>{children}</>;
}
