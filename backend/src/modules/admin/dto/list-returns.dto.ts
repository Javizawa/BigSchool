import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ReturnStatus } from '../../../../generated/prisma/client';

export class ListAdminReturnsDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  page?: number = 1;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  limit?: number = 20;

  @IsEnum(ReturnStatus)
  @IsOptional()
  status?: ReturnStatus;
}
