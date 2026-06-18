import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoriesApiService } from '../../core/api/categories.api';
import { ProductsApiService } from '../../core/api/products.api';
import { Category, Product } from '../../core/models';
import { ProductCardComponent } from '../../shared/components/product-card/product-card';
import { SpinnerComponent } from '../../shared/components/spinner/spinner';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ProductCardComponent, SpinnerComponent],
  templateUrl: './home.html',
})
export class HomePage {
  private readonly productsApi = inject(ProductsApiService);
  private readonly categoriesApi = inject(CategoriesApiService);

  readonly featured = signal<Product[]>([]);
  readonly onSale = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);

  readonly messages = [
    'Las zapatillas que marcan tendencia',
    'Estilo que habla por ti',
    'Da el siguiente paso',
    'Diseñadas para destacar',
  ];
  readonly msgIndex = signal(0);
  readonly msgVisible = signal(true);

  constructor() {
    this.categoriesApi.list().subscribe((c) => this.categories.set(c));
    this.productsApi.list({ limit: 8, sortBy: 'newest' }).subscribe((res) => {
      this.featured.set(res.data);
      this.loading.set(false);
    });
    this.productsApi.list({ limit: 4, onSale: true }).subscribe((res) => this.onSale.set(res.data));

    const timer = setInterval(() => {
      this.msgVisible.set(false);
      setTimeout(() => {
        this.msgIndex.update((i) => (i + 1) % this.messages.length);
        this.msgVisible.set(true);
      }, 700);
    }, 4000);

    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
