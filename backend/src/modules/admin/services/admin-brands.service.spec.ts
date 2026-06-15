import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AdminBrandsService } from './admin-brands.service';

const mockPrisma = {
  brand: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const baseBrand = {
  id: 'brand-1',
  name: 'Nike',
  slug: 'nike',
  logoUrl: 'https://res.cloudinary.com/test/image/upload/nike.png',
};

describe('AdminBrandsService', () => {
  let service: AdminBrandsService;

  beforeEach(async () => {
    Object.values(mockPrisma.brand).forEach((fn) => fn.mockReset());

    const module = await Test.createTestingModule({
      providers: [
        AdminBrandsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AdminBrandsService);
  });

  describe('findAll', () => {
    it('returns brands ordered by name', async () => {
      mockPrisma.brand.findMany.mockResolvedValue([baseBrand]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Nike');
      expect(mockPrisma.brand.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { name: 'asc' } }),
      );
    });
  });

  describe('create', () => {
    it('generates slug from name and creates brand', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);
      mockPrisma.brand.create.mockResolvedValue(baseBrand);

      const result = await service.create({ name: 'Nike', logoUrl: baseBrand.logoUrl });

      expect(mockPrisma.brand.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ name: 'Nike', slug: 'nike' }),
        }),
      );
      expect(result.slug).toBe('nike');
    });

    it('slugifies accented names correctly', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);
      mockPrisma.brand.create.mockResolvedValue({ ...baseBrand, name: 'Ñoño Sport', slug: 'nono-sport' });

      await service.create({ name: 'Ñoño Sport' });

      expect(mockPrisma.brand.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ slug: 'nono-sport' }),
        }),
      );
    });

    it('throws ConflictException when slug already exists', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(baseBrand);
      await expect(service.create({ name: 'Nike' })).rejects.toThrow(ConflictException);
      expect(mockPrisma.brand.create).not.toHaveBeenCalled();
    });

    it('stores null logoUrl when not provided', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);
      mockPrisma.brand.create.mockResolvedValue({ ...baseBrand, logoUrl: null });

      await service.create({ name: 'Nike' });

      expect(mockPrisma.brand.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ logoUrl: null }),
        }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when brand does not exist', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);
      await expect(service.update('missing', { name: 'Adidas' })).rejects.toThrow(NotFoundException);
      expect(mockPrisma.brand.update).not.toHaveBeenCalled();
    });

    it('updates name and regenerates slug', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(baseBrand);
      mockPrisma.brand.update.mockResolvedValue({ ...baseBrand, name: 'Adidas', slug: 'adidas' });

      const result = await service.update('brand-1', { name: 'Adidas' });

      expect(mockPrisma.brand.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'brand-1' },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ name: 'Adidas', slug: 'adidas' }),
        }),
      );
      expect(result.slug).toBe('adidas');
    });

    it('updates logoUrl when provided', async () => {
      const newLogo = 'https://res.cloudinary.com/test/image/upload/adidas.png';
      mockPrisma.brand.findUnique.mockResolvedValue(baseBrand);
      mockPrisma.brand.update.mockResolvedValue({ ...baseBrand, logoUrl: newLogo });

      await service.update('brand-1', { name: 'Nike', logoUrl: newLogo });

      expect(mockPrisma.brand.update).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ logoUrl: newLogo }),
        }),
      );
    });

    it('omits logoUrl from update when not provided', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(baseBrand);
      mockPrisma.brand.update.mockResolvedValue(baseBrand);

      await service.update('brand-1', { name: 'Nike' });

      const updateCall = mockPrisma.brand.update.mock.calls[0][0] as { data: Record<string, unknown> };
      expect(updateCall.data).not.toHaveProperty('logoUrl');
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when brand does not exist', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.brand.delete).not.toHaveBeenCalled();
    });

    it('deletes the brand', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(baseBrand);
      mockPrisma.brand.delete.mockResolvedValue(baseBrand);

      await service.remove('brand-1');

      expect(mockPrisma.brand.delete).toHaveBeenCalledWith({ where: { id: 'brand-1' } });
    });
  });
});
