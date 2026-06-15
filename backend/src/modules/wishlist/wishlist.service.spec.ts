import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WishlistService } from './wishlist.service';

const mockPrisma = {
  user: { findUnique: jest.fn() },
  product: { findUnique: jest.fn() },
  wishlistItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

const supabaseUser = { id: 'supa-uid' } as never;
const dbUser = { id: 'db-user-1' };

const wishlistItem = {
  id: 'wi-1',
  addedAt: new Date(),
  product: {
    id: 'prod-1',
    name: 'Air Max',
    slug: 'air-max',
    thumbnailUrl: null,
    price: 120,
    salePrice: null,
    saleEndsAt: null,
    gender: 'MEN',
    brand: { id: 'b1', name: 'Nike', slug: 'nike', logoUrl: null },
    category: { id: 'c1', name: 'Running', slug: 'running', imageUrl: null },
  },
};

describe('WishlistService', () => {
  let service: WishlistService;

  beforeEach(async () => {
    Object.values(mockPrisma).forEach((model) =>
      Object.values(model).forEach((fn) => fn.mockReset()),
    );
    const module = await Test.createTestingModule({
      providers: [
        WishlistService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(WishlistService);
  });

  describe('findAll', () => {
    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findAll(supabaseUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns mapped wishlist items for the user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.wishlistItem.findMany.mockResolvedValue([wishlistItem]);

      const result = await service.findAll(supabaseUser);

      expect(result).toHaveLength(1);
      expect(result[0].product.price).toBe(120);
    });
  });

  describe('add', () => {
    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.add(supabaseUser, { productId: 'p1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when product does not exist or is inactive', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(
        service.add(supabaseUser, { productId: 'p1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when product is already in wishlist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.wishlistItem.findUnique.mockResolvedValue({ id: 'wi-1' });
      await expect(
        service.add(supabaseUser, { productId: 'p1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates and returns the wishlist item when valid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'p1' });
      mockPrisma.wishlistItem.findUnique.mockResolvedValue(null);
      mockPrisma.wishlistItem.create.mockResolvedValue(wishlistItem);

      const result = await service.add(supabaseUser, { productId: 'p1' });

      expect(result.id).toBe('wi-1');
      expect(mockPrisma.wishlistItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { userId: dbUser.id, productId: 'p1' },
        }),
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.remove(supabaseUser, 'p1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when product is not in the wishlist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.wishlistItem.findUnique.mockResolvedValue(null);
      await expect(service.remove(supabaseUser, 'p1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes the item when it exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.wishlistItem.findUnique.mockResolvedValue({ id: 'wi-1' });

      await service.remove(supabaseUser, 'p1');

      expect(mockPrisma.wishlistItem.delete).toHaveBeenCalledWith({
        where: { id: 'wi-1' },
      });
    });
  });
});
