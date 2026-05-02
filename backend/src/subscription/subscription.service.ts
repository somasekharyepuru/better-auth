import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService, BillingInterval } from './stripe.service';
import { PlanLimitsService } from './plan-limits.service';
import { PlanType, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly planLimits: PlanLimitsService,
  ) {}

  // ─── Status queries ───────────────────────────────────────────────────────

  async getUserSubscriptionStatus(userId: string) {
    const [sub, { plan, limits }] = await Promise.all([
      this.prisma.userSubscription.findUnique({ where: { userId } }),
      this.planLimits.getLimitsForUser(userId),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Daily usage
    const [priorityCount, pomodoroCount, lifeAreaCount, habitCount, calendarCount] =
      await Promise.all([
        this.prisma.topPriority.count({
          where: { day: { userId, date: { gte: today } } },
        }),
        this.prisma.focusSession.count({
          where: {
            startedAt: { gte: today },
            sessionType: 'focus',
            timeBlock: { day: { userId } },
          },
        }),
        this.prisma.lifeArea.count({ where: { userId, isArchived: false } }),
        this.prisma.habit.count({ where: { userId, isArchived: false, isActive: true } }),
        this.prisma.calendarConnection.count({ where: { userId, enabled: true } }),
      ]);

    return {
      plan,
      limits,
      subscription: sub
        ? {
            status: sub.status,
            billingInterval: sub.billingInterval,
            currentPeriodEnd: sub.currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            trialEnd: sub.trialEnd,
            isTrialing: sub.status === SubscriptionStatus.TRIALING,
          }
        : null,
      usage: {
        prioritiesCreatedToday: priorityCount,
        pomodoroSessionsToday: pomodoroCount,
        activeLifeAreas: lifeAreaCount,
        activeHabits: habitCount,
        calendarConnections: calendarCount,
      },
    };
  }

  async getOrgSubscriptionStatus(organizationId: string) {
    const sub = await this.prisma.organizationSubscription.findUnique({
      where: { organizationId },
      include: {
        organization: {
          include: { members: { select: { id: true } } },
        },
      },
    });

    if (!sub) return { plan: PlanType.FREE, subscription: null, memberCount: 0 };

    return {
      plan: sub.plan,
      subscription: {
        status: sub.status,
        billingInterval: sub.billingInterval,
        seatCount: sub.seatCount,
        seatLimit: sub.seatLimit,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      },
      memberCount: sub.organization.members.length,
    };
  }

  // ─── Trial eligibility ────────────────────────────────────────────────────

  /**
   * Check if a user qualifies for a free 14-day trial (no CC required).
   * Eligible if: plan is FREE, trial never activated, and user has been active
   * on at least 5 different days in the last 10 days.
   */
  async checkTrialEligibility(userId: string): Promise<{ eligible: boolean }> {
    const sub = await this.prisma.userSubscription.findUnique({ where: { userId } });

    // Already on a paid plan or already trialed
    if (sub && (sub.plan !== PlanType.FREE || sub.trialActivatedAt)) {
      return { eligible: false };
    }

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const activeDays = await this.prisma.day.groupBy({
      by: ['date'],
      where: { userId, createdAt: { gte: tenDaysAgo } },
    });

    return { eligible: activeDays.length >= 5 };
  }

  /**
   * Activate a no-CC trial directly (used when Stripe is not involved).
   * The trial runs in-app; if user subscribes later, Stripe handles billing.
   */
  async activateTrial(userId: string): Promise<void> {
    const { eligible } = await this.checkTrialEligibility(userId);
    if (!eligible) return;

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    await this.prisma.userSubscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: PlanType.PREMIUM,
        status: SubscriptionStatus.TRIALING,
        trialStart: now,
        trialEnd,
        trialActivatedAt: now,
      },
      update: {
        plan: PlanType.PREMIUM,
        status: SubscriptionStatus.TRIALING,
        trialStart: now,
        trialEnd,
        trialActivatedAt: now,
      },
    });

    this.logger.log(`Trial activated for user ${userId}, ends ${trialEnd.toISOString()}`);
  }

  // ─── Stripe checkout sessions ─────────────────────────────────────────────

  async createIndividualCheckout(userId: string, email: string, interval: BillingInterval) {
    const { eligible } = await this.checkTrialEligibility(userId);
    const session = await this.stripe.createIndividualCheckout(userId, email, interval, eligible);
    return { url: session.url };
  }

  async createTeamCheckout(orgId: string, ownerEmail: string, seats: number, interval: BillingInterval) {
    const session = await this.stripe.createTeamCheckout(orgId, ownerEmail, seats, interval);
    return { url: session.url };
  }

  async createBillingPortalSession(userId: string, returnUrl: string) {
    const sub = await this.prisma.userSubscription.findUnique({ where: { userId } });
    if (!sub?.stripeCustomerId) throw new NotFoundException('No billing account found');
    const session = await this.stripe.createBillingPortalSession(sub.stripeCustomerId, returnUrl);
    return { url: session.url };
  }

  async createOrgBillingPortalSession(orgId: string, returnUrl: string) {
    const sub = await this.prisma.organizationSubscription.findUnique({ where: { organizationId: orgId } });
    if (!sub?.stripeCustomerId) throw new NotFoundException('No billing account found');
    const session = await this.stripe.createBillingPortalSession(sub.stripeCustomerId, returnUrl);
    return { url: session.url };
  }

  // ─── Seat management ──────────────────────────────────────────────────────

  async updateOrgSeats(orgId: string, newSeatCount: number) {
    const sub = await this.prisma.organizationSubscription.findUnique({
      where: { organizationId: orgId },
    });

    if (!sub || !sub.stripeSubscriptionId) {
      throw new NotFoundException('No active organization subscription');
    }

    const seats = Math.max(3, newSeatCount);

    await this.stripe.updateTeamSeats(sub.stripeSubscriptionId, seats);

    return this.prisma.organizationSubscription.update({
      where: { organizationId: orgId },
      data: { seatCount: seats, seatLimit: seats },
    });
  }

  // ─── Stripe webhook handlers ──────────────────────────────────────────────

  async handleCheckoutCompleted(session: any) {
    const { type, userId, orgId, seats } = session.metadata ?? {};

    if (type === 'individual' && userId) {
      const stripeSubId = session.subscription as string;
      const stripeSub = stripeSubId
        ? await this.fetchStripeSub(stripeSubId)
        : null;

      await this.prisma.userSubscription.upsert({
        where: { userId },
        create: {
          userId,
          plan: PlanType.PREMIUM,
          status: SubscriptionStatus.ACTIVE,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: stripeSubId,
          stripePriceId: stripeSub?.items?.data?.[0]?.price?.id,
          billingInterval: this.resolveInterval(stripeSub),
          currentPeriodStart: stripeSub ? new Date(stripeSub.current_period_start * 1000) : undefined,
          currentPeriodEnd: stripeSub ? new Date(stripeSub.current_period_end * 1000) : undefined,
        },
        update: {
          plan: PlanType.PREMIUM,
          status: SubscriptionStatus.ACTIVE,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: stripeSubId,
          stripePriceId: stripeSub?.items?.data?.[0]?.price?.id,
          billingInterval: this.resolveInterval(stripeSub),
          currentPeriodStart: stripeSub ? new Date(stripeSub.current_period_start * 1000) : undefined,
          currentPeriodEnd: stripeSub ? new Date(stripeSub.current_period_end * 1000) : undefined,
        },
      });

      this.logger.log(`Individual Premium activated for user ${userId}`);
    }

    if (type === 'team' && orgId) {
      const seatCount = Math.max(3, parseInt(seats ?? '3', 10));
      const stripeSubId = session.subscription as string;
      const stripeSub = stripeSubId ? await this.fetchStripeSub(stripeSubId) : null;

      await this.prisma.organizationSubscription.upsert({
        where: { organizationId: orgId },
        create: {
          organizationId: orgId,
          plan: PlanType.TEAM,
          status: SubscriptionStatus.ACTIVE,
          seatCount,
          seatLimit: seatCount,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: stripeSubId,
          stripePriceId: stripeSub?.items?.data?.[0]?.price?.id,
          billingInterval: this.resolveInterval(stripeSub),
          currentPeriodStart: stripeSub ? new Date(stripeSub.current_period_start * 1000) : undefined,
          currentPeriodEnd: stripeSub ? new Date(stripeSub.current_period_end * 1000) : undefined,
        },
        update: {
          plan: PlanType.TEAM,
          status: SubscriptionStatus.ACTIVE,
          seatCount,
          seatLimit: seatCount,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: stripeSubId,
          billingInterval: this.resolveInterval(stripeSub),
          currentPeriodStart: stripeSub ? new Date(stripeSub.current_period_start * 1000) : undefined,
          currentPeriodEnd: stripeSub ? new Date(stripeSub.current_period_end * 1000) : undefined,
        },
      });

      this.logger.log(`Team plan activated for org ${orgId} with ${seatCount} seats`);
    }
  }

  async handleSubscriptionUpdated(stripeSub: any) {
    const { userId, orgId } = stripeSub.metadata ?? {};
    const status = this.mapStripeStatus(stripeSub.status);

    if (userId) {
      await this.prisma.userSubscription.updateMany({
        where: { stripeSubscriptionId: stripeSub.id },
        data: {
          status,
          currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        },
      });
    }

    if (orgId) {
      await this.prisma.organizationSubscription.updateMany({
        where: { stripeSubscriptionId: stripeSub.id },
        data: {
          status,
          currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          seatCount: stripeSub.items?.data?.[0]?.quantity ?? 3,
          seatLimit: stripeSub.items?.data?.[0]?.quantity ?? 3,
        },
      });
    }
  }

  async handleSubscriptionDeleted(stripeSub: any) {
    // Downgrade — data is always preserved, just status changes
    await this.prisma.userSubscription.updateMany({
      where: { stripeSubscriptionId: stripeSub.id },
      data: { status: SubscriptionStatus.CANCELED, canceledAt: new Date() },
    });

    await this.prisma.organizationSubscription.updateMany({
      where: { stripeSubscriptionId: stripeSub.id },
      data: { status: SubscriptionStatus.CANCELED, canceledAt: new Date() },
    });
  }

  async handleInvoicePaid(invoice: any) {
    // Store invoice for org billing audits
    if (!invoice.customer) return;

    const orgSub = await this.prisma.organizationSubscription.findFirst({
      where: { stripeCustomerId: invoice.customer as string },
    });

    if (orgSub) {
      await this.prisma.billingInvoice.upsert({
        where: { stripeInvoiceId: invoice.id },
        create: {
          organizationId: orgSub.organizationId,
          stripeInvoiceId: invoice.id,
          amountCents: invoice.amount_paid,
          currency: invoice.currency,
          status: invoice.status,
          invoicePdf: invoice.invoice_pdf,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
          periodStart: new Date(invoice.period_start * 1000),
          periodEnd: new Date(invoice.period_end * 1000),
          paidAt: invoice.status_transitions?.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000)
            : new Date(),
        },
        update: {
          status: invoice.status,
          paidAt: new Date(),
        },
      });
    }
  }

  async handlePaymentFailed(invoice: any) {
    await this.prisma.userSubscription.updateMany({
      where: { stripeCustomerId: invoice.customer as string },
      data: { status: SubscriptionStatus.PAST_DUE },
    });

    await this.prisma.organizationSubscription.updateMany({
      where: { stripeCustomerId: invoice.customer as string },
      data: { status: SubscriptionStatus.PAST_DUE },
    });
  }

  // ─── Trial expiry cron ────────────────────────────────────────────────────

  /** Called by a @Cron job — downgrades expired trials back to FREE */
  async expireTrials(): Promise<void> {
    const now = new Date();

    const expired = await this.prisma.userSubscription.findMany({
      where: {
        status: SubscriptionStatus.TRIALING,
        trialEnd: { lte: now },
        stripeSubscriptionId: null,   // no card attached — pure in-app trial
      },
    });

    for (const sub of expired) {
      await this.prisma.userSubscription.update({
        where: { id: sub.id },
        data: { plan: PlanType.FREE, status: SubscriptionStatus.CANCELED },
      });
      this.logger.log(`Trial expired for user ${sub.userId}`);
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async fetchStripeSub(id: string) {
    try {
      return await this.stripe['client']?.subscriptions?.retrieve(id);
    } catch {
      return null;
    }
  }

  private resolveInterval(stripeSub: any): 'MONTHLY' | 'ANNUAL' | undefined {
    const interval = stripeSub?.items?.data?.[0]?.price?.recurring?.interval;
    if (interval === 'month') return 'MONTHLY';
    if (interval === 'year') return 'ANNUAL';
    return undefined;
  }

  private mapStripeStatus(stripeStatus: string): SubscriptionStatus {
    const map: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      trialing: SubscriptionStatus.TRIALING,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      incomplete: SubscriptionStatus.INCOMPLETE,
      paused: SubscriptionStatus.PAUSED,
    };
    return map[stripeStatus] ?? SubscriptionStatus.ACTIVE;
  }
}
