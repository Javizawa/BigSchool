import { Gender, OrderStatus, Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

export type ToolName =
  | 'search_products'
  | 'get_product_details'
  | 'recommend_products'
  | 'get_order_status'
  | 'get_sales_analytics';

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

const SEARCH_TOOL: ToolDefinition = {
  type: 'function',
  function: {
    name: 'search_products',
    description:
      'Busca zapatillas en el catálogo aplicando filtros. Usa esta herramienta cuando el usuario busque productos, mencione una marca, categoría, talla, precio o género.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Texto libre de búsqueda (nombre o descripción)' },
        brandName: { type: 'string', description: 'Nombre de la marca (Nike, Adidas, etc.)' },
        categoryName: { type: 'string', description: 'Categoría (running, casual, trail, etc.)' },
        gender: {
          type: 'string',
          enum: ['man', 'woman', 'unisex', 'kids'],
          description: 'Género del producto',
        },
        minPrice: { type: 'number', description: 'Precio mínimo en EUR' },
        maxPrice: { type: 'number', description: 'Precio máximo en EUR' },
        size: { type: 'number', description: 'Talla EU (36–48)' },
        onSale: { type: 'boolean', description: 'Solo productos en oferta' },
        limit: { type: 'integer', description: 'Número máximo de resultados, entre 1 y 10. Usa 5 si no se especifica.' },
      },
      required: [],
    },
  },
};

const DETAILS_TOOL: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_product_details',
    description:
      'Obtiene todos los detalles de un producto específico: variantes, tallas disponibles, colores y precio exacto.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'UUID del producto' },
        slug: { type: 'string', description: 'Slug del producto (alternativa al ID)' },
      },
      required: [],
    },
  },
};

const RECOMMEND_TOOL: ToolDefinition = {
  type: 'function',
  function: {
    name: 'recommend_products',
    description:
      'Recomienda productos relacionados basándose en un producto de referencia (misma categoría o marca).',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'UUID del producto de referencia' },
        limit: { type: 'integer', description: 'Número de recomendaciones, entre 1 y 6. Usa 4 si no se especifica.' },
      },
      required: ['productId'],
    },
  },
};

const ORDER_STATUS_TOOL: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_order_status',
    description:
      'Consulta el estado de un pedido del usuario autenticado. Devuelve estado, tracking y artículos.',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'UUID del pedido' },
      },
      required: ['orderId'],
    },
  },
};

const ANALYTICS_TOOL: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_sales_analytics',
    description:
      'Devuelve métricas de ventas: ingresos totales, pedidos, usuarios nuevos y stock bajo.',
    parameters: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['today', 'week', 'month', 'year'],
          description: 'Período de análisis. Usa "month" si no se especifica.',
        },
      },
      required: [],
    },
  },
};

export const PUBLIC_TOOLS: ToolDefinition[] = [SEARCH_TOOL, DETAILS_TOOL, RECOMMEND_TOOL];
export const USER_TOOLS: ToolDefinition[] = [...PUBLIC_TOOLS, ORDER_STATUS_TOOL];
export const ADMIN_TOOLS: ToolDefinition[] = [...USER_TOOLS, ANALYTICS_TOOL];

const REVENUE_STATUSES: OrderStatus[] = [
  OrderStatus.pending_payment,
  OrderStatus.confirmed,
  OrderStatus.processing,
  OrderStatus.shipped,
  OrderStatus.delivered,
  OrderStatus.return_approved,
];

export class AgentToolsExecutor {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    toolName: ToolName,
    args: Record<string, unknown>,
    supabaseId?: string,
  ): Promise<unknown> {
    switch (toolName) {
      case 'search_products':
        return this.searchProducts(args);
      case 'get_product_details':
        return this.getProductDetails(args);
      case 'recommend_products':
        return this.recommendProducts(args);
      case 'get_order_status':
        return this.getOrderStatus(args, supabaseId);
      case 'get_sales_analytics':
        return this.getSalesAnalytics(args);
      default:
        return { error: 'Herramienta no reconocida' };
    }
  }

  private async searchProducts(args: Record<string, unknown>) {
    const limit = Math.min(Number(args.limit ?? 5), 10);

    const brandName = typeof args.brandName === 'string' ? args.brandName : undefined;
    const categoryName = typeof args.categoryName === 'string' ? args.categoryName : undefined;

    let brandId: string | undefined;
    if (brandName) {
      const brand = await this.prisma.brand.findFirst({
        where: { name: { contains: brandName, mode: 'insensitive' } },
        select: { id: true },
      });
      brandId = brand?.id;
    }

    let categoryId: string | undefined;
    if (categoryName) {
      const cat = await this.prisma.category.findFirst({
        where: { name: { contains: categoryName, mode: 'insensitive' } },
        select: { id: true },
      });
      categoryId = cat?.id;
    }

    const where: Prisma.ProductWhereInput = { isActive: true };
    if (brandId) where.brandId = brandId;
    if (categoryId) where.categoryId = categoryId;
    const gender = typeof args.gender === 'string' ? args.gender.toLowerCase() as Gender : undefined;
    const query = typeof args.query === 'string' ? args.query : undefined;

    if (gender) where.gender = gender;
    if (args.onSale) where.salePrice = { not: null };
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }
    if (args.minPrice !== undefined || args.maxPrice !== undefined) {
      where.price = {
        ...(args.minPrice !== undefined ? { gte: Number(args.minPrice) } : {}),
        ...(args.maxPrice !== undefined ? { lte: Number(args.maxPrice) } : {}),
      };
    }
    if (args.size !== undefined) {
      where.variants = { some: { size: Number(args.size), stock: { gt: 0 } } };
    }

    const products = await this.prisma.product.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        salePrice: true,
        thumbnailUrl: true,
        gender: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
        variants: { select: { size: true, color: true, stock: true }, take: 20 },
      },
    });

    return {
      count: products.length,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: p.brand.name,
        category: p.category.name,
        gender: p.gender,
        price: Number(p.price),
        salePrice: p.salePrice !== null ? Number(p.salePrice) : null,
        thumbnailUrl: p.thumbnailUrl,
        availableSizes: [
          ...new Set(p.variants.filter((v) => v.stock > 0).map((v) => Number(v.size))),
        ].sort((a: number, b: number) => a - b),
        colors: [...new Set(p.variants.map((v) => v.color))],
      })),
    };
  }

  private async getProductDetails(args: Record<string, unknown>) {
    const productId = typeof args.productId === 'string' ? args.productId : undefined;
    const slug = typeof args.slug === 'string' ? args.slug : undefined;

    const product = await this.prisma.product.findFirst({
      where: {
        isActive: true,
        ...(productId ? { id: productId } : {}),
        ...(slug ? { slug } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        salePrice: true,
        saleEndsAt: true,
        thumbnailUrl: true,
        gender: true,
        brand: { select: { name: true, logoUrl: true } },
        category: { select: { name: true } },
        variants: {
          select: { id: true, sku: true, size: true, color: true, colorHex: true, stock: true, imageUrls: true },
          orderBy: { size: 'asc' },
        },
      },
    });

    if (!product) return { error: 'Producto no encontrado' };

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      brand: product.brand.name,
      category: product.category.name,
      gender: product.gender,
      price: Number(product.price),
      salePrice: product.salePrice !== null ? Number(product.salePrice) : null,
      saleEndsAt: product.saleEndsAt,
      thumbnailUrl: product.thumbnailUrl,
      variants: product.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        size: Number(v.size),
        color: v.color,
        colorHex: v.colorHex,
        stock: v.stock,
        imageUrls: v.imageUrls,
      })),
    };
  }

  private async recommendProducts(args: Record<string, unknown>) {
    const limit = Math.min(Number(args.limit ?? 4), 6);
    const productId = typeof args.productId === 'string' ? args.productId : '';

    const source = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true, brandId: true },
    });

    if (!source) return { error: 'Producto de referencia no encontrado' };

    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: productId },
        OR: [{ categoryId: source.categoryId }, { brandId: source.brandId }],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        salePrice: true,
        thumbnailUrl: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    return {
      count: products.length,
      recommendations: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: p.brand.name,
        category: p.category.name,
        price: Number(p.price),
        salePrice: p.salePrice !== null ? Number(p.salePrice) : null,
        thumbnailUrl: p.thumbnailUrl,
      })),
    };
  }

  private async getOrderStatus(args: Record<string, unknown>, supabaseId?: string) {
    if (!supabaseId) return { error: 'Se requiere autenticación para consultar pedidos' };

    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) return { error: 'Usuario no encontrado' };

    const order = await this.prisma.order.findFirst({
      where: { id: String(args.orderId), userId: user.id },
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            productName: true,
            productSlug: true,
            variantSku: true,
            size: true,
            color: true,
            quantity: true,
            unitPrice: true,
          },
        },
        tracking: {
          select: { carrier: true, trackingNumber: true },
        },
      },
    });

    if (!order) return { error: 'Pedido no encontrado' };

    return {
      id: order.id,
      status: order.status,
      total: Number(order.total),
      createdAt: order.createdAt,
      items: order.items.map((i) => ({
        product: i.productName,
        slug: i.productSlug,
        sku: i.variantSku,
        size: Number(i.size),
        color: i.color,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
      })),
      tracking: order.tracking,
    };
  }

  private async getSalesAnalytics(args: Record<string, unknown>) {
    const period = typeof args.period === 'string' ? args.period : 'month';
    const now = new Date();
    let from: Date;

    switch (period) {
      case 'today':
        from = new Date(now);
        from.setHours(0, 0, 0, 0);
        break;
      case 'week':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        from = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        from = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const periodFilter = { gte: from, lte: now };

    const [revenueAgg, orderCount, newUsers, lowStock] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: REVENUE_STATUSES }, createdAt: periodFilter },
      }),
      this.prisma.order.count({ where: { createdAt: periodFilter } }),
      this.prisma.user.count({ where: { createdAt: periodFilter } }),
      this.prisma.productVariant.count({ where: { stock: { lte: 5, gt: 0 } } }),
    ]);

    return {
      period,
      revenue: Number(revenueAgg._sum?.total ?? 0),
      orders: orderCount,
      newUsers,
      lowStockVariantsCount: lowStock,
    };
  }
}
