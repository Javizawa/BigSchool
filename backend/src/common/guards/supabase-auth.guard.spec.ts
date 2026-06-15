import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

const mockGetUser = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ auth: { getUser: mockGetUser } })),
}));

import { SupabaseAuthGuard } from './supabase-auth.guard';

const makeCtx = (headers: Record<string, string> = {}, req: Record<string, unknown> = {}): ExecutionContext =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ headers, ...req }) }),
  }) as unknown as ExecutionContext;

describe('SupabaseAuthGuard', () => {
  let guard: SupabaseAuthGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    mockGetUser.mockReset();
    const module = await Test.createTestingModule({
      providers: [SupabaseAuthGuard, Reflector],
    }).compile();
    guard = module.get(SupabaseAuthGuard);
    reflector = module.get(Reflector);
  });

  it('allows public routes without a token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    await expect(guard.canActivate(makeCtx())).resolves.toBe(true);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when Authorization header is missing', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    await expect(guard.canActivate(makeCtx())).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when scheme is not Bearer', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    await expect(
      guard.canActivate(makeCtx({ authorization: 'Basic dXNlcjpwYXNz' })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when Supabase returns an error', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('invalid token') });
    await expect(
      guard.canActivate(makeCtx({ authorization: 'Bearer bad-token' })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when Supabase returns null user without error', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(
      guard.canActivate(makeCtx({ authorization: 'Bearer token' })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('attaches supabaseUser to request and returns true for valid token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const supabaseUser = { id: 'user-uuid', email: 'user@bigschool.com' };
    mockGetUser.mockResolvedValue({ data: { user: supabaseUser }, error: null });

    const request: Record<string, unknown> = { headers: { authorization: 'Bearer valid' } };
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request['supabaseUser']).toEqual(supabaseUser);
  });
});
