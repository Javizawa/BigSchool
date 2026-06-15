import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AdminCategoriesService } from './admin-categories.service';

const mockPrisma = {
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

function makeDbCategory(
  overrides: Partial<{
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    productCount: number;
  }> = {},
) {
  const productCount = overrides.productCount ?? 3;
  return {
    id: overrides.id ?? 'cat-1',
    name: overrides.name ?? 'Sneakers',
    slug: overrides.slug ?? 'sneakers',
    imageUrl: overrides.imageUrl ?? null,
    _count: { products: productCount },
  };
}

describe('AdminCategoriesService', () => {
  let service: AdminCategoriesService;

  beforeEach(async () => {
    Object.values(mockPrisma.category).forEach((fn) => fn.mockReset());

    const module = await Test.createTestingModule({
      providers: [
        AdminCategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AdminCategoriesService);
  });

  describe('findAll', () => {
    it('returns categories with productCount mapped from _count', async () => {
      mockPrisma.category.findMany.mockResolvedValue([
        makeDbCategory({ productCount: 5 }),
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].productCount).toBe(5);
      expect(result[0]).not.toHaveProperty('_count');
    });

    it('orders by name ascending', async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);
      await service.findAll();
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { name: 'asc' } }),
      );
    });
  });

  describe('create', () => {
    it('generates slug from name and creates category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue(makeDbCategory());

      await service.create({ name: 'Sneakers' });

      expect(mockPrisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ name: 'Sneakers', slug: 'sneakers' }),
        }),
      );
    });

    it('slugifies names with spaces and accents', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue(
        makeDbCategory({ name: 'Zapatillas Niños', slug: 'zapatillas-ninos' }),
      );

      await service.create({ name: 'Zapatillas Niños' });

      expect(mockPrisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ slug: 'zapatillas-ninos' }),
        }),
      );
    });

    it('throws ConflictException when slug already exists', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(makeDbCategory());
      await expect(service.create({ name: 'Sneakers' })).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrisma.category.create).not.toHaveBeenCalled();
    });

    it('returns productCount from created category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue(
        makeDbCategory({ productCount: 0 }),
      );

      const result = await service.create({ name: 'Sneakers' });

      expect(result.productCount).toBe(0);
    });

    it('stores null imageUrl when not provided', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue(makeDbCategory());

      await service.create({ name: 'Sneakers' });

      expect(mockPrisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ imageUrl: null }),
        }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when category does not exist', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      await expect(
        service.update('missing', { name: 'Running' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.category.update).not.toHaveBeenCalled();
    });

    it('updates name and regenerates slug', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(makeDbCategory());
      mockPrisma.category.update.mockResolvedValue(
        makeDbCategory({ name: 'Running', slug: 'running' }),
      );

      const result = await service.update('cat-1', { name: 'Running' });

      expect(mockPrisma.category.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cat-1' },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ name: 'Running', slug: 'running' }),
        }),
      );
      expect(result.slug).toBe('running');
    });

    it('updates imageUrl when provided', async () => {
      const imageUrl =
        'https://res.cloudinary.com/test/image/upload/running.jpg';
      mockPrisma.category.findUnique.mockResolvedValue(makeDbCategory());
      mockPrisma.category.update.mockResolvedValue(
        makeDbCategory({ imageUrl }),
      );

      await service.update('cat-1', { name: 'Sneakers', imageUrl });

      expect(mockPrisma.category.update).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ imageUrl }),
        }),
      );
    });

    it('omits imageUrl from update when not provided', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(makeDbCategory());
      mockPrisma.category.update.mockResolvedValue(makeDbCategory());

      await service.update('cat-1', { name: 'Sneakers' });

      expect(mockPrisma.category.update).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.not.objectContaining({ imageUrl: expect.anything() }),
        }),
      );
    });

    it('returns productCount in updated result', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(makeDbCategory());
      mockPrisma.category.update.mockResolvedValue(
        makeDbCategory({ productCount: 7 }),
      );

      const result = await service.update('cat-1', { name: 'Sneakers' });

      expect(result.productCount).toBe(7);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when category does not exist', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.category.delete).not.toHaveBeenCalled();
    });

    it('deletes the category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(makeDbCategory());
      mockPrisma.category.delete.mockResolvedValue({});

      await service.remove('cat-1');

      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      });
    });
  });
});
