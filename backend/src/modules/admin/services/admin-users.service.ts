import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ListAdminUsersDto } from '../dto/list-users.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  role: true,
  status: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: ListAdminUsersDto) {
    const { page = 1, limit = 20, role, status, search } = dto;

    const where: Prisma.UserWhereInput = {
      ...(role && { role }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: {
          ...USER_SELECT,
          _count: { select: { orders: true } },
          orders: {
            select: { total: true },
            where: {
              status: {
                in: [
                  'confirmed',
                  'processing',
                  'shipped',
                  'delivered',
                ] as Prisma.EnumOrderStatusFilter['in'],
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const data = users.map(({ orders, _count, ...user }) => ({
      ...user,
      orderCount: _count.orders,
      totalSpent: orders.reduce((s, o) => s + Number(o.total), 0),
    }));

    return {
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...USER_SELECT,
        _count: { select: { orders: true } },
        orders: {
          select: { total: true },
          where: {
            status: {
              in: [
                'confirmed',
                'processing',
                'shipped',
                'delivered',
              ] as Prisma.EnumOrderStatusFilter['in'],
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const { orders, _count, ...rest } = user;
    return {
      ...rest,
      orderCount: _count.orders,
      totalSpent: orders.reduce((s, o) => s + Number(o.total), 0),
    };
  }

  async update(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });

    const final = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        ...USER_SELECT,
        _count: { select: { orders: true } },
        orders: {
          select: { total: true },
          where: {
            status: {
              in: [
                'confirmed',
                'processing',
                'shipped',
                'delivered',
              ] as Prisma.EnumOrderStatusFilter['in'],
            },
          },
        },
      },
    });

    const { orders, _count, ...rest } = final;
    return {
      ...rest,
      orderCount: _count.orders,
      totalSpent: orders.reduce((s, o) => s + Number(o.total), 0),
    };
  }
}
