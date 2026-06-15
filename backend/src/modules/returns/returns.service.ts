import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { OrderStatus, Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateReturnDto } from './dto/create-return.dto';

const RETURN_INCLUDE = {
  items: {
    include: {
      orderItem: {
        select: {
          id: true,
          productName: true,
          variantSku: true,
          size: true,
          color: true,
          thumbnailUrl: true,
          unitPrice: true,
        },
      },
    },
  },
} satisfies Prisma.ReturnInclude;

type ReturnWithItems = Prisma.ReturnGetPayload<{
  include: typeof RETURN_INCLUDE;
}>;

@Injectable()
export class ReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrder(supabaseUser: SupabaseUser, orderId: string) {
    const user = await this.resolveUser(supabaseUser.id);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order || order.userId !== user.id) {
      throw new NotFoundException('Order not found');
    }

    const ret = await this.prisma.return.findUnique({
      where: { orderId },
      include: RETURN_INCLUDE,
    });
    if (!ret) throw new NotFoundException('No return found for this order');

    return this.mapReturn(ret);
  }

  async create(
    supabaseUser: SupabaseUser,
    orderId: string,
    dto: CreateReturnDto,
  ) {
    const user = await this.resolveUser(supabaseUser.id);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.userId !== user.id) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== OrderStatus.delivered) {
      throw new BadRequestException('Only delivered orders can be returned');
    }

    const existing = await this.prisma.return.findUnique({
      where: { orderId },
    });
    if (existing)
      throw new ConflictException('Return already requested for this order');

    for (const returnItem of dto.items) {
      const orderItem = order.items.find(
        (i) => i.id === returnItem.orderItemId,
      );
      if (!orderItem) {
        throw new BadRequestException(
          `Order item ${returnItem.orderItemId} not found in this order`,
        );
      }
      if (returnItem.quantity > orderItem.quantity) {
        throw new BadRequestException(
          `Cannot return more than purchased (max ${orderItem.quantity})`,
        );
      }
    }

    const ret = await this.prisma.$transaction(async (tx) => {
      const created = await tx.return.create({
        data: {
          orderId,
          reason: dto.reason,
          items: {
            create: dto.items.map((item) => ({
              orderItemId: item.orderItemId,
              quantity: item.quantity,
              reason: item.reason ?? null,
            })),
          },
        },
        include: RETURN_INCLUDE,
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.return_requested },
      });

      return created;
    });

    return this.mapReturn(ret);
  }

  private mapReturn(ret: ReturnWithItems) {
    return {
      id: ret.id,
      orderId: ret.orderId,
      status: ret.status,
      reason: ret.reason,
      refundAmount: ret.refundAmount !== null ? Number(ret.refundAmount) : null,
      items: ret.items.map((item) => ({
        id: item.id,
        orderItem: {
          id: item.orderItem.id,
          productName: item.orderItem.productName,
          variantSku: item.orderItem.variantSku,
          size: Number(item.orderItem.size),
          color: item.orderItem.color,
          thumbnailUrl: item.orderItem.thumbnailUrl,
          unitPrice: Number(item.orderItem.unitPrice),
        },
        quantity: item.quantity,
        reason: item.reason,
      })),
      createdAt: ret.createdAt,
      updatedAt: ret.updatedAt,
    };
  }

  private async resolveUser(supabaseId: string) {
    const user = await this.prisma.user.findUnique({ where: { supabaseId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
