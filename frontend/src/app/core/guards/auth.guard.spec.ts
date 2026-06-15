import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { GuardResult } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../auth/auth.service';

function makeAuth(initialized: boolean, isAuthenticated: boolean) {
  return {
    initialized: signal(initialized),
    isAuthenticated: signal(isAuthenticated),
    isAdmin: signal(false),
    session: signal(null),
    user: signal(null),
  };
}

const ROUTE = {} as ActivatedRouteSnapshot;
const STATE = {} as RouterStateSnapshot;

async function runGuard(auth: ReturnType<typeof makeAuth>) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: auth },
    ],
  });

  return firstValueFrom(
    TestBed.runInInjectionContext(() => authGuard(ROUTE, STATE)) as Observable<GuardResult>,
  );
}

describe('authGuard', () => {
  it('returns true when user is authenticated', async () => {
    const result = await runGuard(makeAuth(true, true));
    expect(result).toBe(true);
  });

  it('returns a UrlTree to /auth/login when user is not authenticated', async () => {
    const result = await runGuard(makeAuth(true, false));

    expect(result).toBeInstanceOf(UrlTree);
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result as UrlTree)).toBe('/auth/login');
  });

  it('waits until initialized is true before resolving', async () => {
    const auth = makeAuth(false, true);
    const promise = runGuard(auth);

    await new Promise((r) => setTimeout(r, 10));
    auth.initialized.set(true);

    expect(await promise).toBe(true);
  });
});
