import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ProductsService } from './products.service';
import { ProductSortBy } from './dto/list-products.dto';

const mockPrisma = {
  product: { findMany: jest.fn(), findUnique: jest.fn(), count: jest.fn() },
  review: { groupBy: jest.fn() },
  user: { findUnique: jest.fn() },
  productVariant: { findUnique: jest.fn() },
  stockNotification: { upsert: jest.fn() },
};

const baseProduct = {
  id: 'prod-1',
  name: 'Air Max 90',
  slug: 'air-max-90',
  gender: 'MEN',
  price: 120,
  salePrice: null,
  saleEndsAt: null,
  thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
  isActive: true,
  createdAt: new Date(),
  brand: { id: 'b1', name: 'Nike', slug: 'nike', logoUrl: null },
  category: { id: 'c1', name: 'Running', slug: 'running', imageUrl: null },
};

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    Object.values(mockPrisma).forEach((model) =>
      Object.values(model).forEach((fn) => fn.mockReset()),
    );
    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ProductsService);
  });

  describe('findAll', () => {
    it('returns paginated products with review stats', async () => {
      mockPrisma.product.findMany.mockResolvedValue([baseProduct]);
      mockPrisma.product.count.mockResolvedValue(1);
      mockPrisma.review.groupBy.mockResolvedValue([
        { productId: 'prod-1', _avg: { rating: 4.5 }, _count: { id: 10 } },
      ]);

      const result = await service.findAll({
        page: 1,
        limit: 20,
        sortBy: ProductSortBy.NEWEST,
      });

      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(result.data[0].averageRating).toBe(4.5);
      expect(result.data[0].reviewCount).toBe(10);
    });

    it('returns averageRating null when product has no reviews', async () => {
      mockPrisma.product.findMany.mockResolvedValue([baseProduct]);
      mockPrisma.product.count.mockResolvedValue(1);
      mockPrisma.review.groupBy.mockResolvedValue([]);

      const result = await service.findAll({
        page: 1,
        limit: 20,
        sortBy: ProductSortBy.NEWEST,
      });

      expect(result.data[0].averageRating).toBeNull();
      expect(result.data[0].reviewCount).toBe(0);
    });

    it('returns empty page when no products match', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);
      mockPrisma.review.groupBy.mockResolvedValue([]);

      const result = await service.findAll({
        page: 1,
        limit: 20,
        sortBy: ProductSortBy.NEWEST,
      });

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('findOne', () => {
    const detailProduct = { ...baseProduct, variants: [], seo: null };

    it('throws NotFoundException when product does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when product is inactive', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        ...detailProduct,
        isActive: false,
      });
      await expect(service.findOne('prod-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns product detail for an active product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(detailProduct);
      mockPrisma.review.groupBy.mockResolvedValue([]);

      const result = await service.findOne('prod-1');

      expect(result.id).toBe('prod-1');
      expect(result.name).toBe('Air Max 90');
    });
  });

  describe('subscribeStockNotification', () => {
    const supabaseUser = { id: 'supabase-uid' } as never;
    const dbUser = { id: 'db-user-id' };

    it('throws UnauthorizedException when supabase user is not in the database', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.subscribeStockNotification(supabaseUser, 'p1', 'v1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws NotFoundException when variant does not belong to the product', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'v1',
        productId: 'other-product',
      });

      await expect(
        service.subscribeStockNotification(supabaseUser, 'p1', 'v1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('upserts a stock notification and returns it', async () => {
      const notification = {
        id: 'notif-1',
        userId: dbUser.id,
        variantId: 'v1',
        productId: 'p1',
      };
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'v1',
        productId: 'p1',
      });
      mockPrisma.stockNotification.upsert.mockResolvedValue(notification);

      const result = await service.subscribeStockNotification(
        supabaseUser,
        'p1',
        'v1',
      );

      expect(result).toEqual(notification);
      expect(mockPrisma.stockNotification.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_variantId: { userId: dbUser.id, variantId: 'v1' } },
        }),
      );
    });
  });
});
