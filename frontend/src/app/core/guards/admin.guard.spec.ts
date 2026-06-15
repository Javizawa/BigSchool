import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { GuardResult } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '../auth/auth.service';

function makeAuth(initialized: boolean, isAdmin: boolean) {
  return {
    initialized: signal(initialized),
    isAuthenticated: signal(isAdmin),
    isAdmin: signal(isAdmin),
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
    TestBed.runInInjectionContext(() => adminGuard(ROUTE, STATE)) as Observable<GuardResult>,
  );
}

describe('adminGuard', () => {
  it('returns true when user is ADMIN', async () => {
    const result = await runGuard(makeAuth(true, true));
    expect(result).toBe(true);
  });

  it('returns a UrlTree to / when user is not ADMIN', async () => {
    const result = await runGuard(makeAuth(true, false));

    expect(result).toBeInstanceOf(UrlTree);
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });
});
