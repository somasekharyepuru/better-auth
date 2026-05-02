-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'PREMIUM', 'TEAM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'PAUSED');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateTable
CREATE TABLE "user_subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "PlanType" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "billingInterval" "BillingInterval",
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "trialActivatedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_subscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "plan" "PlanType" NOT NULL DEFAULT 'TEAM',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "seatCount" INTEGER NOT NULL DEFAULT 3,
    "seatLimit" INTEGER NOT NULL DEFAULT 3,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "billingInterval" "BillingInterval",
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_invoice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL,
    "invoicePdf" TEXT,
    "hostedInvoiceUrl" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_subscription_userId_key" ON "user_subscription"("userId");

-- CreateIndex
CREATE INDEX "user_subscription_status_idx" ON "user_subscription"("status");

-- CreateIndex
CREATE INDEX "user_subscription_stripeCustomerId_idx" ON "user_subscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "user_subscription_stripeSubscriptionId_idx" ON "user_subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_subscription_organizationId_key" ON "organization_subscription"("organizationId");

-- CreateIndex
CREATE INDEX "organization_subscription_status_idx" ON "organization_subscription"("status");

-- CreateIndex
CREATE INDEX "organization_subscription_stripeCustomerId_idx" ON "organization_subscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "organization_subscription_stripeSubscriptionId_idx" ON "organization_subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "billing_invoice_stripeInvoiceId_key" ON "billing_invoice"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "billing_invoice_organizationId_idx" ON "billing_invoice"("organizationId");

-- AddForeignKey
ALTER TABLE "user_subscription" ADD CONSTRAINT "user_subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_subscription" ADD CONSTRAINT "organization_subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_invoice" ADD CONSTRAINT "billing_invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

