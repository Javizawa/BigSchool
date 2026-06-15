import { BadRequestException, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { OrderStatus } from '../../../generated/prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class WebhooksService {
  private readonly stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!);

  constructor(private readonly prisma: PrismaService) {}

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];
    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook secret not configured');
    }

    let eventType: string;
    let paymentIntentId: string;
    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
      eventType = event.type;
      paymentIntentId = (event.data.object as { id: string }).id;
    } catch {
      throw new BadRequestException('Invalid Stripe signature');
    }

    if (eventType === 'payment_intent.succeeded') {
      await this.prisma.order.updateMany({
        where: { stripePaymentIntentId: paymentIntentId },
        data: { status: OrderStatus.confirmed },
      });
    } else if (eventType === 'payment_intent.payment_failed') {
      await this.prisma.order.updateMany({
        where: { stripePaymentIntentId: paymentIntentId },
        data: { status: OrderStatus.payment_failed },
      });
    }

    return { received: true };
  }
}
