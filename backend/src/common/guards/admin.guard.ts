import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRole, UserStatus } from '../../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const supabaseUser = request.supabaseUser;

    if (!supabaseUser) throw new ForbiddenException();

    const user = await this.prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: { role: true, status: true },
    });

    if (
      !user ||
      user.role !== UserRole.ADMIN ||
      user.status !== UserStatus.active
    ) {
      throw new ForbiddenException();
    }

    return true;
  }
}
