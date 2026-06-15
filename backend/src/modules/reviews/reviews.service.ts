import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

const REVIEW_INCLUDE = {
  user: {
    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
  },
} satisfies Prisma.ReviewInclude;

type ReviewWithUser = Prisma.ReviewGetPayload<{
  include: typeof REVIEW_INCLUDE;
}>;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    supabaseUser: SupabaseUser,
    productId: string,
    dto: CreateReviewDto,
  ) {
    const user = await this.resolveUser(supabaseUser.id);

    const product = await this.prisma.product.findUnique({
      where: { id: productId, isActive: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.prisma.review.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });
    if (existing)
      throw new ConflictException('You have already reviewed this product');

    const variantSkus = await this.prisma.productVariant.findMany({
      where: { productId },
      select: { sku: true },
    });
    const skus = variantSkus.map((v) => v.sku);

    const verifiedPurchase =
      skus.length > 0
        ? !!(await this.prisma.orderItem.findFirst({
            where: {
              variantSku: { in: skus },
              order: {
                userId: user.id,
                status: {
                  notIn: ['cancelled', 'pending_payment', 'payment_failed'],
                },
              },
            },
          }))
        : false;

    const review = await this.prisma.review.create({
      data: {
        productId,
        userId: user.id,
        rating: dto.rating,
        title: dto.title ?? null,
        body: dto.body,
        verifiedPurchase,
      },
      include: REVIEW_INCLUDE,
    });

    return this.mapReview(review);
  }

  async update(
    supabaseUser: SupabaseUser,
    reviewId: string,
    dto: UpdateReviewDto,
  ) {
    const user = await this.resolveUser(supabaseUser.id);

    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== user.id)
      throw new ForbiddenException('Not your review');

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.body !== undefined && { body: dto.body }),
      },
      include: REVIEW_INCLUDE,
    });

    return this.mapReview(updated);
  }

  async remove(supabaseUser: SupabaseUser, reviewId: string) {
    const user = await this.resolveUser(supabaseUser.id);

    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== user.id)
      throw new ForbiddenException('Not your review');

    await this.prisma.review.delete({ where: { id: reviewId } });
  }

  private mapReview(review: ReviewWithUser) {
    return {
      id: review.id,
      productId: review.productId,
      rating: review.rating,
      title: review.title,
      body: review.body,
      verifiedPurchase: review.verifiedPurchase,
      helpfulCount: review.helpfulCount,
      author: {
        id: review.user.id,
        firstName: review.user.firstName,
        lastName: review.user.lastName,
        avatarUrl: review.user.avatarUrl,
      },
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  private async resolveUser(supabaseId: string) {
    const user = await this.prisma.user.findUnique({ where: { supabaseId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
