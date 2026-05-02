import { Injectable, Logger } from '@nestjs/common';

/**
 * Stripe service — wraps the Stripe SDK.
 *
 * Setup:
 *   cd backend && npm install stripe
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET
 *   STRIPE_PREMIUM_MONTHLY_PRICE_ID
 *   STRIPE_PREMIUM_ANNUAL_PRICE_ID
 *   STRIPE_TEAM_MONTHLY_PRICE_ID
 *   STRIPE_TEAM_ANNUAL_PRICE_ID
 *   APP_URL  (e.g. https://app.daymark.app)
 */

// Dynamic import so the app boots without stripe installed in dev
// eslint-disable-next-line @typescript-eslint/no-var-requires
let Stripe: any;
try {
  Stripe = require('stripe');
} catch {
  // Stripe not installed — all methods will throw a clear error
}

export type BillingInterval = 'monthly' | 'annual';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: any;

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key && Stripe) {
      this.stripe = new (Stripe.default ?? Stripe)(key, { apiVersion: '2024-06-20' });
    }
  }

  private get client() {
    if (!this.stripe) {
      throw new Error(
        'Stripe is not configured. Add STRIPE_SECRET_KEY to your environment and run: npm install stripe',
      );
    }
    return this.stripe;
  }

  // ─── Individual checkout (Premium) ───────────────────────────────────────

  async createIndividualCheckout(
    userId: string,
    email: string,
    interval: BillingInterval,
    offerTrial = false,
  ) {
    const priceId =
      interval === 'annual'
        ? process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID
        : process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID;

    const appUrl = process.env.APP_URL || 'http://localhost:3001';

    return this.client.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings/billing?success=true`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { userId, type: 'individual' },
      ...(offerTrial && {
        subscription_data: {
          trial_period_days: 14,
          trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
          metadata: { userId },
        },
        payment_method_collection: 'if_required',  // No CC required for trial
      }),
    });
  }

  // ─── Team checkout (per-seat) ─────────────────────────────────────────────

  async createTeamCheckout(
    orgId: string,
    ownerEmail: string,
    seats: number,
    interval: BillingInterval,
  ) {
    const priceId =
      interval === 'annual'
        ? process.env.STRIPE_TEAM_ANNUAL_PRICE_ID
        : process.env.STRIPE_TEAM_MONTHLY_PRICE_ID;

    const appUrl = process.env.APP_URL || 'http://localhost:3001';

    return this.client.checkout.sessions.create({
      mode: 'subscription',
      customer_email: ownerEmail,
      line_items: [{ price: priceId, quantity: Math.max(3, seats) }],
      success_url: `${appUrl}/organizations/${orgId}/settings/billing?success=true`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { orgId, type: 'team', seats: String(seats) },
    });
  }

  // ─── Billing portal (manage / cancel / update card) ───────────────────────

  async createBillingPortalSession(stripeCustomerId: string, returnUrl: string) {
    return this.client.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });
  }

  // ─── Seat management ──────────────────────────────────────────────────────

  async updateTeamSeats(stripeSubscriptionId: string, newSeatCount: number) {
    const sub = await this.client.subscriptions.retrieve(stripeSubscriptionId);
    const itemId = sub.items.data[0].id;

    return this.client.subscriptions.update(stripeSubscriptionId, {
      items: [{ id: itemId, quantity: Math.max(3, newSeatCount) }],
      proration_behavior: 'always_invoice',
    });
  }

  // ─── Webhook verification ─────────────────────────────────────────────────

  constructWebhookEvent(rawBody: Buffer, signature: string) {
    return this.client.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  }
}
