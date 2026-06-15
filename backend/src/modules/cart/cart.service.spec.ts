import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CartService } from './cart.service';

const CART_ID = 'cart-1';
const USER_ID = 'user-db-1';
const VARIANT_ID = 'variant-1';

const mockPrisma = {
  user: { findUnique: jest.fn() },
  cart: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
  },
  cartItem: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  productVariant: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
};

const supabaseUser = { id: 'supa-uid' } as never;
const dbUser = { id: USER_ID };
const emptyCart = {
  id: CART_ID,
  userId: USER_ID,
  couponId: null,
  coupon: null,
  items: [],
};

describe('CartService', () => {
  let service: CartService;

  beforeEach(async () => {
    Object.values(mockPrisma).forEach((model) =>
      Object.values(model).forEach((fn) => fn.mockReset()),
    );
    const module = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(CartService);
  });

  describe('addItem', () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.cart.upsert.mockResolvedValue(emptyCart);
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);
      mockPrisma.cart.findUniqueOrThrow.mockResolvedValue(emptyCart);
    });

    it('throws NotFoundException when the user does not exist in the DB', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.addItem(supabaseUser, { variantId: VARIANT_ID, quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the variant does not exist', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue(null);
      await expect(
        service.addItem(supabaseUser, { variantId: VARIANT_ID, quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when requested quantity exceeds available stock', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: VARIANT_ID,
        stock: 2,
        product: { price: 100, salePrice: null, saleEndsAt: null },
      });

      await expect(
        service.addItem(supabaseUser, { variantId: VARIANT_ID, quantity: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a new cart item when the variant is not already in the cart', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: VARIANT_ID,
        stock: 10,
        product: { price: 100, salePrice: null, saleEndsAt: null },
      });

      await service.addItem(supabaseUser, {
        variantId: VARIANT_ID,
        quantity: 2,
      });

      expect(mockPrisma.cartItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ variantId: VARIANT_ID, quantity: 2 }),
        }),
      );
    });

    it('updates quantity when the variant is already in the cart', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: VARIANT_ID,
        stock: 10,
        product: { price: 100, salePrice: null, saleEndsAt: null },
      });
      mockPrisma.cartItem.findUnique.mockResolvedValue({
        id: 'item-1',
        quantity: 3,
      });

      await service.addItem(supabaseUser, {
        variantId: VARIANT_ID,
        quantity: 2,
      });

      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'item-1' },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ quantity: 5 }),
        }),
      );
    });

    it('applies sale price when a valid sale is active', async () => {
      const future = new Date(Date.now() + 86_400_000);
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: VARIANT_ID,
        stock: 10,
        product: { price: 100, salePrice: 80, saleEndsAt: future },
      });

      await service.addItem(supabaseUser, {
        variantId: VARIANT_ID,
        quantity: 1,
      });

      expect(mockPrisma.cartItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ unitPrice: 80 }),
        }),
      );
    });

    it('throws BadRequestException when combined quantity would exceed stock', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: VARIANT_ID,
        stock: 4,
        product: { price: 100, salePrice: null, saleEndsAt: null },
      });
      mockPrisma.cartItem.findUnique.mockResolvedValue({
        id: 'item-1',
        quantity: 3,
      });

      await expect(
        service.addItem(supabaseUser, { variantId: VARIANT_ID, quantity: 2 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCart', () => {
    it('throws NotFoundException when user is not in the DB', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getCart(supabaseUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('upserts a cart when the user has none and returns it', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.cart.upsert.mockResolvedValue(emptyCart);

      const result = await service.getCart(supabaseUser);

      expect(mockPrisma.cart.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: USER_ID } }),
      );
      expect(result.items).toHaveLength(0);
    });
  });
});
