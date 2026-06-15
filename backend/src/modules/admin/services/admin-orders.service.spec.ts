import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AdminOrdersService } from './admin-orders.service';

const tx = {
  order: { update: jest.fn() },
  orderTracking: { upsert: jest.fn() },
};

const mockPrisma = {
  order: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
  $transaction: jest.fn((cb: (tx: typeof tx) => Promise<unknown>) => cb(tx)),
};

function makeOrder(overrides = {}) {
  return {
    id: 'order-1',
    status: 'confirmed',
    user: { id: 'u-1', email: 'a@b.com', firstName: 'A', lastName: 'B' },
    shippingAddressSnapshot: {},
    subtotal: 100,
    discount: 0,
    shippingCost: 5,
    total: 105,
    couponCode: null,
    stripePaymentIntentId: null,
    adminNotes: null,
    items: [],
    tracking: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('AdminOrdersService', () => {
  let service: AdminOrdersService;

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
        AdminOrdersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AdminOrdersService);
  });

  describe('findAll', () => {
    it('returns paginated orders', async () => {
      mockPrisma.order.count.mockResolvedValue(2);
      mockPrisma.order.findMany.mockResolvedValue([
        makeOrder(),
        makeOrder({ id: 'order-2' }),
      ]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.meta.total).toBe(2);
      expect(result.data).toHaveLength(2);
    });

    it('applies status and date filters', async () => {
      mockPrisma.order.count.mockResolvedValue(0);
      mockPrisma.order.findMany.mockResolvedValue([]);

      await service.findAll({
        status: 'shipped',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({
            status: 'shipped',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            createdAt: expect.objectContaining({ gte: expect.any(Date) }),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when order does not exist', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the mapped order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder());
      const result = await service.findOne('order-1');
      expect(result.id).toBe('order-1');
      expect(result.total).toBe(105);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when order does not exist', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);
      await expect(
        service.update('missing', { status: 'cancelled' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException on invalid status transition', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        makeOrder({ status: 'delivered' }),
      );
      await expect(
        service.update('order-1', { status: 'confirmed' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('transitions order status via transaction', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder());
      tx.order.update.mockResolvedValue({});
      mockPrisma.order.findUniqueOrThrow.mockResolvedValue(
        makeOrder({ status: 'processing' }),
      );

      const result = await service.update('order-1', {
        status: 'processing',
      });

      expect(tx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ status: 'processing' }),
        }),
      );
      expect(result.status).toBe('processing');
    });

    it('upserts tracking info when provided', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder());
      tx.order.update.mockResolvedValue({});
      mockPrisma.order.findUniqueOrThrow.mockResolvedValue(makeOrder());

      await service.update('order-1', {
        tracking: {
          carrier: 'DHL',
          trackingNumber: 'TRACK123',
          trackingUrl: 'https://track.dhl.com/TRACK123',
        },
      });

      expect(tx.orderTracking.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orderId: 'order-1' },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          create: expect.objectContaining({
            carrier: 'DHL',
            trackingNumber: 'TRACK123',
          }),
        }),
      );
    });
  });
});
