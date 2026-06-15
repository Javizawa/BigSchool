import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const supabaseUser = request.supabaseUser;

    if (!supabaseUser) throw new ForbiddenException();

    const user = await this.prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: { role: true, status: true },
    });

    if (!user || user.role !== 'ADMIN' || user.status !== 'active') {
      throw new ForbiddenException();
    }

    return true;
  }
}
