import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { CartService } from './cart.service';
import { AuthService } from '../auth/auth.service';
import { Cart } from '../models';

const mockAuth = {
  isAuthenticated: signal(false),
  session: signal(null),
  user: signal(null),
  initialized: signal(true),
  isAdmin: signal(false),
};

const emptyCart: Cart = { id: 'cart-1', items: [], coupon: null };

function setup() {
  TestBed.configureTestingModule({
    providers: [
      CartService,
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: AuthService, useValue: mockAuth },
    ],
  });
  return {
    service: TestBed.inject(CartService),
    http: TestBed.inject(HttpTestingController),
  };
}

describe('CartService', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  describe('itemCount', () => {
    it('returns 0 when cart is null', () => {
      const { service } = setup();
      expect(service.itemCount()).toBe(0);
    });

    it('sums quantities across all items', () => {
      const { service, http } = setup();
      mockAuth.isAuthenticated.set(true);
      service.load();

      const cartWithItems: Cart = {
        id: 'cart-1',
        coupon: null,
        items: [
          { id: 'i1', variantId: 'v1', quantity: 2, variant: {} as never },
          { id: 'i2', variantId: 'v2', quantity: 3, variant: {} as never },
        ],
      };
      http.expectOne((req) => req.url.includes('/cart')).flush(cartWithItems);

      expect(service.itemCount()).toBe(5);
      mockAuth.isAuthenticated.set(false);
    });
  });

  describe('load', () => {
    it('does not make an HTTP call when user is not authenticated', () => {
      const { service, http } = setup();
      mockAuth.isAuthenticated.set(false);
      service.load();
      http.expectNone((req) => req.url.includes('/cart'));
    });

    it('fetches the cart when user is authenticated', () => {
      const { service, http } = setup();
      mockAuth.isAuthenticated.set(true);
      service.load();

      const req = http.expectOne((req) => req.url.includes('/cart'));
      expect(req.request.method).toBe('GET');
      req.flush(emptyCart);

      expect(service.cart()).toEqual(emptyCart);
      mockAuth.isAuthenticated.set(false);
    });
  });

  describe('clear', () => {
    it('sets cart to null', () => {
      const { service, http } = setup();
      mockAuth.isAuthenticated.set(true);
      service.load();
      http.expectOne((req) => req.url.includes('/cart')).flush(emptyCart);

      service.clear();
      expect(service.cart()).toBeNull();
      mockAuth.isAuthenticated.set(false);
    });
  });
});
