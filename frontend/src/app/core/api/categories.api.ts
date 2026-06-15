import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Category, SizeGuide } from '../models';

@Injectable({ providedIn: 'root' })
export class CategoriesApiService {
  private readonly http = inject(HttpClient);

  list() {
    return this.http.get<Category[]>(`${environment.apiUrl}/categories`);
  }

  get(categoryId: string) {
    return this.http.get<Category>(`${environment.apiUrl}/categories/${categoryId}`);
  }

  sizeGuides() {
    return this.http.get<SizeGuide[]>(`${environment.apiUrl}/size-guide`);
  }

  sizeGuide(categoryId: string) {
    return this.http.get<SizeGuide>(`${environment.apiUrl}/size-guide/${categoryId}`);
  }
}
