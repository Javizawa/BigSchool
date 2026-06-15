import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

export class UpdateCouponDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  validUntil?: string | null;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxUses?: number | null;
}
