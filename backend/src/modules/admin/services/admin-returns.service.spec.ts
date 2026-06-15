import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AdminReturnsService } from './admin-returns.service';

const mockPrisma = {
  return: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const baseReturn = {
  id: 'return-1',
  orderId: 'order-1',
  status: 'requested',
  reason: 'Wrong size',
  adminNotes: null,
  refundAmount: null,
  items: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AdminReturnsService', () => {
  let service: AdminReturnsService;

  beforeEach(async () => {
    Object.values(mockPrisma.return).forEach((fn) => fn.mockReset());

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
      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the mapped return', async () => {
      mockPrisma.return.findUnique.mockResolvedValue(baseReturn);
      const result = await service.findOne('return-1');
      expect(result.id).toBe('return-1');
      expect(result.refundAmount).toBeNull();
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

    it('updates return status from requested to approved', async () => {
      mockPrisma.return.findUnique.mockResolvedValue(baseReturn);
      mockPrisma.return.update.mockResolvedValue({
        ...baseReturn,
        status: 'approved',
        items: [],
      });

      const result = await service.update('return-1', {
        status: 'approved',
      });

      expect(mockPrisma.return.update).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ status: 'approved' }),
        }),
      );
      expect(result.status).toBe('approved');
    });

    it('sets refundAmount when provided', async () => {
      mockPrisma.return.findUnique.mockResolvedValue(baseReturn);
      mockPrisma.return.update.mockResolvedValue({
        ...baseReturn,
        status: 'approved',
        refundAmount: 49.99,
        items: [],
      });

      const result = await service.update('return-1', {
        status: 'approved',
        refundAmount: 49.99,
      });

      expect(result.refundAmount).toBe(49.99);
    });
  });
});
