import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ReturnStatus } from '../../../../generated/prisma/client';

export class UpdateReturnDto {
  @IsEnum(ReturnStatus)
  status: ReturnStatus;

  @IsString()
  @IsOptional()
  adminNotes?: string | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  refundAmount?: number | null;
}
