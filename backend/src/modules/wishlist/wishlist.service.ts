import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';

const WISHLIST_INCLUDE = {
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      thumbnailUrl: true,
      price: true,
      salePrice: true,
      saleEndsAt: true,
      gender: true,
      brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
      category: {
        select: { id: true, name: true, slug: true, imageUrl: true },
      },
    },
  },
} satisfies Prisma.WishlistItemInclude;

type WishlistItemWithProduct = Prisma.WishlistItemGetPayload<{
  include: typeof WISHLIST_INCLUDE;
}>;

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(supabaseUser: SupabaseUser) {
    const user = await this.resolveUser(supabaseUser.id);
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: WISHLIST_INCLUDE,
      orderBy: { addedAt: 'desc' },
    });
    return items.map((item) => this.mapItem(item));
  }

  async add(supabaseUser: SupabaseUser, dto: AddToWishlistDto) {
    const user = await this.resolveUser(supabaseUser.id);

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId, isActive: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_productId: { userId: user.id, productId: dto.productId },
      },
    });
    if (existing) throw new ConflictException('Product already in wishlist');

    const item = await this.prisma.wishlistItem.create({
      data: { userId: user.id, productId: dto.productId },
      include: WISHLIST_INCLUDE,
    });
    return this.mapItem(item);
  }

  async remove(supabaseUser: SupabaseUser, productId: string) {
    const user = await this.resolveUser(supabaseUser.id);

    const item = await this.prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });
    if (!item) throw new NotFoundException('Product not in wishlist');

    await this.prisma.wishlistItem.delete({ where: { id: item.id } });
  }

  private mapItem(item: WishlistItemWithProduct) {
    return {
      id: item.id,
      product: {
        ...item.product,
        price: Number(item.product.price),
        salePrice:
          item.product.salePrice !== null
            ? Number(item.product.salePrice)
            : null,
      },
      addedAt: item.addedAt,
    };
  }

  private async resolveUser(supabaseId: string) {
    const user = await this.prisma.user.findUnique({ where: { supabaseId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
