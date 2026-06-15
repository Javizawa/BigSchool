import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoriesApiService } from '../../../core/api/categories.api';
import { ProductsApiService, ProductsFilter } from '../../../core/api/products.api';
import { Brand, Category, PagedResult, Product } from '../../../core/models';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [FormsModule, ProductCardComponent, SpinnerComponent, PaginationComponent],
  templateUrl: './product-list.html',
})
export class ProductListPage implements OnInit {
  private readonly api = inject(ProductsApiService);
  private readonly categoriesApi = inject(CategoriesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  readonly result = signal<PagedResult<Product> | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly brands = signal<Brand[]>([]);
  readonly loading = signal(true);

  filter: ProductsFilter = { page: 1, limit: 24, sortBy: 'newest' };

  ngOnInit(): void {
    this.categoriesApi.list().subscribe((c) => this.categories.set(c));
    this.http.get<Brand[]>(`${environment.apiUrl}/brands`).subscribe((b) => this.brands.set(b));
    this.route.queryParams.subscribe((params) => {
      this.filter = {
        page: params['page'] ? +params['page'] : 1,
        limit: 24,
        sortBy: params['sortBy'] ?? 'newest',
        categoryId: params['categoryId'],
        brandId: params['brandId'],
        gender: params['gender'],
        search: params['search'],
        onSale: params['onSale'] === 'true' ? true : undefined,
        minPrice: params['minPrice'] ? +params['minPrice'] : undefined,
        maxPrice: params['maxPrice'] ? +params['maxPrice'] : undefined,
      };
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.api.list(this.filter).subscribe((res) => {
      this.result.set(res);
      this.loading.set(false);
    });
  }

  applyFilter(): void {
    this.filter.page = 1;
    this.router.navigate([], {
      queryParams: this.cleanFilter(),
      queryParamsHandling: 'merge',
    });
  }

  onPageChange(page: number): void {
    this.router.navigate([], { queryParams: { page }, queryParamsHandling: 'merge' });
  }

  private cleanFilter() {
    return Object.fromEntries(
      Object.entries(this.filter).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    );
  }
}
