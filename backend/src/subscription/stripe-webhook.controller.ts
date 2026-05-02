import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/decorators/require-permission.decorator';

@Controller('api/webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripe: StripeService,
    private readonly subscriptionService: SubscriptionService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = (req as any).rawBody as Buffer;

    if (!rawBody) {
      throw new BadRequestException('Raw body not available');
    }

    let event: any;
    try {
      event = this.stripe.constructWebhookEvent(rawBody, signature);
    } catch (err) {
      this.logger.warn(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    // Idempotency — skip already-processed events
    const existing = await this.prisma.stripeWebhookEvent.findUnique({
      where: { stripeEventId: event.id },
    });

    if (existing?.processed) {
      this.logger.debug(`Skipping already-processed event ${event.id}`);
      return { received: true };
    }

    // Record the event
    await this.prisma.stripeWebhookEvent.upsert({
      where: { stripeEventId: event.id },
      create: { stripeEventId: event.id, type: event.type },
      update: {},
    });

    try {
      await this.dispatch(event);

      await this.prisma.stripeWebhookEvent.update({
        where: { stripeEventId: event.id },
        data: { processed: true, processedAt: new Date() },
      });
    } catch (err) {
      this.logger.error(`Error processing webhook ${event.id} (${event.type}): ${err.message}`);

      await this.prisma.stripeWebhookEvent.update({
        where: { stripeEventId: event.id },
        data: { error: err.message },
      });

      // Return 200 so Stripe doesn't retry — we logged the failure
    }

    return { received: true };
  }

  private async dispatch(event: any) {
    const obj = event.data.object;

    switch (event.type) {
      case 'checkout.session.completed':
        await this.subscriptionService.handleCheckoutCompleted(obj);
        break;

      case 'customer.subscription.updated':
        await this.subscriptionService.handleSubscriptionUpdated(obj);
        break;

      case 'customer.subscription.deleted':
        await this.subscriptionService.handleSubscriptionDeleted(obj);
        break;

      case 'invoice.paid':
        await this.subscriptionService.handleInvoicePaid(obj);
        break;

      case 'invoice.payment_failed':
        await this.subscriptionService.handlePaymentFailed(obj);
        break;

      default:
        this.logger.debug(`Unhandled webhook event type: ${event.type}`);
    }
  }
}
