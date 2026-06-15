import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../../core/models';
import { PricePipe } from '../../pipes/price.pipe';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, PricePipe],
  template: `
    <a [routerLink]="['/products', product().id]"
       class="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div class="relative aspect-square bg-gray-50 overflow-hidden">
        @if (product().thumbnailUrl) {
          <img [src]="product().thumbnailUrl" [alt]="product().name"
               class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        } @else {
          <div class="w-full h-full flex items-center justify-center text-gray-300">
            <svg class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        }
        @if (product().salePrice) {
          <span class="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">SALE</span>
        }
      </div>
      <div class="p-4 flex flex-col gap-1">
        <p class="text-xs text-gray-400 font-medium uppercase tracking-wide">{{ product().brand.name }}</p>
        <h3 class="font-semibold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">{{ product().name }}</h3>
        @if (product().reviewCount > 0) {
          <div class="flex items-center gap-1 text-sm text-gray-500">
            <span class="text-yellow-400">★</span>
            <span>{{ product().averageRating?.toFixed(1) }}</span>
            <span class="text-gray-300">({{ product().reviewCount }})</span>
          </div>
        }
        <div class="flex items-baseline gap-2 mt-1">
          @if (product().salePrice) {
            <span class="font-bold text-red-600">{{ product().salePrice | price }}</span>
            <span class="text-sm text-gray-400 line-through">{{ product().price | price }}</span>
          } @else {
            <span class="font-bold text-gray-900">{{ product().price | price }}</span>
          }
        </div>
      </div>
    </a>
  `,
})
export class ProductCardComponent {
  product = input.required<Product>();
}
