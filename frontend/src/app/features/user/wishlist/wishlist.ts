import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WishlistApiService } from '../../../core/api/wishlist.api';
import { WishlistItem } from '../../../core/models';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [RouterLink, ProductCardComponent, SpinnerComponent],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-10">
      <h1 class="text-2xl font-bold text-gray-900 mb-8">Mi wishlist</h1>

      @if (loading()) {
        <app-spinner />
      } @else if (items().length === 0) {
        <div class="text-center py-20 text-gray-500">
          <p class="text-5xl mb-4">❤️</p>
          <p class="font-medium mb-4">Tu wishlist está vacía</p>
          <a routerLink="/products" class="text-indigo-600 hover:text-indigo-800 font-medium">Explorar productos →</a>
        </div>
      } @else {
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          @for (item of items(); track item.id) {
            <div class="relative">
              <app-product-card [product]="item.product" />
              <button (click)="remove(item)"
                class="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-red-400 hover:text-red-600 hover:shadow-md transition-all text-sm">
                ✕
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class WishlistPage implements OnInit {
  private readonly api = inject(WishlistApiService);
  readonly items = signal<WishlistItem[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.api.list().subscribe({
      next: (items) => { this.items.set(items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  remove(item: WishlistItem): void {
    this.api.remove(item.product.id).subscribe(() => {
      this.items.update((list) => list.filter((i) => i.id !== item.id));
    });
  }
}
