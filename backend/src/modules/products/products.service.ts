import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ListProductsDto, ProductSortBy } from './dto/list-products.dto';

const BRAND_SELECT = {
  id: true,
  name: true,
  slug: true,
  logoUrl: true,
} as const;
const CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  imageUrl: true,
} as const;
const VARIANT_SELECT = {
  id: true,
  sku: true,
  size: true,
  color: true,
  colorHex: true,
  stock: true,
  imageUrls: true,
} as const;

const BASE_INCLUDE = {
  brand: { select: BRAND_SELECT },
  category: { select: CATEGORY_SELECT },
} satisfies Prisma.ProductInclude;

const DETAIL_INCLUDE = {
  ...BASE_INCLUDE,
  variants: { select: VARIANT_SELECT },
  seo: {
    select: { metaTitle: true, metaDescription: true, canonicalUrl: true },
  },
} satisfies Prisma.ProductInclude;

type ProductBase = Prisma.ProductGetPayload<{ include: typeof BASE_INCLUDE }>;
type ProductDetail = Prisma.ProductGetPayload<{
  include: typeof DETAIL_INCLUDE;
}>;
type ReviewStats = Map<string, { avg: number | null; count: number }>;

const ORDER_BY_MAP: Record<
  ProductSortBy,
  Prisma.ProductOrderByWithRelationInput
> = {
  [ProductSortBy.PRICE_ASC]: { price: 'asc' },
  [ProductSortBy.PRICE_DESC]: { price: 'desc' },
  [ProductSortBy.NEWEST]: { createdAt: 'desc' },
  [ProductSortBy.POPULARITY]: { reviews: { _count: 'desc' } },
  [ProductSortBy.RATING]: { reviews: { _count: 'desc' } },
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: ListProductsDto) {
    const {
      page,
      limit,
      categoryId,
      brandId,
      gender,
      minPrice,
      maxPrice,
      size,
      color,
      search,
      onSale,
      sortBy,
    } = dto;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(categoryId && { categoryId }),
      ...(brandId && { brandId }),
      ...(gender && { gender }),
      ...((minPrice !== undefined || maxPrice !== undefined) && {
        price: {
          ...(minPrice !== undefined && { gte: minPrice }),
          ...(maxPrice !== undefined && { lte: maxPrice }),
        },
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(onSale && { salePrice: { not: null } }),
      ...((size !== undefined || color) && {
        variants: {
          some: {
            ...(size !== undefined && { size }),
            ...(color && { color: { contains: color, mode: 'insensitive' } }),
            stock: { gt: 0 },
          },
        },
      }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: ORDER_BY_MAP[sortBy],
        include: BASE_INCLUDE,
      }),
      this.prisma.product.count({ where }),
    ]);

    const stats = await this.getReviewStats(products.map((p) => p.id));

    return {
      data: products.map((p) => this.mapProduct(p, stats)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: DETAIL_INCLUDE,
    });

    if (!product || !product.isActive)
      throw new NotFoundException('Product not found');

    const stats = await this.getReviewStats([productId]);
    return this.mapProductDetail(product, stats);
  }

  async findRelated(productId: string, limit: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true, brandId: true },
    });

    if (!product) throw new NotFoundException('Product not found');

    const related = await this.prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: productId },
        OR: [{ categoryId: product.categoryId }, { brandId: product.brandId }],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: BASE_INCLUDE,
    });

    const stats = await this.getReviewStats(related.map((p) => p.id));
    return related.map((p) => this.mapProduct(p, stats));
  }

  private async getReviewStats(productIds: string[]): Promise<ReviewStats> {
    if (productIds.length === 0) return new Map();

    const rows = await this.prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds } },
      _avg: { rating: true },
      _count: { id: true },
    });

    return new Map(
      rows.map((r) => [
        r.productId,
        { avg: r._avg.rating, count: r._count.id },
      ]),
    );
  }

  private mapProduct(p: ProductBase, stats: ReviewStats) {
    const stat = stats.get(p.id);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      category: p.category,
      gender: p.gender,
      price: Number(p.price),
      salePrice: p.salePrice !== null ? Number(p.salePrice) : null,
      saleEndsAt: p.saleEndsAt,
      thumbnailUrl: p.thumbnailUrl,
      averageRating: stat?.avg ?? null,
      reviewCount: stat?.count ?? 0,
      isActive: p.isActive,
      createdAt: p.createdAt,
    };
  }

  async subscribeStockNotification(
    supabaseUser: SupabaseUser,
    productId: string,
    variantId: string,
  ) {
    const user = await this.resolveUser(supabaseUser.id);

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant || variant.productId !== productId) {
      throw new NotFoundException('Variant not found');
    }

    return this.prisma.stockNotification.upsert({
      where: { userId_variantId: { userId: user.id, variantId } },
      create: { userId: user.id, productId, variantId },
      update: {},
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
    });
  }

  private async resolveUser(supabaseId: string) {
    const user = await this.prisma.user.findUnique({ where: { supabaseId } });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  private mapProductDetail(p: ProductDetail, stats: ReviewStats) {
    return {
      ...this.mapProduct(p, stats),
      description: p.description,
      variants: p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        size: Number(v.size),
        color: v.color,
        colorHex: v.colorHex,
        stock: v.stock,
        imageUrls: v.imageUrls,
      })),
      seo: p.seo,
    };
  }
}
