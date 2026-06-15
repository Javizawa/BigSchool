import { Injectable } from '@nestjs/common';
import { OrderStatus, ReturnStatus } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AnalyticsPeriod } from '../dto/analytics-query.dto';

const REVENUE_STATUSES: OrderStatus[] = [
  OrderStatus.confirmed,
  OrderStatus.processing,
  OrderStatus.shipped,
  OrderStatus.delivered,
  OrderStatus.return_approved,
];

function getPeriodRange(period: AnalyticsPeriod): { from: Date; to: Date } {
  const to = new Date();
  let from: Date;
  switch (period) {
    case AnalyticsPeriod.TODAY:
      from = new Date(to);
      from.setHours(0, 0, 0, 0);
      break;
    case AnalyticsPeriod.WEEK:
      from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case AnalyticsPeriod.YEAR:
      from = new Date(to.getFullYear(), 0, 1);
      break;
    default:
      from = new Date(to.getFullYear(), to.getMonth(), 1);
  }
  return { from, to };
}

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(period: AnalyticsPeriod = AnalyticsPeriod.MONTH) {
    const { from, to } = getPeriodRange(period);
    const periodFilter = { gte: from, lte: to };

    const [
      revenueAgg,
      orderCount,
      newUsers,
      pendingOrders,
      pendingReturns,
      lowStockVariants,
      topProductsRaw,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: REVENUE_STATUSES }, createdAt: periodFilter },
      }),
      this.prisma.order.count({
        where: { status: { in: REVENUE_STATUSES }, createdAt: periodFilter },
      }),
      this.prisma.user.count({ where: { createdAt: periodFilter } }),
      this.prisma.order.count({
        where: { status: OrderStatus.pending_payment },
      }),
      this.prisma.return.count({ where: { status: ReturnStatus.requested } }),
      this.prisma.productVariant.count({ where: { stock: { lte: 5 } } }),
      this.prisma.orderItem.groupBy({
        by: ['productSlug'],
        _sum: { quantity: true },
        where: {
          order: {
            status: { in: REVENUE_STATUSES },
            createdAt: periodFilter,
          },
        },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    const revenue = Number(revenueAgg._sum.total ?? 0);
    const averageOrderValue = orderCount > 0 ? revenue / orderCount : 0;

    const topProductSlugs = topProductsRaw.map((r) => r.productSlug);
    const topProductDetails = await this.prisma.product.findMany({
      where: { slug: { in: topProductSlugs } },
      select: { id: true, name: true, slug: true, thumbnailUrl: true },
    });
    const productBySlug = new Map(topProductDetails.map((p) => [p.slug, p]));

    const topProducts = topProductsRaw
      .map((r) => {
        const product = productBySlug.get(r.productSlug);
        if (!product) return null;
        const unitsSold = r._sum.quantity ?? 0;
        return {
          productId: product.id,
          name: product.name,
          thumbnailUrl: product.thumbnailUrl,
          unitsSold,
          revenue: 0,
        };
      })
      .filter(Boolean);

    return {
      period,
      revenue: Math.round(revenue * 100) / 100,
      orderCount,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      newUsers,
      pendingOrders,
      pendingReturns,
      lowStockVariants,
      topProducts,
    };
  }
}
