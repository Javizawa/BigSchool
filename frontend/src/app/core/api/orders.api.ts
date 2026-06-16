import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Order, PagedResult } from '../models';

export interface CreateOrderDto {
  addressId: string;
  couponCode?: string;
}

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/orders`;

  list(page = 1) {
    return this.http.get<PagedResult<Order>>(this.url, { params: { page: String(page) } });
  }

  get(orderId: string) {
    return this.http.get<Order>(`${this.url}/${orderId}`);
  }

  create(dto: CreateOrderDto) {
    return this.http.post<Order>(this.url, dto);
  }

  cancel(orderId: string) {
    return this.http.post<Order>(`${this.url}/${orderId}/cancel`, {});
  }

  createReturn(orderId: string, reason: string, items: { orderItemId: string; quantity: number }[]) {
    return this.http.post(`${this.url}/${orderId}/return`, { reason, items });
  }

  createPaymentIntent(orderId: string) {
    return this.http.post<{ clientSecret: string; paymentIntentId: string }>(
      `${environment.apiUrl}/payments/intent`,
      { orderId },
    );
  }
}
