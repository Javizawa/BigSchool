import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AdminUsersService } from './admin-users.service';

const mockPrisma = {
  user: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
  },
};

function makeDbUser(overrides = {}) {
  return {
    id: 'user-1',
    email: 'user@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    phone: null,
    avatarUrl: null,
    role: 'USER',
    status: 'active',
    createdAt: new Date(),
    _count: { orders: 2 },
    orders: [{ total: 50 }, { total: 100 }],
    ...overrides,
  };
}

describe('AdminUsersService', () => {
  let service: AdminUsersService;

  beforeEach(async () => {
    Object.values(mockPrisma.user).forEach((fn) => fn.mockReset());

    const module = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AdminUsersService);
  });

  describe('findAll', () => {
    it('returns paginated users with orderCount and totalSpent', async () => {
      mockPrisma.user.count.mockResolvedValue(1);
      mockPrisma.user.findMany.mockResolvedValue([makeDbUser()]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.meta.total).toBe(1);
      expect(result.data[0].orderCount).toBe(2);
      expect(result.data[0].totalSpent).toBe(150);
    });

    it('applies role and status filters', async () => {
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.findAll({
        role: 'ADMIN',
        status: 'active',
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({ role: 'ADMIN', status: 'active' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns user with orderCount and totalSpent', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeDbUser());

      const result = await service.findOne('user-1');

      expect(result.id).toBe('user-1');
      expect(result.orderCount).toBe(2);
      expect(result.totalSpent).toBe(150);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.update('missing', { role: 'ADMIN' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates the user and returns refreshed data', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeDbUser());
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(
        makeDbUser({ role: 'ADMIN' }),
      );

      const result = await service.update('user-1', { role: 'ADMIN' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1' } }),
      );
      expect(result.role).toBe('ADMIN');
    });
  });
});
