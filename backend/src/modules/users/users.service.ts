import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AddressDto } from './dto/address.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SELECT = {
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
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(supabaseUser: SupabaseUser) {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: USER_SELECT,
    });
    if (!user)
      throw new UnauthorizedException(
        'User not synced — call GET /auth/me first',
      );
    return user;
  }

  async updateMe(supabaseUser: SupabaseUser, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });
    if (!user)
      throw new UnauthorizedException(
        'User not synced — call GET /auth/me first',
      );

    return this.prisma.user.update({
      where: { id: user.id },
      data: dto,
      select: USER_SELECT,
    });
  }

  async listAddresses(supabaseUser: SupabaseUser) {
    const user = await this.resolveUser(supabaseUser.id);
    return this.prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAddress(supabaseUser: SupabaseUser, dto: AddressDto) {
    const user = await this.resolveUser(supabaseUser.id);

    if (dto.isDefault) {
      await this.clearDefaultAddress(user.id);
    }

    return this.prisma.address.create({
      data: { ...dto, userId: user.id, isDefault: dto.isDefault ?? false },
    });
  }

  async updateAddress(
    supabaseUser: SupabaseUser,
    addressId: string,
    dto: AddressDto,
  ) {
    const user = await this.resolveUser(supabaseUser.id);
    const address = await this.findOwnedAddress(user.id, addressId);

    if (dto.isDefault && !address.isDefault) {
      await this.clearDefaultAddress(user.id);
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: dto,
    });
  }

  async deleteAddress(supabaseUser: SupabaseUser, addressId: string) {
    const user = await this.resolveUser(supabaseUser.id);
    await this.findOwnedAddress(user.id, addressId);
    await this.prisma.address.delete({ where: { id: addressId } });
  }

  async listStockNotifications(supabaseUser: SupabaseUser) {
    const user = await this.resolveUser(supabaseUser.id);
    return this.prisma.stockNotification.findMany({
      where: { userId: user.id },
      include: {
        variant: {
          select: {
            id: true,
            sku: true,
            size: true,
            color: true,
            product: {
              select: { id: true, name: true, slug: true, thumbnailUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async resolveUser(supabaseId: string) {
    const user = await this.prisma.user.findUnique({ where: { supabaseId } });
    if (!user)
      throw new UnauthorizedException(
        'User not synced — call GET /auth/me first',
      );
    return user;
  }

  private async findOwnedAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });
    if (!address || address.userId !== userId)
      throw new NotFoundException('Address not found');
    return address;
  }

  private async clearDefaultAddress(userId: string) {
    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }
}
