import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { Cart } from '../models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly url = `${environment.apiUrl}/cart`;

  private readonly _cart = signal<Cart | null>(null);
  readonly cart = this._cart.asReadonly();
  readonly itemCount = computed(() => this._cart()?.items.reduce((s, i) => s + i.quantity, 0) ?? 0);

  load(): void {
    if (!this.auth.isAuthenticated()) return;
    this.http.get<Cart>(this.url).subscribe((c) => this._cart.set(c));
  }

  addItem(variantId: string, quantity = 1) {
    return this.http.post<Cart>(`${this.url}/items`, { variantId, quantity }).pipe(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;
  }

  updateItem(itemId: string, quantity: number) {
    return this.http.patch<Cart>(`${this.url}/items/${itemId}`, { quantity });
  }

  removeItem(itemId: string) {
    return this.http.delete<void>(`${this.url}/items/${itemId}`);
  }

  refresh(): void {
    this.load();
  }

  clear(): void {
    this._cart.set(null);
  }
}
