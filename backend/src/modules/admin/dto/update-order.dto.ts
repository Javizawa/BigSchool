import { Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { OrderStatus } from '../../../../generated/prisma/client';

export class TrackingDto {
  @IsString()
  carrier: string;

  @IsString()
  trackingNumber: string;

  @IsUrl()
  @IsOptional()
  trackingUrl?: string | null;
}

export class UpdateOrderDto {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ValidateNested()
  @Type(() => TrackingDto)
  @IsOptional()
  tracking?: TrackingDto;

  @IsString()
  @IsOptional()
  adminNotes?: string | null;
}
