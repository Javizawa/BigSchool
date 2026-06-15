import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { WishlistItem } from '../models';

@Injectable({ providedIn: 'root' })
export class WishlistApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/users/me/wishlist`;

  list() {
    return this.http.get<WishlistItem[]>(this.url);
  }

  add(productId: string) {
    return this.http.post<WishlistItem>(`${this.url}/${productId}`, {});
  }

  remove(productId: string) {
    return this.http.delete<void>(`${this.url}/${productId}`);
  }
}
