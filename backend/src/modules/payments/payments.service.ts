import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { OrderStatus } from '../../../generated/prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!);

  constructor(private readonly prisma: PrismaService) {}

  async createIntent(supabaseUser: SupabaseUser, dto: CreatePaymentIntentDto) {
    const user = await this.resolveUser(supabaseUser.id);

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });
    if (!order || order.userId !== user.id) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== OrderStatus.pending_payment) {
      throw new BadRequestException('Order is not pending payment');
    }

    const amountCents = Math.round(Number(order.total) * 100);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      metadata: { orderId: order.id, userId: user.id },
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  private async resolveUser(supabaseId: string) {
    const user = await this.prisma.user.findUnique({ where: { supabaseId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
