# Daymark Monetization — Full Implementation Plan
> **Reference model:** Claude (Anthropic) — Free · Pro · Max · Team · Enterprise  
> **Document scope:** Plan design, DB schema, backend enforcement, Stripe integration, frontend gating, rollout  
> **Priority:** TOP — next engineering sprint

---

## Part 1 — How Claude Does It (and What We're Copying)

Claude's monetization is the gold standard for a SaaS productivity tool because it cleanly separates **individual value** from **organizational value**, and gates on both **usage limits** and **feature access**.

| Plan | Price | Who it's for | Key limits |
|------|-------|-------------|-----------|
| **Free** | $0 | Casual users, students | Daily message cap, no code execution |
| **Pro** | $20/mo | Power individuals | 5× more usage, advanced models, Claude Code |
| **Max** | $100–$200/mo | Heavy hitters | 20× usage, priority access |
| **Team** | $25/seat/mo | Small–mid orgs | All Pro features + admin console, central billing |
| **Enterprise** | Custom | Large corps | SSO, HIPAA, 500K context, dedicated support, SLA |

### What Claude gets right

1. **Individual → Org upgrade path is natural.** Pro users hit limits, then invite their team → Team plan. No awkward re-onboarding.
2. **Seat-based org billing** means revenue grows linearly with headcount.
3. **Enterprise is a completely different product**, not just "more seats." Security, compliance, and dedicated support are the real value drivers.
4. **Hard limits on free, not friction.** The free experience is genuinely good — you hit a wall only when you're already a fan.

---

## Part 2 — Daymark's Plan Structure (Adapted from Claude's Model)

Daymark already has a rich **Organizations** infrastructure (members, teams, roles, audit logs, permissions, ownership transfer). This maps **perfectly** to Claude's Team + Enterprise tiers. We just need to wire billing into it.

### 2.1 The Four Tiers

---

#### TIER 1 — Free ($0/month)
**Target:** Individuals trying Daymark for the first time

| Feature | Limit |
|---------|-------|
| Daily priorities | **3 per day** |
| Pomodoro sessions | **3 per day** |
| Life Areas | **2** |
| Review history | **Last 7 days** |
| Calendar connections | **1** |
| Habits | **3 active habits** |
| Eisenhower Matrix | ❌ Locked |
| Decision Log | ❌ Locked |
| Full mobile app | ❌ View-only |
| Organizations | ❌ Cannot create/join org workspaces |

**Conversion trigger:** User hits any hard limit → upgrade prompt appears.

---

#### TIER 2 — Premium ($12/month · $100/year)
**Target:** Serious individual planners  
**Mirrors:** Claude Pro

| Feature | Limit |
|---------|-------|
| Daily priorities | **Unlimited** |
| Pomodoro sessions | **Unlimited** |
| Life Areas | **Unlimited** |
| Review history | **All time** |
| Calendar connections | **All (Google + Microsoft + Apple)** |
| Habits | **Unlimited** |
| Eisenhower Matrix | ✅ Full access |
| Decision Log | ✅ Full access |
| Full mobile app | ✅ Full access |
| Organizations | ✅ Can **join** org workspaces (if invited) |
| Priority support | ✅ Email, 24hr response |

> **Note:** Premium users can *join* an org workspace but cannot create one or pay for others. That's the Team plan.

---

#### TIER 3 — Team ($10/seat/month · $84/seat/year, minimum 3 seats)
**Target:** Small to mid-sized teams  
**Mirrors:** Claude Team

This is where **Daymark's existing Organizations module** becomes the monetization engine.

| Feature | Details |
|---------|---------|
| Everything in Premium | Per every member seat |
| **Shared Organization workspace** | Shared life areas, team visibility |
| **Admin Console** | Manage members, roles, invitations |
| **Team Analytics** *(v2)* | Aggregate productivity insights |
| **Centralized billing** | Owner pays for all seats |
| **Priority support** | Shared inbox, 24hr response |
| **Audit log access** | 90-day audit history (already in schema) |
| **Custom roles** | Already built — unlocked for Team tier |
| **Up to 50 teams** | Already configured in Better Auth |
| **Seat management** | Add/remove seats from org settings |

**Pricing math:**
- Monthly: $10/seat × N seats
- Annual: $84/seat/year ($7/seat/month) — 30% off
- Minimum: 3 seats ($30/month min)
- Owner's own seat is included in the count

---

#### TIER 4 — Enterprise (Custom pricing, 10+ seats recommended)
**Target:** Companies needing compliance, security, and dedicated support  
**Mirrors:** Claude Enterprise

| Feature | Details |
|---------|---------|
| Everything in Team | All org features |
| **SSO / SAML** | Single sign-on via corporate IdP |
| **Advanced audit logs** | Full history + export (already in schema) |
| **Custom password policies** | Already built (`PasswordPolicy` model) |
| **Dedicated account manager** | Human support contact |
| **SLA guarantee** | 99.9% uptime, 4hr response |
| **Data export** | Full org data export on request |
| **Invoice billing** | No credit card required |
| **Custom data retention** | Configurable per org |
| **Priority feature requests** | Direct roadmap input |
| **Onboarding & training** | Team onboarding call |

**Pricing:** Custom quote from sales. Typical range: $15–$25/seat/month based on seat count and features.

---

### 2.2 Plan Comparison Summary

| Feature | Free | Premium | Team | Enterprise |
|---------|------|---------|------|-----------|
| Price | $0 | $12/mo | $10/seat/mo | Custom |
| Daily priorities | 3 | Unlimited | Unlimited | Unlimited |
| Pomodoro sessions | 3/day | Unlimited | Unlimited | Unlimited |
| Life Areas | 2 | Unlimited | Unlimited | Unlimited |
| Habits | 3 | Unlimited | Unlimited | Unlimited |
| Review history | 7 days | All time | All time | All time |
| Calendar connections | 1 | All | All | All |
| Eisenhower Matrix | ❌ | ✅ | ✅ | ✅ |
| Decision Log | ❌ | ✅ | ✅ | ✅ |
| Full mobile app | ❌ | ✅ | ✅ | ✅ |
| Organization workspace | ❌ | Join only | ✅ Create + manage | ✅ |
| Admin console | ❌ | ❌ | ✅ | ✅ |
| Custom roles | ❌ | ❌ | ✅ | ✅ |
| Audit logs | ❌ | ❌ | 90 days | Full + export |
| SSO / SAML | ❌ | ❌ | ❌ | ✅ |
| Custom password policy | ❌ | ❌ | ❌ | ✅ |
| SLA | ❌ | ❌ | ❌ | ✅ |
| Support | Community | Email 24hr | Email 24hr | Dedicated |

---

## Part 3 — Database Schema Changes

This is the most critical section. Everything builds on this.

### 3.1 New Models to Add to `schema.prisma`

```prisma
// ==========================================
// Subscription & Plan Management
// ==========================================

enum PlanType {
  FREE
  PREMIUM
  TEAM
  ENTERPRISE
}

enum BillingInterval {
  MONTHLY
  ANNUAL
}

enum SubscriptionStatus {
  ACTIVE
  TRIALING
  PAST_DUE
  CANCELED
  INCOMPLETE
  PAUSED
}

// Individual user subscription (Free, Premium)
model UserSubscription {
  id                   String             @id @default(cuid())
  userId               String             @unique
  user                 User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  plan                 PlanType           @default(FREE)
  status               SubscriptionStatus @default(ACTIVE)

  // Stripe IDs
  stripeCustomerId     String?            @unique
  stripeSubscriptionId String?            @unique
  stripePriceId        String?

  billingInterval      BillingInterval?
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean            @default(false)
  canceledAt           DateTime?

  // Trial
  trialStart           DateTime?
  trialEnd             DateTime?
  trialActivatedAt     DateTime?

  // Founder/early bird pricing lock
  lockedPrice          Decimal?           @db.Decimal(10,2)

  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  @@index([userId])
  @@index([stripeCustomerId])
  @@index([stripeSubscriptionId])
  @@index([plan, status])
  @@map("user_subscription")
}

// Organization subscription (Team, Enterprise)
model OrganizationSubscription {
  id                   String             @id @default(cuid())
  organizationId       String             @unique
  organization         Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  plan                 PlanType           @default(TEAM)
  status               SubscriptionStatus @default(ACTIVE)

  // Stripe IDs
  stripeCustomerId     String?            @unique
  stripeSubscriptionId String?            @unique
  stripePriceId        String?

  billingInterval      BillingInterval?
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean            @default(false)
  canceledAt           DateTime?

  // Seat management
  seatCount            Int                @default(3)    // Purchased seats
  seatLimit            Int                @default(3)    // Max allowed (= seatCount for Team)

  // Enterprise-specific
  isEnterprise         Boolean            @default(false)
  enterpriseFeatures   Json?              // { sso: true, customRetention: true, ... }
  contractStartDate    DateTime?
  contractEndDate      DateTime?
  accountManagerEmail  String?

  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  invoices             BillingInvoice[]

  @@index([organizationId])
  @@index([plan, status])
  @@map("organization_subscription")
}

// Usage tracking for enforcement
model UsageRecord {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  date           DateTime @db.Date
  metric         String   // 'priorities_created', 'pomodoro_sessions', 'life_areas'
  count          Int      @default(0)

  @@unique([userId, date, metric])
  @@index([userId])
  @@index([date])
  @@index([metric])
  @@map("usage_record")
}

// Billing invoices (for enterprise/audit)
model BillingInvoice {
  id                     String                    @id @default(cuid())
  organizationId         String?
  subscription           OrganizationSubscription? @relation(fields: [organizationId], references: [organizationId])

  stripeInvoiceId        String                    @unique
  amount                 Decimal                   @db.Decimal(10,2)
  currency               String                    @default("usd")
  status                 String                    // paid, open, void, uncollectible
  invoicePdf             String?
  hostedInvoiceUrl       String?
  periodStart            DateTime
  periodEnd              DateTime
  paidAt                 DateTime?

  createdAt              DateTime                  @default(now())

  @@index([organizationId])
  @@index([stripeInvoiceId])
  @@map("billing_invoice")
}

// Webhook events log (idempotency)
model StripeWebhookEvent {
  id          String   @id @default(cuid())
  stripeEventId String @unique
  type        String
  processed   Boolean  @default(false)
  processedAt DateTime?
  error       String?
  createdAt   DateTime @default(now())

  @@index([stripeEventId])
  @@index([processed])
  @@map("stripe_webhook_event")
}
```

### 3.2 Modifications to Existing Models

```prisma
// Add to User model:
userSubscription     UserSubscription?

// Add to Organization model:
orgSubscription      OrganizationSubscription?
```

---

## Part 4 — Backend Implementation

### 4.1 New Module: `subscription`

```
backend/src/subscription/
├── subscription.module.ts
├── subscription.service.ts       ← core plan logic
├── subscription.controller.ts    ← REST endpoints
├── stripe.service.ts             ← Stripe SDK wrapper
├── stripe-webhook.controller.ts  ← Stripe webhooks
├── plan-limits.service.ts        ← limit definitions + enforcement
├── usage.service.ts              ← usage tracking
└── dto/
    ├── create-checkout.dto.ts
    ├── manage-billing.dto.ts
    └── plan-status.dto.ts
```

### 4.2 Plan Limits Service — The Core Engine

This service is the single source of truth for what each plan allows. Every API endpoint will call into this.

```typescript
// plan-limits.service.ts

export const PLAN_LIMITS = {
  FREE: {
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
  },
  PREMIUM: {
    maxDailyPriorities: Infinity,
    maxDailyPomodoro: Infinity,
    maxLifeAreas: Infinity,
    maxActiveHabits: Infinity,
    historyDays: Infinity,
    maxCalendarConnections: Infinity,
    eisenhowerMatrix: true,
    decisionLog: true,
    mobileFullAccess: true,
    canCreateOrg: false,    // Can join only
    canJoinOrg: true,
  },
  TEAM: {
    // All PREMIUM limits, plus:
    canCreateOrg: true,
    canJoinOrg: true,
    customRoles: true,
    auditLogDays: 90,
    adminConsole: true,
  },
  ENTERPRISE: {
    // All TEAM limits, plus:
    sso: true,
    auditLogDays: Infinity,
    customPasswordPolicy: true,
    dataExport: true,
    sla: true,
  },
} as const;

@Injectable()
export class PlanLimitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usageService: UsageService,
  ) {}

  async getUserPlan(userId: string): Promise<PlanType> {
    // Check if user is in an active org subscription first
    const orgMembership = await this.prisma.member.findFirst({
      where: { userId },
      include: {
        organization: {
          include: { orgSubscription: true }
        }
      }
    });

    if (orgMembership?.organization?.orgSubscription?.status === 'ACTIVE') {
      return orgMembership.organization.orgSubscription.plan;
    }

    // Fall back to individual subscription
    const sub = await this.prisma.userSubscription.findUnique({
      where: { userId }
    });

    if (!sub || sub.status !== 'ACTIVE') return PlanType.FREE;
    return sub.plan;
  }

  async canAddPriority(userId: string): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    const limits = PLAN_LIMITS[plan];
    if (limits.maxDailyPriorities === Infinity) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await this.prisma.topPriority.count({
      where: {
        day: {
          userId,
          date: { gte: today }
        }
      }
    });

    return count < limits.maxDailyPriorities;
  }

  async canAddLifeArea(userId: string): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    const limits = PLAN_LIMITS[plan];
    if (limits.maxLifeAreas === Infinity) return true;

    const count = await this.prisma.lifeArea.count({
      where: { userId, isArchived: false }
    });

    return count < limits.maxLifeAreas;
  }

  async canAccessFeature(userId: string, feature: keyof typeof PLAN_LIMITS.FREE): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    return !!(PLAN_LIMITS[plan] as any)[feature];
  }

  async getLimitsForUser(userId: string) {
    const plan = await this.getUserPlan(userId);
    return { plan, limits: PLAN_LIMITS[plan] };
  }
}
```

### 4.3 Enforcement in Existing Endpoints

Add limit checks to every resource creation endpoint. Example for priorities:

```typescript
// priorities.service.ts — createPriority method
async create(userId: string, createDto: CreateTopPriorityDto) {
  // ← ADD THIS
  const canAdd = await this.planLimitsService.canAddPriority(userId);
  if (!canAdd) {
    throw new ForbiddenException({
      code: 'PLAN_LIMIT_REACHED',
      feature: 'daily_priorities',
      upgradeUrl: '/pricing',
      message: 'You have reached your daily priority limit. Upgrade to Premium for unlimited priorities.',
    });
  }
  // ... existing create logic
}
```

Apply the same pattern to:
- `life-areas.service.ts` → `canAddLifeArea()`
- `focus-suite.service.ts` → `canAddPomodoroSession()`
- `habits.service.ts` → `canAddHabit()`
- `eisenhower.service.ts` → `canAccessFeature('eisenhowerMatrix')`
- `decision-log.service.ts` → `canAccessFeature('decisionLog')`
- `calendar.service.ts` → check `maxCalendarConnections`
- `days.service.ts` → check `historyDays` for review queries

### 4.4 Stripe Integration

```typescript
// stripe.service.ts

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly config: ConfigService) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-06-20',
    });
  }

  // Individual checkout (Premium)
  async createIndividualCheckout(userId: string, email: string, interval: 'monthly' | 'annual') {
    const priceId = interval === 'annual'
      ? this.config.get('STRIPE_PREMIUM_ANNUAL_PRICE_ID')
      : this.config.get('STRIPE_PREMIUM_MONTHLY_PRICE_ID');

    return this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.config.get('APP_URL')}/settings?success=true`,
      cancel_url: `${this.config.get('APP_URL')}/pricing`,
      metadata: { userId, type: 'individual' },
      subscription_data: {
        trial_period_days: 14,  // for eligible users
        metadata: { userId },
      },
    });
  }

  // Team checkout (per-seat)
  async createTeamCheckout(orgId: string, ownerEmail: string, seats: number, interval: 'monthly' | 'annual') {
    const priceId = interval === 'annual'
      ? this.config.get('STRIPE_TEAM_ANNUAL_PRICE_ID')
      : this.config.get('STRIPE_TEAM_MONTHLY_PRICE_ID');

    return this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: ownerEmail,
      line_items: [{ price: priceId, quantity: seats }],
      success_url: `${this.config.get('APP_URL')}/organizations/${orgId}?success=true`,
      cancel_url: `${this.config.get('APP_URL')}/pricing`,
      metadata: { orgId, type: 'team', seats: seats.toString() },
    });
  }

  // Manage billing portal (change plan, cancel, update card)
  async createBillingPortalSession(stripeCustomerId: string, returnUrl: string) {
    return this.stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });
  }

  // Add seats to existing Team subscription
  async updateTeamSeats(stripeSubscriptionId: string, newSeatCount: number) {
    const subscription = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
    const itemId = subscription.items.data[0].id;

    return this.stripe.subscriptions.update(stripeSubscriptionId, {
      items: [{ id: itemId, quantity: newSeatCount }],
      proration_behavior: 'always_invoice',
    });
  }
}
```

### 4.5 Stripe Webhook Handler

All plan state changes flow through webhooks. This is the authoritative source for subscription status.

```typescript
// stripe-webhook.controller.ts

@Controller('api/webhooks/stripe')
export class StripeWebhookController {
  @Post()
  async handleWebhook(@Req() req: RawBodyRequest, @Headers('stripe-signature') sig: string) {
    const event = this.stripe.webhooks.constructEvent(req.rawBody, sig, WEBHOOK_SECRET);

    // Idempotency check
    const existing = await this.prisma.stripeWebhookEvent.findUnique({
      where: { stripeEventId: event.id }
    });
    if (existing?.processed) return { received: true };

    await this.prisma.stripeWebhookEvent.upsert({
      where: { stripeEventId: event.id },
      create: { stripeEventId: event.id, type: event.type },
      update: {},
    });

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
    }

    await this.prisma.stripeWebhookEvent.update({
      where: { stripeEventId: event.id },
      data: { processed: true, processedAt: new Date() },
    });

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const { type, userId, orgId, seats } = session.metadata;

    if (type === 'individual') {
      await this.prisma.userSubscription.upsert({
        where: { userId },
        create: {
          userId,
          plan: 'PREMIUM',
          status: 'ACTIVE',
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        },
        update: {
          plan: 'PREMIUM',
          status: 'ACTIVE',
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        },
      });
    }

    if (type === 'team') {
      await this.prisma.organizationSubscription.upsert({
        where: { organizationId: orgId },
        create: {
          organizationId: orgId,
          plan: 'TEAM',
          status: 'ACTIVE',
          seatCount: parseInt(seats),
          seatLimit: parseInt(seats),
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        },
        update: {
          plan: 'TEAM',
          status: 'ACTIVE',
          seatCount: parseInt(seats),
          seatLimit: parseInt(seats),
        },
      });
    }
  }
}
```

### 4.6 Subscription REST Endpoints

```
GET    /api/subscription/me                 → Get current user's plan + limits
GET    /api/subscription/usage             → Get today's usage vs limits
POST   /api/subscription/checkout/individual → Create Stripe checkout (individual)
POST   /api/subscription/checkout/team     → Create Stripe checkout (team)
POST   /api/subscription/portal            → Open Stripe billing portal
GET    /api/organizations/:id/subscription → Get org plan
POST   /api/organizations/:id/subscription/seats → Add/remove seats
```

---

## Part 5 — Org Plan: Leveraging the Existing Infrastructure

This is the most important insight: **you have already built 80% of the Team tier.** Here's the exact mapping:

| Already Built | Team Plan Feature |
|--------------|------------------|
| `Organization` model | Organization workspace |
| `Member` model + roles | Member management |
| `Team` + `TeamMember` models | Sub-team grouping |
| `OrganizationRole` + `OrganizationRole` | Custom roles (unlock for Team) |
| `AuditLog` model | Audit history (show for Team/Enterprise) |
| `PasswordPolicy` model | Custom password policies (Enterprise) |
| `Invitation` model | Member invitations |
| `OwnershipTransfer` | Ownership management |
| Admin panel | (already has ban/manage capabilities) |

### 5.1 How Org Plan Flows

```
Owner creates organization
    ↓
Owner goes to /organizations/:id/settings → Billing tab
    ↓
Chooses Team plan → picks seat count → goes to Stripe
    ↓
Stripe webhook fires → OrganizationSubscription created
    ↓
All members of that org now have Team-tier features
    ↓
Owner can add seats → Stripe charges prorated diff
    ↓
Owner invites new member → invitation sent → member joins
    ↓
If org member count > seatLimit → block new invitations
```

### 5.2 Seat Enforcement Logic

```typescript
// In invitation creation — before sending invite
async inviteMember(orgId: string, email: string) {
  const sub = await this.prisma.organizationSubscription.findUnique({
    where: { organizationId: orgId },
    include: { organization: { include: { members: true } } }
  });

  if (sub && sub.plan === 'TEAM') {
    const currentMembers = sub.organization.members.length;
    if (currentMembers >= sub.seatLimit) {
      throw new ForbiddenException({
        code: 'SEAT_LIMIT_REACHED',
        currentSeats: currentMembers,
        seatLimit: sub.seatLimit,
        message: 'You have reached your seat limit. Add more seats to invite additional members.',
        addSeatsUrl: `/organizations/${orgId}/settings/billing`,
      });
    }
  }
  // ... existing invite logic
}
```

### 5.3 What Gets Unlocked Per Org Plan

```typescript
// org-feature-guard.ts
export const ORG_PLAN_FEATURES = {
  TEAM: {
    customRoles: true,
    auditLogDays: 90,
    adminConsole: true,
    maxTeams: 50,           // already configured
    maxMembers: null,       // seat-limited, not count-limited
  },
  ENTERPRISE: {
    customRoles: true,
    auditLogDays: Infinity,
    adminConsole: true,
    sso: true,
    customPasswordPolicy: true,
    dataExport: true,
    maxTeams: null,
    maxMembers: null,
  },
};
```

---

## Part 6 — Frontend Gating

### 6.1 Plan Context Provider

```tsx
// contexts/PlanContext.tsx
interface PlanContextType {
  plan: 'FREE' | 'PREMIUM' | 'TEAM' | 'ENTERPRISE';
  limits: PlanLimits;
  usage: DailyUsage;
  isLoading: boolean;
  canAccess: (feature: string) => boolean;
  hasReachedLimit: (metric: string) => boolean;
}

export const PlanProvider = ({ children }) => {
  const { data } = useSWR('/api/subscription/me', fetcher);
  // Provide plan context globally
};
```

### 6.2 Feature Gate Component

```tsx
// components/PlanGate.tsx
interface PlanGateProps {
  feature: string;
  requiredPlan?: 'PREMIUM' | 'TEAM' | 'ENTERPRISE';
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PlanGate = ({ feature, requiredPlan = 'PREMIUM', fallback, children }) => {
  const { canAccess } = usePlan();

  if (!canAccess(feature)) {
    return fallback ?? (
      <UpgradePrompt
        feature={feature}
        requiredPlan={requiredPlan}
        className="rounded-lg border border-dashed p-6"
      />
    );
  }

  return <>{children}</>;
};

// Usage:
<PlanGate feature="eisenhowerMatrix">
  <EisenhowerMatrix />
</PlanGate>
```

### 6.3 Upgrade Prompts (Non-Intrusive)

Design principle: **never block the user's view, always show what they're missing.**

```tsx
// When user hits 3 priorities:
<LimitReachedBanner
  icon="🎯"
  message="You've used all 3 daily priorities"
  cta="Upgrade for Unlimited"
  href="/pricing"
  dismissible
/>

// When user clicks a locked feature:
<UpgradeModal
  feature="Eisenhower Matrix"
  benefit="Strategically prioritize tasks by urgency and importance"
  plan="Premium"
  price="$12/month"
  cta="Start 14-day free trial"
/>
```

### 6.4 Pages to Add/Modify

| Page | Change |
|------|--------|
| `/pricing` | New page — plan comparison + checkout buttons |
| `/settings` | Add "Billing" tab — current plan, usage bar, manage button |
| `/organizations/:id/settings` | Add "Billing" tab — seats, usage, upgrade |
| `/dashboard` | Usage indicator in header (e.g. "2/3 priorities") |
| `/tools/matrix` | Show upgrade prompt if on Free |
| `/tools/decisions` | Show upgrade prompt if on Free |

---

## Part 7 — Trial Strategy (Mirroring Claude's Approach)

### 7.1 Individual Trial (14-day Premium)

**Trigger:** User has been active for 7 consecutive days (5+ days with activity).

```typescript
// Called from a daily cron job or on each login
async checkTrialEligibility(userId: string) {
  const sub = await this.prisma.userSubscription.findUnique({ where: { userId } });

  // Already paid or already trialed
  if (sub?.plan !== 'FREE' || sub?.trialActivatedAt) return;

  // Count active days in last 10 days
  const activeDays = await this.prisma.day.count({
    where: {
      userId,
      createdAt: { gte: subDays(new Date(), 10) }
    }
  });

  if (activeDays >= 5) {
    await this.offerTrial(userId);
  }
}
```

**Trial Email Sequence:**
- Day 0: "Your 14-day Premium trial has started!"
- Day 4: "You've used [X] Eisenhower tasks this week 🎯"
- Day 7: "Halfway through your trial — here's your usage"
- Day 12: "2 days left — here's what you'll lose"
- Day 14: "Trial ends today — get 20% off your first month" (urgency + incentive)

### 7.2 Team Trial (14-day)

Offered when an org owner creates an organization for the first time. No credit card. After 14 days: org drops to "Free org" (members can still use individual plans, but no org features).

---

## Part 8 — Stripe Product Setup

### Products & Prices to Create in Stripe Dashboard

```
Product: Daymark Premium (Individual)
├── Price: premium_monthly → $12.00/month
└── Price: premium_annual  → $100.00/year

Product: Daymark Team (Per Seat)
├── Price: team_monthly    → $10.00/seat/month (billing_scheme: per_unit)
└── Price: team_annual     → $84.00/seat/year  (billing_scheme: per_unit)

Product: Daymark Enterprise
└── (Created manually per deal, or via custom amount)
```

### Environment Variables to Add

```env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_xxx
STRIPE_PREMIUM_ANNUAL_PRICE_ID=price_xxx
STRIPE_TEAM_MONTHLY_PRICE_ID=price_xxx
STRIPE_TEAM_ANNUAL_PRICE_ID=price_xxx
```

---

## Part 9 — Implementation Roadmap

### Phase 1 — Foundation (Week 1–2) 🔴 TOP PRIORITY
- [ ] Add new models to `schema.prisma` (UserSubscription, OrganizationSubscription, UsageRecord, etc.)
- [ ] Run Prisma migration
- [ ] Create `subscription` module (SubscriptionService, PlanLimitsService, UsageService)
- [ ] Integrate Stripe SDK, create Stripe products & prices
- [ ] Implement webhook handler with idempotency
- [ ] Add `canAdd*` checks to priorities, life areas, pomodoro, habits services

### Phase 2 — Individual Monetization (Week 2–3)
- [ ] Build `/api/subscription/*` REST endpoints
- [ ] Individual checkout flow (Stripe Checkout)
- [ ] Billing portal integration (manage/cancel)
- [ ] Trial eligibility logic + cron job
- [ ] Trial email sequence (integrate with existing email queue)
- [ ] Frontend: `/pricing` page with plan comparison
- [ ] Frontend: `PlanContext` + `PlanGate` components
- [ ] Frontend: `Settings → Billing` tab
- [ ] Frontend: upgrade prompts on limit hit and locked features

### Phase 3 — Organization (Team) Monetization (Week 3–4)
- [ ] Organization subscription checkout (per-seat)
- [ ] Seat enforcement in invitation flow
- [ ] "Add seats" UI in org settings
- [ ] Unlock custom roles for Team tier
- [ ] Audit log access for Team/Enterprise
- [ ] Frontend: `Org Settings → Billing` tab
- [ ] Org trial (14-day free when first created)

### Phase 4 — Enterprise & Polish (Week 5–6)
- [ ] Enterprise flag + feature enforcement
- [ ] Custom password policy enforcement (already modeled)
- [ ] Data export endpoint
- [ ] Invoice billing support (Stripe invoices)
- [ ] Usage analytics for org owners
- [ ] Revenue metrics dashboard (internal admin panel)
- [ ] Downgrade grace period logic

---

## Part 10 — Revenue Projections (with Team Plan)

| Month | Free Users | Premium | Team (seats) | MRR |
|-------|-----------|---------|-------------|-----|
| 1 | 500 | 40 ($480) | 0 | $480 |
| 3 | 1,500 | 150 ($1,800) | 15 seats ($150) | $1,950 |
| 6 | 3,000 | 360 ($4,320) | 60 seats ($600) | $4,920 |
| 12 | 8,000 | 960 ($11,520) | 250 seats ($2,500) | $14,020 |

**Annual plan uplift (conservative 25% on annual):**
- Month 12 ARR: ~$168,240 + ~$50,400 annual plans = ~$220K ARR

**Team plan note:** Once you land 1 team of 10 seats, that's $100/month from one org — equivalent to 8 individual Premium conversions.

---

## Part 11 — Key Decisions Required

| Decision | Options | Recommendation |
|----------|---------|---------------|
| Can Free users join org workspaces? | Yes / No | **No** — keeps Team value clear |
| Minimum team seats | 1 / 3 / 5 | **3** — matches Claude, ensures team dynamics |
| Trial for Premium | CC required / No CC | **No CC** — removes friction, higher conversion |
| Trial for Team | Yes / No | **Yes, 14 days** — let orgs experience the value |
| Downgrade data behavior | Preserve / Delete | **Preserve always** — builds trust |
| Enterprise self-serve | Yes / No | **No** — require sales call, higher deal size |
| Seat overage | Block / Auto-bill | **Block + prompt** — predictable billing |

---

## Summary — What Makes This Powerful

The key insight from Claude's model is that **organizations are a multiplier**, not just an add-on. Every team member who gets value from Daymark is a node in a referral network. When one power user convinces their team to use Daymark, a single $12/month account becomes $100+/month.

Daymark's existing infrastructure already supports this:
- Organizations, teams, members, roles — **all built**
- Audit logs, password policies, admin panel — **all built**
- Email queue, invitations, ownership transfer — **all built**

The only missing pieces are: **Stripe wiring, plan enforcement middleware, and the pricing UI.** This is 3–4 weeks of focused engineering work, not a rebuild.
