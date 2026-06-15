import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CouponType } from '../../../generated/prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(dto: ValidateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      throw new NotFoundException('Coupon not found or inactive');
    }

    const now = new Date();
    if (coupon.validFrom > now) {
      throw new BadRequestException('Coupon is not yet valid');
    }
    if (coupon.validUntil && coupon.validUntil < now) {
      throw new BadRequestException('Coupon has expired');
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    const minAmount = coupon.minOrderAmount ? Number(coupon.minOrderAmount) : 0;
    if (dto.cartTotal < minAmount) {
      throw new BadRequestException(
        `Minimum order amount of ${minAmount} EUR required`,
      );
    }

    const value = Number(coupon.value);
    const discount =
      coupon.type === CouponType.percentage
        ? Math.round(((dto.cartTotal * value) / 100) * 100) / 100
        : Math.min(dto.cartTotal, value);

    return {
      code: coupon.code,
      type: coupon.type,
      value,
      discount,
      minOrderAmount: minAmount > 0 ? minAmount : null,
    };
  }
}
