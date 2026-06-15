import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { CouponType, Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

const CART_INCLUDE = {
  coupon: {
    select: {
      id: true,
      code: true,
      type: true,
      value: true,
      minOrderAmount: true,
    },
  },
  items: {
    include: {
      variant: {
        select: {
          id: true,
          sku: true,
          size: true,
          color: true,
          colorHex: true,
          stock: true,
          imageUrls: true,
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
              brand: {
                select: { id: true, name: true, slug: true, logoUrl: true },
              },
              category: {
                select: { id: true, name: true, slug: true, imageUrl: true },
              },
            },
          },
        },
      },
    },
    orderBy: { id: 'asc' as const },
  },
} satisfies Prisma.CartInclude;

type CartWithItems = Prisma.CartGetPayload<{ include: typeof CART_INCLUDE }>;

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(supabaseUser: SupabaseUser) {
    const user = await this.resolveUser(supabaseUser.id);
    const cart = await this.findOrCreateCart(user.id);
    return this.mapCart(cart);
  }

  async clearCart(supabaseUser: SupabaseUser) {
    const user = await this.resolveUser(supabaseUser.id);
    const cart = await this.prisma.cart.findUnique({
      where: { userId: user.id },
    });
    if (!cart) return;

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: null },
    });
  }

  async addItem(supabaseUser: SupabaseUser, dto: AddCartItemDto) {
    const user = await this.resolveUser(supabaseUser.id);

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
      include: {
        product: { select: { price: true, salePrice: true, saleEndsAt: true } },
      },
    });
    if (!variant) throw new NotFoundException('Variant not found');
    if (variant.stock < dto.quantity) {
      throw new BadRequestException(`Only ${variant.stock} units available`);
    }

    const now = new Date();
    const isOnSale =
      variant.product.salePrice !== null &&
      (variant.product.saleEndsAt === null || variant.product.saleEndsAt > now);
    const unitPrice = isOnSale
      ? variant.product.salePrice!
      : variant.product.price;

    const cart = await this.findOrCreateCart(user.id);

    const existing = await this.prisma.cartItem.findUnique({
      where: {
        cartId_variantId: { cartId: cart.id, variantId: dto.variantId },
      },
    });

    if (existing) {
      const newQty = existing.quantity + dto.quantity;
      if (newQty > variant.stock) {
        throw new BadRequestException(`Only ${variant.stock} units available`);
      }
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty, unitPrice },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId: dto.variantId,
          quantity: dto.quantity,
          unitPrice,
        },
      });
    }

    const updated = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: CART_INCLUDE,
    });
    return this.mapCart(updated);
  }

  async updateItem(
    supabaseUser: SupabaseUser,
    itemId: string,
    dto: UpdateCartItemDto,
  ) {
    const user = await this.resolveUser(supabaseUser.id);
    const cart = await this.prisma.cart.findUnique({
      where: { userId: user.id },
    });
    if (!cart) throw new NotFoundException('Cart not found');

    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });
    if (!item || item.cartId !== cart.id)
      throw new NotFoundException('Cart item not found');

    const variant = await this.prisma.productVariant.findUniqueOrThrow({
      where: { id: item.variantId },
    });
    if (dto.quantity > variant.stock) {
      throw new BadRequestException(`Only ${variant.stock} units available`);
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });

    const updated = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: CART_INCLUDE,
    });
    return this.mapCart(updated);
  }

  async removeItem(supabaseUser: SupabaseUser, itemId: string) {
    const user = await this.resolveUser(supabaseUser.id);
    const cart = await this.prisma.cart.findUnique({
      where: { userId: user.id },
    });
    if (!cart) throw new NotFoundException('Cart not found');

    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });
    if (!item || item.cartId !== cart.id)
      throw new NotFoundException('Cart item not found');

    await this.prisma.cartItem.delete({ where: { id: itemId } });

    const updated = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: CART_INCLUDE,
    });
    return this.mapCart(updated);
  }

  private async findOrCreateCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: CART_INCLUDE,
    });
  }

  private async resolveUser(supabaseId: string) {
    const user = await this.prisma.user.findUnique({ where: { supabaseId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private mapCart(cart: CartWithItems) {
    const now = new Date();

    const items = cart.items.map((item) => {
      const { product, ...variant } = item.variant;
      const isOnSale =
        product.salePrice !== null &&
        (product.saleEndsAt === null || product.saleEndsAt > now);
      const unitPrice = isOnSale
        ? Number(product.salePrice)
        : Number(product.price);

      return {
        id: item.id,
        variant: {
          ...variant,
          size: Number(variant.size),
        },
        product: {
          ...product,
          price: Number(product.price),
          salePrice:
            product.salePrice !== null ? Number(product.salePrice) : null,
        },
        quantity: item.quantity,
        unitPrice,
        subtotal: unitPrice * item.quantity,
      };
    });

    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

    let discount = 0;
    if (cart.coupon) {
      const minOk =
        cart.coupon.minOrderAmount === null ||
        subtotal >= Number(cart.coupon.minOrderAmount);

      if (minOk) {
        discount =
          cart.coupon.type === CouponType.percentage
            ? (subtotal * Number(cart.coupon.value)) / 100
            : Math.min(subtotal, Number(cart.coupon.value));
        discount = Math.round(discount * 100) / 100;
      }
    }

    return {
      id: cart.id,
      items,
      itemCount,
      subtotal: Math.round(subtotal * 100) / 100,
      discount,
      total: Math.round((subtotal - discount) * 100) / 100,
      appliedCoupon: cart.coupon
        ? {
            ...cart.coupon,
            value: Number(cart.coupon.value),
            minOrderAmount:
              cart.coupon.minOrderAmount !== null
                ? Number(cart.coupon.minOrderAmount)
                : null,
          }
        : null,
      updatedAt: cart.updatedAt,
    };
  }
}
