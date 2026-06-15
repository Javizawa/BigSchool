import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CouponsService } from './coupons.service';

const mockPrisma = { coupon: { findUnique: jest.fn() } };

const pastDate = new Date(Date.now() - 86_400_000);
const futureDate = new Date(Date.now() + 86_400_000);

const activeCoupon = (overrides: Record<string, unknown> = {}) => ({
  code: 'SAVE20',
  isActive: true,
  type: 'percentage',
  value: 20,
  validFrom: pastDate,
  validUntil: null,
  maxUses: null,
  usedCount: 0,
  minOrderAmount: null,
  ...overrides,
});

describe('CouponsService', () => {
  let service: CouponsService;

  beforeEach(async () => {
    mockPrisma.coupon.findUnique.mockReset();
    const module = await Test.createTestingModule({
      providers: [CouponsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(CouponsService);
  });

  describe('validate', () => {
    it('throws NotFoundException when coupon does not exist', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);
      await expect(service.validate({ code: 'INVALID', cartTotal: 100 })).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when coupon is inactive', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(activeCoupon({ isActive: false }));
      await expect(service.validate({ code: 'SAVE20', cartTotal: 100 })).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when coupon is not yet valid', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(activeCoupon({ validFrom: futureDate }));
      await expect(service.validate({ code: 'SAVE20', cartTotal: 100 })).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when coupon has expired', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(activeCoupon({ validUntil: pastDate }));
      await expect(service.validate({ code: 'SAVE20', cartTotal: 100 })).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when usage limit is reached', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(activeCoupon({ maxUses: 100, usedCount: 100 }));
      await expect(service.validate({ code: 'SAVE20', cartTotal: 100 })).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when cart total is below minimum order amount', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(activeCoupon({ minOrderAmount: 50 }));
      await expect(service.validate({ code: 'SAVE20', cartTotal: 30 })).rejects.toThrow(BadRequestException);
    });

    it('calculates percentage discount correctly', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(activeCoupon({ type: 'percentage', value: 20 }));

      const result = await service.validate({ code: 'SAVE20', cartTotal: 100 });

      expect(result.discount).toBe(20);
      expect(result.type).toBe('percentage');
    });

    it('calculates fixed discount correctly', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(activeCoupon({ type: 'fixed_amount', value: 15 }));

      const result = await service.validate({ code: 'SAVE20', cartTotal: 100 });

      expect(result.discount).toBe(15);
      expect(result.type).toBe('fixed_amount');
    });

    it('caps fixed discount at the cart total to avoid negative totals', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(activeCoupon({ type: 'fixed_amount', value: 200 }));

      const result = await service.validate({ code: 'SAVE20', cartTotal: 50 });

      expect(result.discount).toBe(50);
    });

    it('accepts coupon when usage count is below the limit', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(activeCoupon({ maxUses: 100, usedCount: 99 }));

      const result = await service.validate({ code: 'SAVE20', cartTotal: 100 });

      expect(result.code).toBe('SAVE20');
    });

    it('normalises the coupon code to uppercase before querying', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(activeCoupon());

      await service.validate({ code: 'save20', cartTotal: 100 });

      expect(mockPrisma.coupon.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { code: 'SAVE20' } }),
      );
    });
  });
});
