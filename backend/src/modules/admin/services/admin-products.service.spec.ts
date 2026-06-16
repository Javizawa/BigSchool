import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AdminProductsService } from './admin-products.service';

const mockPrisma = {
  product: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  productVariant: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  orderItem: {
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
};

function makeProduct(overrides = {}) {
  return {
    id: 'prod-1',
    name: 'Air Max 90',
    slug: 'air-max-90',
    brandId: 'b-1',
    categoryId: 'c-1',
    gender: 'MEN',
    price: 120,
    salePrice: null,
    saleEndsAt: null,
    description: null,
    thumbnailUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    brand: { id: 'b-1', name: 'Nike', slug: 'nike', logoUrl: null },
    category: { id: 'c-1', name: 'Running', slug: 'running', imageUrl: null },
    variants: [
      {
        id: 'v-1',
        sku: 'SKU-1',
        size: 42,
        color: 'Black',
        colorHex: null,
        stock: 10,
        imageUrls: [],
      },
    ],
    seo: null,
    ...overrides,
  };
}

function makeVariant(overrides = {}) {
  return {
    id: 'v-1',
    sku: 'SKU-1',
    size: 42,
    color: 'Black',
    colorHex: null,
    stock: 10,
    imageUrls: [],
    productId: 'prod-1',
    ...overrides,
  };
}

describe('AdminProductsService', () => {
  let service: AdminProductsService;

  beforeEach(async () => {
    [
      mockPrisma.product,
      mockPrisma.productVariant,
      mockPrisma.orderItem,
    ].forEach((obj) => Object.values(obj).forEach((fn) => fn.mockReset()));

    const module = await Test.createTestingModule({
      providers: [
        AdminProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AdminProductsService);
  });

  describe('findAll', () => {
    it('returns paginated products with totalStock and totalSold', async () => {
      const product = makeProduct();
      mockPrisma.product.count.mockResolvedValue(1);
      mockPrisma.product.findMany.mockResolvedValue([product]);
      mockPrisma.orderItem.groupBy.mockResolvedValue([
        { productSlug: 'air-max-90', _sum: { quantity: 5 } },
      ]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.meta.total).toBe(1);
      expect(result.data[0].totalStock).toBe(10);
      expect(result.data[0].totalSold).toBe(5);
    });

    it('counts totalStock as 0 when no variants', async () => {
      mockPrisma.product.count.mockResolvedValue(1);
      mockPrisma.product.findMany.mockResolvedValue([
        makeProduct({ variants: [] }),
      ]);
      mockPrisma.orderItem.groupBy.mockResolvedValue([]);

      const result = await service.findAll({});

      expect(result.data[0].totalStock).toBe(0);
      expect(result.data[0].totalSold).toBe(0);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when product does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the mapped product with totalSold', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(makeProduct());
      mockPrisma.orderItem.aggregate.mockResolvedValue({
        _sum: { quantity: 3 },
      });

      const result = await service.findOne('prod-1');

      expect(result.id).toBe('prod-1');
      expect(result.totalSold).toBe(3);
    });
  });

  describe('create', () => {
    it('throws ConflictException when slug already exists', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(makeProduct());
      await expect(
        service.create({
          name: 'Air Max 90',
          brandId: 'b-1',
          categoryId: 'c-1',
          gender: 'MEN' as never,
          price: 120,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates a product and returns mapped data', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.product.create.mockResolvedValue(makeProduct());

      const result = await service.create({
        name: 'Air Max 90',
        brandId: 'b-1',
        categoryId: 'c-1',
        gender: 'MEN' as never,
        price: 120,
      });

      expect(result.name).toBe('Air Max 90');
      expect(result.totalSold).toBe(0);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when product does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(service.update('missing', { price: 99 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updates product fields', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(makeProduct());
      mockPrisma.product.update.mockResolvedValue(makeProduct({ price: 99 }));
      mockPrisma.orderItem.aggregate.mockResolvedValue({
        _sum: { quantity: 0 },
      });

      const result = await service.update('prod-1', { price: 99 });

      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'prod-1' } }),
      );
      expect(result.price).toBe(99);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when product does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('permanently deletes the product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(makeProduct());
      mockPrisma.product.delete.mockResolvedValue({});

      await service.remove('prod-1');

      expect(mockPrisma.product.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'prod-1' } }),
      );
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });
  });

  describe('createVariant', () => {
    it('throws NotFoundException when product does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(
        service.createVariant('missing', {
          sku: 'SKU-2',
          size: 43,
          color: 'White',
          stock: 5,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when SKU already exists', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(makeProduct());
      mockPrisma.productVariant.findUnique.mockResolvedValue(makeVariant());

      await expect(
        service.createVariant('prod-1', {
          sku: 'SKU-1',
          size: 43,
          color: 'White',
          stock: 5,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates the variant', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(makeProduct());
      mockPrisma.productVariant.findUnique.mockResolvedValue(null);
      mockPrisma.productVariant.create.mockResolvedValue(
        makeVariant({ sku: 'SKU-2' }),
      );

      await service.createVariant('prod-1', {
        sku: 'SKU-2',
        size: 43,
        color: 'White',
        stock: 5,
      });

      expect(mockPrisma.productVariant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ productId: 'prod-1', sku: 'SKU-2' }),
        }),
      );
    });
  });

  describe('updateVariant', () => {
    it('throws NotFoundException when variant does not exist', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue(null);
      await expect(
        service.updateVariant('prod-1', 'v-2', { stock: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when variant belongs to another product', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue(
        makeVariant({ productId: 'other-prod' }),
      );
      await expect(
        service.updateVariant('prod-1', 'v-1', { stock: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates the variant', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue(makeVariant());
      mockPrisma.productVariant.update.mockResolvedValue(
        makeVariant({ stock: 20 }),
      );

      await service.updateVariant('prod-1', 'v-1', { stock: 20 });

      expect(mockPrisma.productVariant.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'v-1' }, data: { stock: 20 } }),
      );
    });
  });

  describe('removeVariant', () => {
    it('throws NotFoundException when variant does not exist', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue(null);
      await expect(service.removeVariant('prod-1', 'v-2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes the variant', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue(makeVariant());
      mockPrisma.productVariant.delete.mockResolvedValue({});

      await service.removeVariant('prod-1', 'v-1');

      expect(mockPrisma.productVariant.delete).toHaveBeenCalledWith({
        where: { id: 'v-1' },
      });
    });
  });
});
