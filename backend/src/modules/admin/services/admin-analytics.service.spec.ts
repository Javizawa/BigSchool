import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AnalyticsPeriod } from '../dto/analytics-query.dto';

const mockPrisma = {
  order: {
    aggregate: jest.fn(),
    count: jest.fn(),
  },
  user: {
    count: jest.fn(),
  },
  return: {
    count: jest.fn(),
  },
  productVariant: {
    count: jest.fn(),
  },
  orderItem: {
    groupBy: jest.fn(),
  },
  product: {
    findMany: jest.fn(),
  },
};

function setupDefaultMocks() {
  mockPrisma.order.aggregate.mockResolvedValue({ _sum: { total: 1500 } });
  mockPrisma.order.count.mockResolvedValueOnce(12).mockResolvedValueOnce(3);
  mockPrisma.user.count.mockResolvedValue(5);
  mockPrisma.return.count.mockResolvedValue(2);
  mockPrisma.productVariant.count.mockResolvedValue(4);
  mockPrisma.orderItem.groupBy.mockResolvedValue([
    { productSlug: 'air-max-90', _sum: { quantity: 10 } },
  ]);
  mockPrisma.product.findMany.mockResolvedValue([
    { id: 'p-1', name: 'Air Max 90', slug: 'air-max-90', thumbnailUrl: null },
  ]);
}

describe('AdminAnalyticsService', () => {
  let service: AdminAnalyticsService;

  beforeEach(async () => {
    [
      mockPrisma.order,
      mockPrisma.user,
      mockPrisma.return,
      mockPrisma.productVariant,
      mockPrisma.orderItem,
      mockPrisma.product,
    ].forEach((obj) => Object.values(obj).forEach((fn) => fn.mockReset()));

    const module = await Test.createTestingModule({
      providers: [
        AdminAnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AdminAnalyticsService);
  });

  describe('getSummary', () => {
    it('returns summary for the default MONTH period', async () => {
      setupDefaultMocks();
      const result = await service.getSummary();

      expect(result.period).toBe(AnalyticsPeriod.MONTH);
      expect(result.revenue).toBe(1500);
      expect(result.orderCount).toBe(12);
      expect(result.averageOrderValue).toBe(125);
      expect(result.newUsers).toBe(5);
      expect(result.pendingOrders).toBe(3);
      expect(result.pendingReturns).toBe(2);
      expect(result.lowStockVariants).toBe(4);
    });

    it('includes top products mapped from groupBy results', async () => {
      setupDefaultMocks();
      const result = await service.getSummary();

      expect(result.topProducts).toHaveLength(1);
      expect(result.topProducts[0]).toMatchObject({
        productId: 'p-1',
        name: 'Air Max 90',
        unitsSold: 10,
      });
    });

    it('returns averageOrderValue 0 when there are no orders', async () => {
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { total: null } });
      mockPrisma.order.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.return.count.mockResolvedValue(0);
      mockPrisma.productVariant.count.mockResolvedValue(0);
      mockPrisma.orderItem.groupBy.mockResolvedValue([]);
      mockPrisma.product.findMany.mockResolvedValue([]);

      const result = await service.getSummary(AnalyticsPeriod.TODAY);

      expect(result.revenue).toBe(0);
      expect(result.averageOrderValue).toBe(0);
      expect(result.topProducts).toHaveLength(0);
    });

    it('filters product entries with no matching product details', async () => {
      setupDefaultMocks();
      mockPrisma.orderItem.groupBy.mockResolvedValue([
        { productSlug: 'air-max-90', _sum: { quantity: 10 } },
        { productSlug: 'unknown-slug', _sum: { quantity: 3 } },
      ]);

      const result = await service.getSummary(AnalyticsPeriod.WEEK);

      expect(result.topProducts).toHaveLength(1);
    });
  });
});
