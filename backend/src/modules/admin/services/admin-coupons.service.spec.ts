import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AdminCouponsService } from './admin-coupons.service';

const mockPrisma = {
  coupon: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const baseCoupon = {
  id: 'coupon-1',
  code: 'SAVE10',
  type: 'PERCENTAGE',
  value: 10,
  minOrderAmount: null,
  maxUses: null,
  usedCount: 0,
  validFrom: new Date('2024-01-01'),
  validUntil: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AdminCouponsService', () => {
  let service: AdminCouponsService;

  beforeEach(async () => {
    Object.values(mockPrisma.coupon).forEach((fn) => fn.mockReset());

    const module = await Test.createTestingModule({
      providers: [
        AdminCouponsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AdminCouponsService);
  });

  describe('findAll', () => {
    it('returns all coupons when no filter is provided', async () => {
      mockPrisma.coupon.findMany.mockResolvedValue([baseCoupon]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('SAVE10');
    });

    it('passes isActive filter to Prisma', async () => {
      mockPrisma.coupon.findMany.mockResolvedValue([]);
      await service.findAll(false);
      expect(mockPrisma.coupon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: false } }),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when coupon does not exist', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the mapped coupon', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(baseCoupon);
      const result = await service.findOne('coupon-1');
      expect(result.id).toBe('coupon-1');
      expect(result.value).toBe(10);
    });
  });

  describe('create', () => {
    it('throws ConflictException when code already exists', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(baseCoupon);
      await expect(
        service.create({
          code: 'save10',
          type: 'PERCENTAGE' as never,
          value: 10,
          validFrom: '2024-01-01',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('normalises code to uppercase and creates coupon', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);
      mockPrisma.coupon.create.mockResolvedValue({
        ...baseCoupon,
        code: 'NEW20',
      });

      await service.create({
        code: 'new20',
        type: 'PERCENTAGE' as never,
        value: 20,
        validFrom: '2024-01-01',
      });

      expect(mockPrisma.coupon.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ code: 'NEW20' }),
        }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when coupon does not exist', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);
      await expect(
        service.update('missing', { isActive: false }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates allowed fields', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(baseCoupon);
      mockPrisma.coupon.update.mockResolvedValue({
        ...baseCoupon,
        isActive: false,
      });

      const result = await service.update('coupon-1', { isActive: false });

      expect(mockPrisma.coupon.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'coupon-1' } }),
      );
      expect(result.isActive).toBe(false);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when coupon does not exist', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes the coupon', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(baseCoupon);
      mockPrisma.coupon.delete.mockResolvedValue(baseCoupon);

      await service.remove('coupon-1');

      expect(mockPrisma.coupon.delete).toHaveBeenCalledWith({
        where: { id: 'coupon-1' },
      });
    });
  });
});
