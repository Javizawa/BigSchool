import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  AdminCoupon,
  AdminOrder,
  AdminProduct,
  AdminReturn,
  AdminUser,
  AnalyticsSummary,
  Brand,
  Category,
  OrderStatus,
  PagedResult,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  // Analytics
  analytics(period: 'today' | 'week' | 'month' | 'year' = 'month') {
    return this.http.get<AnalyticsSummary>(`${this.base}/analytics/summary`, { params: { period } });
  }

  // Products
  listProducts(params: Record<string, string | number | boolean> = {}) {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => (p = p.set(k, String(v))));
    return this.http.get<PagedResult<AdminProduct>>(`${this.base}/products`, { params: p });
  }

  createProduct(dto: unknown) {
    return this.http.post<AdminProduct>(`${this.base}/products`, dto);
  }

  updateProduct(id: string, dto: unknown) {
    return this.http.patch<AdminProduct>(`${this.base}/products/${id}`, dto);
  }

  deleteProduct(id: string) {
    return this.http.delete<void>(`${this.base}/products/${id}`);
  }

  createVariant(productId: string, dto: unknown) {
    return this.http.post(`${this.base}/products/${productId}/variants`, dto);
  }

  updateVariant(productId: string, variantId: string, dto: unknown) {
    return this.http.patch(`${this.base}/products/${productId}/variants/${variantId}`, dto);
  }

  deleteVariant(productId: string, variantId: string) {
    return this.http.delete<void>(`${this.base}/products/${productId}/variants/${variantId}`);
  }

  // Categories
  listCategories() {
    return this.http.get<(Category & { productCount: number })[]>(`${this.base}/categories`);
  }

  createCategory(dto: { name: string; imageUrl?: string }) {
    return this.http.post<Category>(`${this.base}/categories`, dto);
  }

  updateCategory(id: string, dto: { name?: string; imageUrl?: string }) {
    return this.http.patch<Category>(`${this.base}/categories/${id}`, dto);
  }

  deleteCategory(id: string) {
    return this.http.delete<void>(`${this.base}/categories/${id}`);
  }

  // Brands
  listBrands() {
    return this.http.get<Brand[]>(`${this.base}/brands`);
  }

  createBrand(dto: { name: string; logoUrl?: string }) {
    return this.http.post<Brand>(`${this.base}/brands`, dto);
  }

  updateBrand(id: string, dto: { name: string; logoUrl?: string }) {
    return this.http.patch<Brand>(`${this.base}/brands/${id}`, dto);
  }

  deleteBrand(id: string) {
    return this.http.delete<void>(`${this.base}/brands/${id}`);
  }

  // Orders
  listOrders(params: Record<string, string> = {}) {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => (p = p.set(k, v)));
    return this.http.get<PagedResult<AdminOrder>>(`${this.base}/orders`, { params: p });
  }

  getOrder(id: string) {
    return this.http.get<AdminOrder>(`${this.base}/orders/${id}`);
  }

  updateOrder(id: string, dto: { status?: OrderStatus; adminNotes?: string; tracking?: unknown }) {
    return this.http.patch<AdminOrder>(`${this.base}/orders/${id}`, dto);
  }

  // Coupons
  listCoupons(isActive?: boolean) {
    const params: Record<string, string> = {};
    if (isActive !== undefined) params['isActive'] = String(isActive);
    return this.http.get<AdminCoupon[]>(`${this.base}/coupons`, { params });
  }

  createCoupon(dto: unknown) {
    return this.http.post<AdminCoupon>(`${this.base}/coupons`, dto);
  }

  updateCoupon(id: string, dto: unknown) {
    return this.http.patch<AdminCoupon>(`${this.base}/coupons/${id}`, dto);
  }

  deleteCoupon(id: string) {
    return this.http.delete<void>(`${this.base}/coupons/${id}`);
  }

  // Users
  listUsers(params: Record<string, string> = {}) {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => (p = p.set(k, v)));
    return this.http.get<PagedResult<AdminUser>>(`${this.base}/users`, { params: p });
  }

  updateUser(id: string, dto: { role?: string; status?: string }) {
    return this.http.patch<AdminUser>(`${this.base}/users/${id}`, dto);
  }

  // Returns
  listReturns(status?: string) {
    const params: Record<string, string> = {};
    if (status) params['status'] = status;
    return this.http.get<PagedResult<AdminReturn>>(`${this.base}/returns`, { params });
  }

  updateReturn(id: string, dto: { status: string }) {
    return this.http.patch<AdminReturn>(`${this.base}/returns/${id}`, dto);
  }
}
