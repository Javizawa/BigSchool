import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { CreateVariantDto } from '../dto/create-product.dto';
import { ListAdminProductsDto } from '../dto/list-products.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { UpdateVariantDto } from '../dto/update-variant.dto';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const VARIANT_SELECT = {
  id: true,
  sku: true,
  size: true,
  color: true,
  colorHex: true,
  stock: true,
  imageUrls: true,
} satisfies Prisma.ProductVariantSelect;

const PRODUCT_INCLUDE = {
  brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
  category: {
    select: { id: true, name: true, slug: true, imageUrl: true },
  },
  variants: { select: VARIANT_SELECT },
  seo: {
    select: {
      metaTitle: true,
      metaDescription: true,
      canonicalUrl: true,
    },
  },
} satisfies Prisma.ProductInclude;

type ProductWithDetails = Prisma.ProductGetPayload<{
  include: typeof PRODUCT_INCLUDE;
}>;

@Injectable()
export class AdminProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: ListAdminProductsDto) {
    const {
      page = 1,
      limit = 20,
      isActive,
      categoryId,
      brandId,
      search,
      lowStock,
    } = dto;

    const where: Prisma.ProductWhereInput = {
      ...(isActive !== undefined && { isActive }),
      ...(categoryId && { categoryId }),
      ...(brandId && { brandId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(lowStock && {
        variants: { some: { stock: { lte: 5 } } },
      }),
    };

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const slugs = products.map((p) => p.slug);
    const soldStats = await this.prisma.orderItem.groupBy({
      by: ['productSlug'],
      _sum: { quantity: true },
      where: { productSlug: { in: slugs } },
    });
    const soldMap = new Map(
      soldStats.map((s) => [s.productSlug, s._sum.quantity ?? 0]),
    );

    return {
      data: products.map((p) => this.mapProduct(p, soldMap.get(p.slug) ?? 0)),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async findOne(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: PRODUCT_INCLUDE,
    });
    if (!product) throw new NotFoundException('Product not found');

    const soldStats = await this.prisma.orderItem.aggregate({
      _sum: { quantity: true },
      where: { productSlug: product.slug },
    });

    return this.mapProduct(product, soldStats._sum.quantity ?? 0);
  }

  async create(dto: CreateProductDto) {
    const slug = slugify(dto.name);
    const existing = await this.prisma.product.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Product slug already exists');

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        brandId: dto.brandId,
        categoryId: dto.categoryId,
        gender: dto.gender,
        price: dto.price,
        salePrice: dto.salePrice ?? null,
        saleEndsAt: dto.saleEndsAt ? new Date(dto.saleEndsAt) : null,
        description: dto.description,
        thumbnailUrl: dto.thumbnailUrl ?? null,
        ...(dto.seo && {
          seo: {
            create: {
              metaTitle: dto.seo.metaTitle ?? null,
              metaDescription: dto.seo.metaDescription ?? null,
              canonicalUrl: dto.seo.canonicalUrl ?? null,
            },
          },
        }),
        ...(dto.variants?.length && {
          variants: {
            create: dto.variants.map((v) => ({
              sku: v.sku,
              size: v.size,
              color: v.color,
              colorHex: v.colorHex ?? null,
              stock: v.stock,
              imageUrls: v.imageUrls ?? [],
            })),
          },
        }),
      },
      include: PRODUCT_INCLUDE,
    });

    return this.mapProduct(product, 0);
  }

  async update(productId: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        ...(dto.name !== undefined && {
          name: dto.name,
          slug: slugify(dto.name),
        }),
        ...(dto.brandId !== undefined && { brandId: dto.brandId }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.salePrice !== undefined && { salePrice: dto.salePrice }),
        ...(dto.saleEndsAt !== undefined && {
          saleEndsAt: dto.saleEndsAt ? new Date(dto.saleEndsAt) : null,
        }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.thumbnailUrl !== undefined && {
          thumbnailUrl: dto.thumbnailUrl,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.seo && {
          seo: {
            upsert: {
              create: {
                metaTitle: dto.seo.metaTitle ?? null,
                metaDescription: dto.seo.metaDescription ?? null,
                canonicalUrl: dto.seo.canonicalUrl ?? null,
              },
              update: {
                ...(dto.seo.metaTitle !== undefined && {
                  metaTitle: dto.seo.metaTitle,
                }),
                ...(dto.seo.metaDescription !== undefined && {
                  metaDescription: dto.seo.metaDescription,
                }),
                ...(dto.seo.canonicalUrl !== undefined && {
                  canonicalUrl: dto.seo.canonicalUrl,
                }),
              },
            },
          },
        }),
      },
      include: PRODUCT_INCLUDE,
    });

    const soldStats = await this.prisma.orderItem.aggregate({
      _sum: { quantity: true },
      where: { productSlug: updated.slug },
    });

    return this.mapProduct(updated, soldStats._sum.quantity ?? 0);
  }

  async remove(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');
    await this.prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });
  }

  async createVariant(productId: string, dto: CreateVariantDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.prisma.productVariant.findUnique({
      where: { sku: dto.sku },
    });
    if (existing) throw new ConflictException('SKU already exists');

    return this.prisma.productVariant.create({
      data: {
        productId,
        sku: dto.sku,
        size: dto.size,
        color: dto.color,
        colorHex: dto.colorHex ?? null,
        stock: dto.stock,
        imageUrls: dto.imageUrls ?? [],
      },
      select: VARIANT_SELECT,
    });
  }

  async updateVariant(
    productId: string,
    variantId: string,
    dto: UpdateVariantDto,
  ) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant || variant.productId !== productId) {
      throw new NotFoundException('Variant not found');
    }

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(dto.stock !== undefined && { stock: dto.stock }),
        ...(dto.imageUrls !== undefined && { imageUrls: dto.imageUrls }),
        ...(dto.colorHex !== undefined && { colorHex: dto.colorHex }),
      },
      select: VARIANT_SELECT,
    });
  }

  async removeVariant(productId: string, variantId: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant || variant.productId !== productId) {
      throw new NotFoundException('Variant not found');
    }
    await this.prisma.productVariant.delete({ where: { id: variantId } });
  }

  private mapProduct(product: ProductWithDetails, totalSold: number) {
    const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      category: {
        ...product.category,
        productCount: undefined,
      },
      gender: product.gender,
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      saleEndsAt: product.saleEndsAt,
      thumbnailUrl: product.thumbnailUrl,
      description: product.description,
      isActive: product.isActive,
      variants: product.variants.map((v) => ({
        ...v,
        size: Number(v.size),
      })),
      seo: product.seo,
      totalStock,
      totalSold,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
