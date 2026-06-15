import { BadRequestException, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { OrderStatus } from '../../../generated/prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class WebhooksService {
  private readonly stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!);

  constructor(private readonly prisma: PrismaService) {}

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    if (!rawBody || rawBody.length === 0) {
      throw new BadRequestException(
        'Missing raw request body — ensure rawBody: true is set in NestFactory.create()',
      );
    }

    const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];
    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook secret not configured');
    }

    let event: ReturnType<typeof this.stripe.webhooks.constructEvent>;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch {
      throw new BadRequestException('Invalid Stripe signature');
    }

    if (
      event.type === 'payment_intent.succeeded' ||
      event.type === 'payment_intent.payment_failed'
    ) {
      const paymentIntentId = (event.data.object as { id: string }).id;
      const newStatus =
        event.type === 'payment_intent.succeeded'
          ? OrderStatus.confirmed
          : OrderStatus.payment_failed;

      await this.prisma.order.updateMany({
        where: { stripePaymentIntentId: paymentIntentId },
        data: { status: newStatus },
      });
    }

    return { received: true };
  }
}
