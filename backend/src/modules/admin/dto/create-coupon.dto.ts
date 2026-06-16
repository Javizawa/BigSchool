import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { CouponType } from '../../../../generated/prisma/client';

export class CreateCouponDto {
  @IsString()
  @MinLength(1)
  code: string;

  @IsEnum(CouponType)
  type: CouponType;

  @IsNumber()
  @Min(0)
  value: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minOrderAmount?: number | null;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxUses?: number | null;

  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @IsDateString()
  @IsOptional()
  validUntil?: string | null;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
