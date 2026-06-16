import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AdminReturnsService } from './admin-returns.service';

const tx = {
  order: { update: jest.fn() },
  return: { update: jest.fn() },
};

const mockPrisma = {
  return: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((cb: (tx: typeof tx) => Promise<unknown>) => cb(tx)),
};

const baseReturn = {
  id: 'return-1',
  orderId: 'order-1',
  status: 'requested',
  reason: 'Wrong size',
  adminNotes: null,
  refundAmount: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  order: {
    user: { id: 'user-1', email: 'user@test.com', firstName: 'Test', lastName: 'User' },
  },
  items: [],
};

describe('AdminReturnsService', () => {
  let service: AdminReturnsService;

  beforeEach(async () => {
    Object.values(mockPrisma.return).forEach((fn) => (fn as jest.Mock).mockReset());
    Object.values(tx).forEach((obj) =>
      Object.values(obj).forEach((fn) => (fn as jest.Mock).mockReset()),
    );
    mockPrisma.$transaction.mockImplementation(
      (cb: (tx: typeof tx) => Promise<unknown>) => cb(tx),
    );

    const module = await Test.createTestingModule({
      providers: [
        AdminReturnsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AdminReturnsService);
  });

  describe('findAll', () => {
    it('returns paginated returns', async () => {
      mockPrisma.return.count.mockResolvedValue(1);
      mockPrisma.return.findMany.mockResolvedValue([baseReturn]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.meta.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });

    it('applies status filter', async () => {
      mockPrisma.return.count.mockResolvedValue(0);
      mockPrisma.return.findMany.mockResolvedValue([]);

      await service.findAll({ status: 'approved' });

      expect(mockPrisma.return.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'approved' } }),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when return does not exist', async () => {
      mockPrisma.return.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns the mapped return with user info', async () => {
      mockPrisma.return.findUnique.mockResolvedValue(baseReturn);
      const result = await service.findOne('return-1');
      expect(result.id).toBe('return-1');
      expect(result.refundAmount).toBeNull();
      expect(result.user.email).toBe('user@test.com');
    });
  });

  describe('update', () => {
    it('throws NotFoundException when return does not exist', async () => {
      mockPrisma.return.findUnique.mockResolvedValue(null);
      await expect(
        service.update('missing', { status: 'approved' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException on invalid status transition', async () => {
      mockPrisma.return.findUnique.mockResolvedValue({
        ...baseReturn,
        status: 'completed',
      });
      await expect(
        service.update('return-1', { status: 'requested' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('syncs order status to return_approved when approving', async () => {
      mockPrisma.return.findUnique.mockResolvedValue(baseReturn);
      tx.return.update.mockResolvedValue({ ...baseReturn, status: 'approved' });

      await service.update('return-1', { status: 'approved' });

      expect(tx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1' },
          data: { status: 'return_approved' },
        }),
      );
    });

    it('syncs order status to delivered when rejecting', async () => {
      mockPrisma.return.findUnique.mockResolvedValue(baseReturn);
      tx.return.update.mockResolvedValue({ ...baseReturn, status: 'rejected' });

      await service.update('return-1', { status: 'rejected' });

      expect(tx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1' },
          data: { status: 'delivered' },
        }),
      );
    });

    it('syncs order status to refunded and sets refundAmount', async () => {
      mockPrisma.return.findUnique.mockResolvedValue({
        ...baseReturn,
        status: 'completed',
      });
      tx.return.update.mockResolvedValue({
        ...baseReturn,
        status: 'refunded',
        refundAmount: 89.95,
      });

      const result = await service.update('return-1', {
        status: 'refunded',
        refundAmount: 89.95,
      });

      expect(tx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1' },
          data: { status: 'refunded' },
        }),
      );
      expect(result.refundAmount).toBe(89.95);
    });

    it('does not update order when transitioning to completed', async () => {
      mockPrisma.return.findUnique.mockResolvedValue({
        ...baseReturn,
        status: 'approved',
      });
      tx.return.update.mockResolvedValue({ ...baseReturn, status: 'completed' });

      await service.update('return-1', { status: 'completed' });

      expect(tx.order.update).not.toHaveBeenCalled();
    });
  });
});
