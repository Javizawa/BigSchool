import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, ReturnStatus } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ListAdminReturnsDto } from '../dto/list-returns.dto';
import { UpdateReturnDto } from '../dto/update-return.dto';

const RETURN_INCLUDE = {
  order: {
    select: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  },
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
export class AdminReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: ListAdminReturnsDto) {
    const { page = 1, limit = 20, status } = dto;

    const where: Prisma.ReturnWhereInput = {
      ...(status && { status }),
    };

    const [total, returns] = await Promise.all([
      this.prisma.return.count({ where }),
      this.prisma.return.findMany({
        where,
        include: RETURN_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: returns.map((r) => this.mapReturn(r)),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async findOne(returnId: string) {
    const ret = await this.prisma.return.findUnique({
      where: { id: returnId },
      include: RETURN_INCLUDE,
    });
    if (!ret) throw new NotFoundException('Return not found');
    return this.mapReturn(ret);
  }

  async update(returnId: string, dto: UpdateReturnDto) {
    const ret = await this.prisma.return.findUnique({
      where: { id: returnId },
    });
    if (!ret) throw new NotFoundException('Return not found');

    this.validateStatusTransition(ret.status, dto.status);

    const ORDER_STATUS_SYNC: Partial<Record<ReturnStatus, OrderStatus>> = {
      [ReturnStatus.approved]: OrderStatus.return_approved,
      [ReturnStatus.rejected]: OrderStatus.delivered,
      [ReturnStatus.refunded]: OrderStatus.refunded,
    };

    const updated = await this.prisma.$transaction(async (tx) => {
      const orderStatus = ORDER_STATUS_SYNC[dto.status];
      if (orderStatus) {
        await tx.order.update({
          where: { id: ret.orderId },
          data: { status: orderStatus },
        });
      }
      return tx.return.update({
        where: { id: returnId },
        data: {
          status: dto.status,
          ...(dto.adminNotes !== undefined && { adminNotes: dto.adminNotes }),
          ...(dto.refundAmount !== undefined && { refundAmount: dto.refundAmount }),
        },
        include: RETURN_INCLUDE,
      });
    });

    return this.mapReturn(updated);
  }

  private validateStatusTransition(from: ReturnStatus, to: ReturnStatus) {
    const allowed: Partial<Record<ReturnStatus, ReturnStatus[]>> = {
      [ReturnStatus.requested]: [ReturnStatus.approved, ReturnStatus.rejected],
      [ReturnStatus.approved]: [ReturnStatus.completed],
      [ReturnStatus.completed]: [ReturnStatus.refunded],
    };
    const valid = allowed[from] ?? [];
    if (!valid.includes(to)) {
      throw new BadRequestException(
        `Cannot transition return from ${from} to ${to}`,
      );
    }
  }

  private mapReturn(ret: ReturnWithItems) {
    return {
      id: ret.id,
      orderId: ret.orderId,
      status: ret.status,
      reason: ret.reason,
      adminNotes: ret.adminNotes,
      refundAmount: ret.refundAmount !== null ? Number(ret.refundAmount) : null,
      user: {
        id: ret.order.user.id,
        email: ret.order.user.email,
        firstName: ret.order.user.firstName,
        lastName: ret.order.user.lastName,
      },
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
}
