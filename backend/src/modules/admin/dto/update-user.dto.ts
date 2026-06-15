import { IsEnum, IsOptional } from 'class-validator';
import { UserRole, UserStatus } from '../../../../generated/prisma/client';

export class UpdateUserDto {
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
