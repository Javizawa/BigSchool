import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ReviewsService } from './reviews.service';

const mockPrisma = {
  user: { findUnique: jest.fn() },
  product: { findFirst: jest.fn() },
  review: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  productVariant: { findMany: jest.fn() },
  orderItem: { findFirst: jest.fn() },
};

const supabaseUser = { id: 'supa-uid' } as never;
const dbUser = { id: 'db-user-1' };

const reviewWithUser = {
  id: 'rev-1',
  productId: 'prod-1',
  userId: dbUser.id,
  rating: 5,
  title: 'Great!',
  body: 'Excellent shoes.',
  verifiedPurchase: false,
  helpfulCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: { id: dbUser.id, firstName: 'Jane', lastName: 'Doe', avatarUrl: null },
};

describe('ReviewsService', () => {
  let service: ReviewsService;

  beforeEach(async () => {
    Object.values(mockPrisma).forEach((model) =>
      Object.values(model).forEach((fn) => fn.mockReset()),
    );
    const module = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ReviewsService);
  });

  describe('create', () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.product.findFirst.mockResolvedValue({ id: 'prod-1' });
      mockPrisma.review.findUnique.mockResolvedValue(null);
      mockPrisma.productVariant.findMany.mockResolvedValue([]);
      mockPrisma.review.create.mockResolvedValue(reviewWithUser);
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.create(supabaseUser, 'prod-1', { rating: 5, body: 'Good' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when product is inactive or missing', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);
      await expect(
        service.create(supabaseUser, 'prod-1', { rating: 5, body: 'Good' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when user already reviewed the product', async () => {
      mockPrisma.review.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.create(supabaseUser, 'prod-1', { rating: 5, body: 'Good' }),
      ).rejects.toThrow(ConflictException);
    });

    it('sets verifiedPurchase=true when user has a matching order item', async () => {
      mockPrisma.productVariant.findMany.mockResolvedValue([{ sku: 'SKU-1' }]);
      mockPrisma.orderItem.findFirst.mockResolvedValue({ id: 'oi-1' });
      mockPrisma.review.create.mockResolvedValue({
        ...reviewWithUser,
        verifiedPurchase: true,
      });

      const result = await service.create(supabaseUser, 'prod-1', {
        rating: 5,
        body: 'Good',
      });

      expect(result.verifiedPurchase).toBe(true);
      expect(mockPrisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ verifiedPurchase: true }),
        }),
      );
    });

    it('sets verifiedPurchase=false when user has no matching order', async () => {
      mockPrisma.productVariant.findMany.mockResolvedValue([{ sku: 'SKU-1' }]);
      mockPrisma.orderItem.findFirst.mockResolvedValue(null);

      await service.create(supabaseUser, 'prod-1', { rating: 5, body: 'Good' });

      expect(mockPrisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ verifiedPurchase: false }),
        }),
      );
    });

    it('returns the mapped review on success', async () => {
      const result = await service.create(supabaseUser, 'prod-1', {
        rating: 5,
        body: 'Good',
      });
      expect(result.id).toBe('rev-1');
      expect(result.author.firstName).toBe('Jane');
    });
  });

  describe('update', () => {
    it('throws NotFoundException when review does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.review.findUnique.mockResolvedValue(null);
      await expect(
        service.update(supabaseUser, 'rev-missing', { rating: 4 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when review belongs to another user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.review.findUnique.mockResolvedValue({
        id: 'rev-1',
        userId: 'other-user',
      });
      await expect(
        service.update(supabaseUser, 'rev-1', { rating: 4 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('updates and returns the review when ownership is confirmed', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.review.findUnique.mockResolvedValue({
        id: 'rev-1',
        userId: dbUser.id,
      });
      mockPrisma.review.update.mockResolvedValue({
        ...reviewWithUser,
        rating: 4,
      });

      const result = await service.update(supabaseUser, 'rev-1', { rating: 4 });

      expect(result.rating).toBe(4);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when review does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.review.findUnique.mockResolvedValue(null);
      await expect(service.remove(supabaseUser, 'rev-missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when review belongs to another user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.review.findUnique.mockResolvedValue({
        id: 'rev-1',
        userId: 'other-user',
      });
      await expect(service.remove(supabaseUser, 'rev-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deletes the review when ownership is confirmed', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.review.findUnique.mockResolvedValue({
        id: 'rev-1',
        userId: dbUser.id,
      });

      await service.remove(supabaseUser, 'rev-1');

      expect(mockPrisma.review.delete).toHaveBeenCalledWith({
        where: { id: 'rev-1' },
      });
    });
  });
});
