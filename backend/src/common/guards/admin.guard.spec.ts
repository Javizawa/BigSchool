import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AdminGuard } from './admin.guard';
import { PrismaService } from '../prisma/prisma.service';

const makeCtx = (supabaseUser: unknown): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ supabaseUser }) }),
  }) as unknown as ExecutionContext;

describe('AdminGuard', () => {
  let guard: AdminGuard;
  const mockPrisma = { user: { findUnique: jest.fn() } };

  beforeEach(async () => {
    mockPrisma.user.findUnique.mockReset();
    const module = await Test.createTestingModule({
      providers: [AdminGuard, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    guard = module.get(AdminGuard);
  });

  it('throws ForbiddenException when request has no supabaseUser', async () => {
    await expect(guard.canActivate(makeCtx(null))).rejects.toThrow(ForbiddenException);
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when user does not exist in the database', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(guard.canActivate(makeCtx({ id: 'ghost' }))).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user role is USER', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'USER', status: 'active' });
    await expect(guard.canActivate(makeCtx({ id: 'u1' }))).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when ADMIN account is banned', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'ADMIN', status: 'banned' });
    await expect(guard.canActivate(makeCtx({ id: 'u1' }))).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when ADMIN account is inactive', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'ADMIN', status: 'inactive' });
    await expect(guard.canActivate(makeCtx({ id: 'u1' }))).rejects.toThrow(ForbiddenException);
  });

  it('returns true for an active ADMIN', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'ADMIN', status: 'active' });
    await expect(guard.canActivate(makeCtx({ id: 'admin-uuid' }))).resolves.toBe(true);
  });
});
