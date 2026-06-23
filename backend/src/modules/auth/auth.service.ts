import { Injectable } from '@nestjs/common';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async syncUser(supabaseUser: SupabaseUser) {
    const email = supabaseUser.email ?? '';
    const meta = supabaseUser.user_metadata as
      | Record<string, string>
      | undefined;
    const fullNameParts = (meta?.['full_name'] ?? meta?.['name'] ?? '').split(' ');
    const firstName = meta?.['first_name'] ?? meta?.['given_name'] ?? fullNameParts[0] ?? '';
    const lastName = meta?.['last_name'] ?? meta?.['family_name'] ?? fullNameParts.slice(1).join(' ') ?? '';

    return this.prisma.user.upsert({
      where: { supabaseId: supabaseUser.id },
      create: { supabaseId: supabaseUser.id, email, firstName, lastName },
      update: {
        email,
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
      },
      select: {
        id: true,
        supabaseId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
