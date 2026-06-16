import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UsersService } from './users.service';

const mockPrisma = {
  user: { findUnique: jest.fn(), update: jest.fn() },
  address: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateMany: jest.fn(),
  },
  stockNotification: { findMany: jest.fn() },
};

const supabaseUser = { id: 'supa-uid' } as never;
const dbUser = {
  id: 'db-user-1',
  supabaseId: 'supa-uid',
  email: 'u@b.com',
  firstName: 'Jane',
  lastName: 'Doe',
  phone: null,
  avatarUrl: null,
  role: 'USER',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
};
const address = {
  id: 'addr-1',
  userId: dbUser.id,
  label: 'Casa',
  fullName: 'Jane Doe',
  line1: 'Calle 1',
  line2: undefined,
  postalCode: '28001',
  city: 'Madrid',
  province: 'Madrid',
  country: 'ES',
  isDefault: false,
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    Object.values(mockPrisma).forEach((model) =>
      Object.values(model).forEach((fn) => fn.mockReset()),
    );
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  describe('findMe', () => {
    it('throws UnauthorizedException when user is not in the DB', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findMe(supabaseUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns the user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      const result = await service.findMe(supabaseUser);
      expect(result.email).toBe('u@b.com');
    });
  });

  describe('updateMe', () => {
    it('throws UnauthorizedException when user is not in the DB', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.updateMe(supabaseUser, { firstName: 'X' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('updates and returns the user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.user.update.mockResolvedValue({ ...dbUser, firstName: 'X' });

      const result = await service.updateMe(supabaseUser, { firstName: 'X' });

      expect(result.firstName).toBe('X');
    });
  });

  describe('listAddresses', () => {
    it('throws UnauthorizedException when user is not in the DB', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.listAddresses(supabaseUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns addresses sorted by default first', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.address.findMany.mockResolvedValue([address]);

      const result = await service.listAddresses(supabaseUser);

      expect(result).toHaveLength(1);
      expect(mockPrisma.address.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: dbUser.id } }),
      );
    });
  });

  describe('createAddress', () => {
    it('clears existing default before creating when isDefault=true', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.address.create.mockResolvedValue(address);

      await service.createAddress(supabaseUser, {
        ...address,
        isDefault: true,
      });

      expect(mockPrisma.address.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: dbUser.id, isDefault: true },
        }),
      );
    });

    it('does not clear defaults when isDefault=false', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.address.create.mockResolvedValue(address);

      await service.createAddress(supabaseUser, {
        ...address,
        isDefault: false,
      });

      expect(mockPrisma.address.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('deleteAddress', () => {
    it('throws UnauthorizedException when user is not in the DB', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.deleteAddress(supabaseUser, 'addr-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws NotFoundException when address does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.address.findUnique.mockResolvedValue(null);
      await expect(
        service.deleteAddress(supabaseUser, 'addr-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when address belongs to another user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.address.findUnique.mockResolvedValue({
        ...address,
        userId: 'other-user',
      });
      await expect(
        service.deleteAddress(supabaseUser, 'addr-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deletes the address when ownership is confirmed', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.address.findUnique.mockResolvedValue(address);

      await service.deleteAddress(supabaseUser, 'addr-1');

      expect(mockPrisma.address.delete).toHaveBeenCalledWith({
        where: { id: 'addr-1' },
      });
    });
  });
});
