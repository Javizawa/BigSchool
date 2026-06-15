import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  Coupon,
  CouponType,
  OrderStatus,
  Prisma,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

const CART_FOR_ORDER = {
  coupon: {
    select: {
      id: true,
      code: true,
      type: true,
      value: true,
      minOrderAmount: true,
    },
  },
  items: {
    include: {
      variant: {
        select: {
          sku: true,
          size: true,
          color: true,
          product: {
            select: { name: true, slug: true, thumbnailUrl: true },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

const ORDER_INCLUDE = {
  items: true,
  tracking: true,
  coupon: { select: { id: true, code: true } },
} satisfies Prisma.OrderInclude;

type CartForOrder = Prisma.CartGetPayload<{ include: typeof CART_FOR_ORDER }>;
type OrderWithDetails = Prisma.OrderGetPayload<{
  include: typeof ORDER_INCLUDE;
}>;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(supabaseUser: SupabaseUser, page = 1, limit = 10) {
    const user = await this.resolveUser(supabaseUser.id);

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where: { userId: user.id } }),
      this.prisma.order.findMany({
        where: { userId: user.id },
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: orders.map((o) => this.mapOrder(o)),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async findOne(supabaseUser: SupabaseUser, orderId: string) {
    const user = await this.resolveUser(supabaseUser.id);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });
    if (!order || order.userId !== user.id) {
      throw new NotFoundException('Order not found');
    }

    return this.mapOrder(order);
  }

  async create(supabaseUser: SupabaseUser, dto: CreateOrderDto) {
    const user = await this.resolveUser(supabaseUser.id);

    const cart = await this.prisma.cart.findUnique({
      where: { userId: user.id },
      include: CART_FOR_ORDER,
    });
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const address = await this.prisma.address.findUnique({
      where: { id: dto.addressId },
    });
    if (!address || address.userId !== user.id) {
      throw new NotFoundException('Address not found');
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0,
    );

    let discount = 0;
    let appliedCoupon: Coupon | null = null;

    const couponCode = dto.couponCode ?? cart.coupon?.code;
    if (couponCode) {
      const coupon = await this.validateCoupon(couponCode, subtotal);
      appliedCoupon = coupon;
      const value = Number(coupon.value);
      discount =
        coupon.type === CouponType.percentage
          ? (subtotal * value) / 100
          : Math.min(subtotal, value);
      discount = Math.round(discount * 100) / 100;
    }

    const total = Math.round((subtotal - discount) * 100) / 100;

    const shippingAddressSnapshot = {
      alias: address.alias,
      street: address.street,
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
      country: address.country,
    };

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: user.id,
          status: OrderStatus.pending_payment,
          shippingAddressSnapshot,
          subtotal,
          discount,
          shippingCost: 0,
          total,
          couponCode: appliedCoupon?.code ?? null,
          couponId: appliedCoupon?.id ?? null,
          items: {
            create: cart.items.map((item) => ({
              productName: item.variant.product.name,
              productSlug: item.variant.product.slug,
              variantSku: item.variant.sku,
              size: Number(item.variant.size),
              color: item.variant.color,
              thumbnailUrl: item.variant.product.thumbnailUrl ?? null,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              subtotal:
                Math.round(Number(item.unitPrice) * item.quantity * 100) / 100,
            })),
          },
        },
        include: ORDER_INCLUDE,
      });

      if (appliedCoupon) {
        await tx.coupon.update({
          where: { id: appliedCoupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: { couponId: null },
      });

      return created;
    });

    return this.mapOrder(order);
  }

  async cancel(supabaseUser: SupabaseUser, orderId: string) {
    const user = await this.resolveUser(supabaseUser.id);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, status: true, couponId: true },
    });
    if (!order || order.userId !== user.id) {
      throw new NotFoundException('Order not found');
    }

    const cancellable: OrderStatus[] = [
      OrderStatus.pending_payment,
      OrderStatus.confirmed,
    ];
    if (!cancellable.includes(order.status)) {
      throw new BadRequestException(
        `Cannot cancel order in status ${order.status}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.cancelled },
        include: ORDER_INCLUDE,
      });

      if (order.couponId) {
        await tx.coupon.update({
          where: { id: order.couponId },
          data: { usedCount: { decrement: 1 } },
        });
      }

      return result;
    });

    return this.mapOrder(updated);
  }

  private async validateCoupon(code: string, cartTotal: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Invalid coupon code');
    }
    const now = new Date();
    if (
      coupon.validFrom > now ||
      (coupon.validUntil && coupon.validUntil < now)
    ) {
      throw new BadRequestException('Coupon is expired or not yet valid');
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Coupon usage limit reached');
    }
    const minAmount = coupon.minOrderAmount ? Number(coupon.minOrderAmount) : 0;
    if (cartTotal < minAmount) {
      throw new BadRequestException(
        `Minimum order amount of ${minAmount} EUR required`,
      );
    }
    return coupon;
  }

  private mapOrder(order: OrderWithDetails) {
    return {
      id: order.id,
      status: order.status,
      shippingAddressSnapshot: order.shippingAddressSnapshot,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      couponCode: order.couponCode,
      stripePaymentIntentId: order.stripePaymentIntentId,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        productSlug: item.productSlug,
        variantSku: item.variantSku,
        size: Number(item.size),
        color: item.color,
        thumbnailUrl: item.thumbnailUrl,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
      })),
      tracking: order.tracking
        ? {
            carrier: order.tracking.carrier,
            trackingNumber: order.tracking.trackingNumber,
            trackingUrl: order.tracking.trackingUrl,
          }
        : null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private async resolveUser(supabaseId: string) {
    const user = await this.prisma.user.findUnique({ where: { supabaseId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
