import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Address, AppUser, StockNotification } from '../models';

export interface AddressDto {
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/users/me`;

  me() {
    return this.http.get<AppUser>(`${environment.apiUrl}/auth/me`);
  }

  updateMe(dto: Partial<{ firstName: string; lastName: string; phone: string; avatarUrl: string }>) {
    return this.http.patch<AppUser>(this.url, dto);
  }

  listAddresses() {
    return this.http.get<Address[]>(`${this.url}/addresses`);
  }

  createAddress(dto: AddressDto) {
    return this.http.post<Address>(`${this.url}/addresses`, dto);
  }

  updateAddress(addressId: string, dto: AddressDto) {
    return this.http.patch<Address>(`${this.url}/addresses/${addressId}`, dto);
  }

  deleteAddress(addressId: string) {
    return this.http.delete<void>(`${this.url}/addresses/${addressId}`);
  }

  listStockNotifications() {
    return this.http.get<StockNotification[]>(`${this.url}/stock-notifications`);
  }
}
