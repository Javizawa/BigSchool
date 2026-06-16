import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OrdersService } from './orders.service';

const tx = {
  order: { update: jest.fn() },
  coupon: { update: jest.fn() },
  cartItem: { deleteMany: jest.fn() },
  orderItem: { createMany: jest.fn() },
  productVariant: { update: jest.fn() },
  cart: { update: jest.fn() },
};

const mockPrisma = {
  user: { findUnique: jest.fn() },
  order: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  cart: { findUnique: jest.fn() },
  address: { findUnique: jest.fn() },
  coupon: { findUnique: jest.fn(), update: jest.fn() },
  $transaction: jest.fn((cb: (tx: typeof tx) => Promise<unknown>) => cb(tx)),
};

const supabaseUser = { id: 'supa-uid' } as never;
const dbUser = { id: 'db-user-1' };

const confirmedOrder = {
  id: 'order-1',
  userId: dbUser.id,
  status: 'confirmed',
  couponId: null,
  shippingAddressSnapshot: {},
  subtotal: 120,
  discount: 0,
  shippingCost: 5,
  total: 125,
  couponCode: null,
  stripePaymentIntentId: null,
  items: [],
  tracking: null,
  return: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  coupon: null,
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    [mockPrisma, tx].forEach((obj) =>
      Object.values(obj).forEach((v) => {
        if (typeof v === 'function') (v as jest.Mock).mockReset();
        else
          Object.values(v as Record<string, jest.Mock>).forEach((fn) =>
            fn.mockReset(),
          );
      }),
    );
    mockPrisma.$transaction.mockImplementation(
      (cb: (tx: typeof tx) => Promise<unknown>) => cb(tx),
    );

    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(OrdersService);
  });

  describe('findAll', () => {
    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findAll(supabaseUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns paginated orders for the user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.order.count.mockResolvedValue(1);
      mockPrisma.order.findMany.mockResolvedValue([confirmedOrder]);

      const result = await service.findAll(supabaseUser);

      expect(result.meta.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when order does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.order.findUnique.mockResolvedValue(null);
      await expect(service.findOne(supabaseUser, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when order belongs to another user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.order.findUnique.mockResolvedValue({
        ...confirmedOrder,
        userId: 'other',
      });
      await expect(service.findOne(supabaseUser, 'order-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the mapped order for the correct user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.order.findUnique.mockResolvedValue(confirmedOrder);

      const result = await service.findOne(supabaseUser, 'order-1');

      expect(result.id).toBe('order-1');
      expect(result.status).toBe('confirmed');
      expect(result.return).toBeNull();
    });

    it('includes return data when the order has a return', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.order.findUnique.mockResolvedValue({
        ...confirmedOrder,
        status: 'refunded',
        return: {
          id: 'ret-1',
          orderId: 'order-1',
          status: 'refunded',
          reason: 'Wrong size',
          adminNotes: 'Approved',
          refundAmount: 89.95,
          createdAt: new Date(),
          items: [
            {
              id: 'ri-1',
              quantity: 1,
              orderItem: {
                id: 'oi-1',
                productName: 'Air Max 90',
                variantSku: 'SKU-1',
                size: 42,
                color: 'Black',
                thumbnailUrl: null,
                unitPrice: 89.95,
              },
            },
          ],
        },
      });

      const result = await service.findOne(supabaseUser, 'order-1');

      expect(result.return).not.toBeNull();
      expect(result.return!.refundAmount).toBe(89.95);
      expect(result.return!.items).toHaveLength(1);
      expect(result.return!.items[0].orderItem.productName).toBe('Air Max 90');
    });
  });

  describe('cancel', () => {
    it('throws NotFoundException when order does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.order.findUnique.mockResolvedValue(null);
      await expect(service.cancel(supabaseUser, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when order belongs to another user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'other',
        status: 'confirmed',
        couponId: null,
      });
      await expect(service.cancel(supabaseUser, 'order-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when order is already shipped', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: dbUser.id,
        status: 'shipped',
        couponId: null,
      });
      await expect(service.cancel(supabaseUser, 'order-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('cancels a confirmed order via transaction', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: dbUser.id,
        status: 'confirmed',
        couponId: null,
      });
      tx.order.update.mockResolvedValue({
        ...confirmedOrder,
        status: 'cancelled',
      });

      const result = await service.cancel(supabaseUser, 'order-1');

      expect(tx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'cancelled' } }),
      );
      expect(result.status).toBe('cancelled');
    });

    it('decrements coupon usedCount when order has a coupon', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: dbUser.id,
        status: 'pending_payment',
        couponId: 'coupon-1',
      });
      tx.order.update.mockResolvedValue({
        ...confirmedOrder,
        status: 'cancelled',
        couponId: 'coupon-1',
        coupon: { id: 'coupon-1', code: 'SAVE10' },
      });

      await service.cancel(supabaseUser, 'order-1');

      expect(tx.coupon.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'coupon-1' },
          data: { usedCount: { decrement: 1 } },
        }),
      );
    });

    it('does not touch coupon when order has no coupon', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: dbUser.id,
        status: 'confirmed',
        couponId: null,
      });
      tx.order.update.mockResolvedValue({
        ...confirmedOrder,
        status: 'cancelled',
      });

      await service.cancel(supabaseUser, 'order-1');

      expect(tx.coupon.update).not.toHaveBeenCalled();
    });
  });
});
