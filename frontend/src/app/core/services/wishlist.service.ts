import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { WishlistApiService } from '../api/wishlist.api';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly api = inject(WishlistApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly _ids = signal<Set<string>>(new Set());
  readonly ids = this._ids.asReadonly();

  has(productId: string): boolean {
    return this._ids().has(productId);
  }

  load(): void {
    if (!this.auth.isAuthenticated()) return;
    this.api.list().subscribe((items) => {
      this._ids.set(new Set(items.map((i) => i.product.id)));
    });
  }

  clear(): void {
    this._ids.set(new Set());
  }

  toggle(productId: string, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/auth/login']);
      return;
    }

    if (this.has(productId)) {
      this.api.remove(productId).subscribe(() => {
        this._ids.update((s) => { const n = new Set(s); n.delete(productId); return n; });
      });
    } else {
      this.api.add(productId).subscribe(() => {
        this._ids.update((s) => new Set([...s, productId]));
      });
    }
  }
}
