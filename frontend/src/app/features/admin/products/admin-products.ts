import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../core/api/admin.api';
import { AdminProduct, PagedResult } from '../../../core/models';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [FormsModule, PricePipe, SpinnerComponent, PaginationComponent],
  templateUrl: './admin-products.html',
})
export class AdminProductsPage implements OnInit {
  private readonly api = inject(AdminApiService);
  readonly result = signal<PagedResult<AdminProduct> | null>(null);
  readonly loading = signal(true);
  search = '';
  page = 1;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    const params: Record<string, string | number> = { page: this.page, limit: 20 };
    if (this.search) params['search'] = this.search;
    this.api.listProducts(params).subscribe({
      next: (r) => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleActive(p: AdminProduct): void {
    this.api.updateProduct(p.id, { isActive: !p.isActive }).subscribe(() => this.load());
  }

  delete(p: AdminProduct): void {
    if (!confirm(`¿Desactivar "${p.name}"?`)) return;
    this.api.deleteProduct(p.id).subscribe(() => this.load());
  }
}
