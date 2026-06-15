import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Coupon } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateCouponDto } from '../dto/create-coupon.dto';
import { UpdateCouponDto } from '../dto/update-coupon.dto';

@Injectable()
export class AdminCouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(isActive?: boolean) {
    const coupons = await this.prisma.coupon.findMany({
      where: isActive !== undefined ? { isActive } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return coupons.map((c) => this.mapCoupon(c));
  }

  async findOne(couponId: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id: couponId },
    });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return this.mapCoupon(coupon);
  }

  async create(dto: CreateCouponDto) {
    const code = dto.code.toUpperCase();
    const existing = await this.prisma.coupon.findUnique({ where: { code } });
    if (existing) throw new ConflictException('Coupon code already exists');

    const coupon = await this.prisma.coupon.create({
      data: {
        code,
        type: dto.type,
        value: dto.value,
        minOrderAmount: dto.minOrderAmount ?? null,
        maxUses: dto.maxUses ?? null,
        validFrom: new Date(dto.validFrom),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        isActive: dto.isActive ?? true,
      },
    });
    return this.mapCoupon(coupon);
  }

  async update(couponId: string, dto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id: couponId },
    });
    if (!coupon) throw new NotFoundException('Coupon not found');

    const updated = await this.prisma.coupon.update({
      where: { id: couponId },
      data: {
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.validUntil !== undefined && {
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        }),
        ...(dto.maxUses !== undefined && { maxUses: dto.maxUses }),
      },
    });
    return this.mapCoupon(updated);
  }

  async remove(couponId: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id: couponId },
    });
    if (!coupon) throw new NotFoundException('Coupon not found');
    await this.prisma.coupon.delete({ where: { id: couponId } });
  }

  private mapCoupon(coupon: Coupon) {
    return {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      minOrderAmount: coupon.minOrderAmount
        ? Number(coupon.minOrderAmount)
        : null,
      maxUses: coupon.maxUses,
      usedCount: coupon.usedCount,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      isActive: coupon.isActive,
    };
  }
}
