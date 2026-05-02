export interface PlanLimitPayload {
  code: 'PLAN_LIMIT_REACHED';
  feature: string;
  current: number;
  max: number;
  requiredPlan: string;
  upgradeUrl: string;
}

export interface FeatureGatePayload {
  code: 'FEATURE_NOT_AVAILABLE';
  feature: string;
  requiredPlan: string;
  upgradeUrl: string;
}

export class PlanLimitError extends Error {
  readonly code = 'PLAN_LIMIT_REACHED' as const;
  readonly feature: string;
  readonly current: number;
  readonly max: number;
  readonly requiredPlan: string;
  readonly upgradeUrl: string;

  constructor(payload: PlanLimitPayload) {
    super(`Plan limit reached for ${payload.feature}`);
    this.feature = payload.feature;
    this.current = payload.current;
    this.max = payload.max;
    this.requiredPlan = payload.requiredPlan;
    this.upgradeUrl = payload.upgradeUrl;
  }
}

export class FeatureGateError extends Error {
  readonly code = 'FEATURE_NOT_AVAILABLE' as const;
  readonly feature: string;
  readonly requiredPlan: string;
  readonly upgradeUrl: string;

  constructor(payload: FeatureGatePayload) {
    super(`Feature not available: ${payload.feature}`);
    this.feature = payload.feature;
    this.requiredPlan = payload.requiredPlan;
    this.upgradeUrl = payload.upgradeUrl;
  }
}

export function isPlanLimitError(err: unknown): err is PlanLimitError {
  return err instanceof PlanLimitError;
}

export function isFeatureGateError(err: unknown): err is FeatureGateError {
  return err instanceof FeatureGateError;
}
