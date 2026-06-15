import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ListAdminOrdersDto } from '../dto/list-orders.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';

const ORDER_INCLUDE = {
  items: true,
  tracking: true,
  user: { select: { id: true, email: true, firstName: true, lastName: true } },
} satisfies Prisma.OrderInclude;

type AdminOrder = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

@Injectable()
export class AdminOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: ListAdminOrdersDto) {
    const {
      page = 1,
      limit = 20,
      status,
      userId,
      dateFrom,
      dateTo,
      search,
    } = dto;

    const where: Prisma.OrderWhereInput = {
      ...(status && { status }),
      ...(userId && { userId }),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo + 'T23:59:59.999Z') }),
            },
          }
        : {}),
      ...(search && {
        OR: [
          { id: { contains: search, mode: 'insensitive' as const } },
          {
            user: {
              email: { contains: search, mode: 'insensitive' as const },
            },
          },
        ],
      }),
    };

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
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

  async findOne(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.mapOrder(order);
  }

  async update(orderId: string, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Order not found');

    if (dto.status) {
      this.validateStatusTransition(order.status, dto.status);
    }

    await this.prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: orderId },
        data: {
          ...(dto.status && { status: dto.status }),
          ...(dto.adminNotes !== undefined && { adminNotes: dto.adminNotes }),
        },
        include: ORDER_INCLUDE,
      });

      if (dto.tracking) {
        await tx.orderTracking.upsert({
          where: { orderId },
          create: {
            orderId,
            carrier: dto.tracking.carrier,
            trackingNumber: dto.tracking.trackingNumber,
            trackingUrl: dto.tracking.trackingUrl ?? null,
          },
          update: {
            carrier: dto.tracking.carrier,
            trackingNumber: dto.tracking.trackingNumber,
            trackingUrl: dto.tracking.trackingUrl ?? null,
          },
        });
      }

      return result;
    });

    const final = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });
    return this.mapOrder(final);
  }

  private validateStatusTransition(from: OrderStatus, to: OrderStatus) {
    const allowed: Partial<Record<OrderStatus, OrderStatus[]>> = {
      [OrderStatus.pending_payment]: [OrderStatus.cancelled],
      [OrderStatus.confirmed]: [OrderStatus.processing, OrderStatus.cancelled],
      [OrderStatus.processing]: [OrderStatus.shipped, OrderStatus.cancelled],
      [OrderStatus.shipped]: [OrderStatus.delivered],
      [OrderStatus.delivered]: [OrderStatus.return_requested],
      [OrderStatus.return_requested]: [
        OrderStatus.return_approved,
        OrderStatus.confirmed,
      ],
      [OrderStatus.return_approved]: [OrderStatus.refunded],
    };
    const valid = allowed[from] ?? [];
    if (!valid.includes(to)) {
      throw new BadRequestException(
        `Cannot transition order from ${from} to ${to}`,
      );
    }
  }

  private mapOrder(order: AdminOrder) {
    return {
      id: order.id,
      status: order.status,
      user: order.user,
      shippingAddressSnapshot: order.shippingAddressSnapshot,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      couponCode: order.couponCode,
      stripePaymentIntentId: order.stripePaymentIntentId,
      adminNotes: order.adminNotes,
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
}
