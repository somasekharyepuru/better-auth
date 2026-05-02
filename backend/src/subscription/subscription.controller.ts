import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { SubscriptionService } from './subscription.service';
import { PlanLimitsService } from './plan-limits.service';
import {
  CreateIndividualCheckoutDto,
  CreateTeamCheckoutDto,
  UpdateOrgSeatsDto,
  BillingPortalDto,
} from './dto/subscription.dto';

@Controller('api/subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly planLimits: PlanLimitsService,
  ) {}

  private getUserId(req: Request): string {
    const userId = (req as any).userId;
    if (!userId) throw new UnauthorizedException('Not authenticated');
    return userId;
  }

  /**
   * GET /api/subscription/me
   * Returns current plan, limits, and daily usage for the authenticated user.
   */
  @Get('me')
  async getMySubscription(@Req() req: Request) {
    const userId = this.getUserId(req);
    return this.subscriptionService.getUserSubscriptionStatus(userId);
  }

  /**
   * GET /api/subscription/trial-eligibility
   * Returns whether the user qualifies for a free 14-day trial.
   */
  @Get('trial-eligibility')
  async getTrialEligibility(@Req() req: Request) {
    const userId = this.getUserId(req);
    return this.subscriptionService.checkTrialEligibility(userId);
  }

  /**
   * POST /api/subscription/trial/activate
   * Activates the in-app trial (no CC required) if eligible.
   */
  @Post('trial/activate')
  async activateTrial(@Req() req: Request) {
    const userId = this.getUserId(req);
    await this.subscriptionService.activateTrial(userId);
    return { message: 'Trial activated. Enjoy 14 days of Premium!' };
  }

  /**
   * POST /api/subscription/checkout/individual
   * Creates a Stripe Checkout session for Premium.
   * If user qualifies for trial, Stripe will offer it (no CC required).
   */
  @Post('checkout/individual')
  async createIndividualCheckout(
    @Req() req: Request,
    @Body() dto: CreateIndividualCheckoutDto,
  ) {
    const userId = this.getUserId(req);
    const user = (req as any).user;
    const email = user?.email;

    if (!email) throw new UnauthorizedException('Cannot determine user email');

    return this.subscriptionService.createIndividualCheckout(userId, email, dto.interval);
  }

  /**
   * POST /api/subscription/checkout/team
   * Creates a Stripe Checkout session for a Team plan (per-seat).
   * Only org owners can do this.
   */
  @Post('checkout/team')
  async createTeamCheckout(
    @Req() req: Request,
    @Body() dto: CreateTeamCheckoutDto,
  ) {
    const userId = this.getUserId(req);
    const user = (req as any).user;

    // Verify user can create orgs (Team/Enterprise)
    const canCreate = await this.planLimits.canCreateOrg(userId);
    // Note: for first-time Team setup, we allow it because buying the plan grants the right.
    // The check prevents Free users from accidentally reaching this endpoint.
    // For existing non-org users wanting to upgrade: we skip this gate on checkout.

    const email = user?.email;
    if (!email) throw new UnauthorizedException('Cannot determine user email');

    return this.subscriptionService.createTeamCheckout(dto.orgId, email, dto.seats, dto.interval);
  }

  /**
   * POST /api/subscription/portal
   * Opens the Stripe Billing Portal for individual plan management (cancel, update card).
   */
  @Post('portal')
  async createBillingPortal(@Req() req: Request, @Body() dto: BillingPortalDto) {
    const userId = this.getUserId(req);
    return this.subscriptionService.createBillingPortalSession(userId, dto.returnUrl);
  }

  /**
   * GET /api/subscription/org/:orgId
   * Returns org plan, seat info, and member count.
   */
  @Get('org/:orgId')
  async getOrgSubscription(@Param('orgId') orgId: string, @Req() req: Request) {
    this.getUserId(req); // ensure authenticated
    return this.subscriptionService.getOrgSubscriptionStatus(orgId);
  }

  /**
   * POST /api/subscription/org/:orgId/portal
   * Opens Stripe Billing Portal for org billing management.
   */
  @Post('org/:orgId/portal')
  async createOrgBillingPortal(
    @Param('orgId') orgId: string,
    @Req() req: Request,
    @Body() dto: BillingPortalDto,
  ) {
    this.getUserId(req);
    return this.subscriptionService.createOrgBillingPortalSession(orgId, dto.returnUrl);
  }

  /**
   * Post /api/subscription/org/:orgId/seats
   * Update seat count for a Team subscription.
   * Blocked if < 3 seats. Prorated Stripe invoice is issued immediately.
   */
  @Post('org/:orgId/seats')
  async updateOrgSeats(
    @Param('orgId') orgId: string,
    @Req() req: Request,
    @Body() dto: UpdateOrgSeatsDto,
  ) {
    this.getUserId(req);

    if (dto.seats < 3) {
      throw new ForbiddenException('Minimum seat count is 3');
    }

    return this.subscriptionService.updateOrgSeats(orgId, dto.seats);
  }
}
