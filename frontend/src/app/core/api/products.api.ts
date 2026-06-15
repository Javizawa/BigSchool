import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PagedResult, Product, ProductDetail, Review } from '../models';

export interface ProductsFilter {
  page?: number;
  limit?: number;
  categoryId?: string;
  brandId?: string;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: number;
  color?: string;
  search?: string;
  onSale?: boolean;
  sortBy?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductsApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/products`;

  list(filter: ProductsFilter = {}) {
    let params = new HttpParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<PagedResult<Product>>(this.url, { params });
  }

  get(productId: string) {
    return this.http.get<ProductDetail>(`${this.url}/${productId}`);
  }

  related(productId: string, limit = 8) {
    return this.http.get<Product[]>(`${this.url}/${productId}/related`, {
      params: { limit: String(limit) },
    });
  }

  reviews(productId: string, page = 1) {
    return this.http.get<PagedResult<Review>>(`${this.url}/${productId}/reviews`, {
      params: { page: String(page) },
    });
  }

  createReview(productId: string, dto: { rating: number; title?: string | null; body: string }) {
    return this.http.post<Review>(`${this.url}/${productId}/reviews`, dto);
  }

  notifyStock(productId: string, variantId: string) {
    return this.http.post(`${this.url}/${productId}/variants/${variantId}/notify-stock`, {});
  }
}
