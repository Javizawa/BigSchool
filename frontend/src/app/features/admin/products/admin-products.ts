import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../core/api/admin.api';
import { AdminProduct, Brand, Category, PagedResult } from '../../../core/models';
import { CloudinaryUploadComponent } from '../../../shared/components/cloudinary-upload/cloudinary-upload';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner';

interface ProductForm {
  name: string;
  brandId: string;
  categoryId: string;
  gender: string;
  price: number | null;
  salePrice: number | null;
  thumbnailUrl: string | null;
  description: string;
  isActive: boolean;
}

function emptyForm(): ProductForm {
  return {
    name: '',
    brandId: '',
    categoryId: '',
    gender: 'UNISEX',
    price: null,
    salePrice: null,
    thumbnailUrl: null,
    description: '',
    isActive: true,
  };
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [FormsModule, PricePipe, SpinnerComponent, PaginationComponent, CloudinaryUploadComponent],
  templateUrl: './admin-products.html',
})
export class AdminProductsPage implements OnInit {
  private readonly api = inject(AdminApiService);

  readonly result = signal<PagedResult<AdminProduct> | null>(null);
  readonly brands = signal<Brand[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly panelMode = signal<'create' | 'edit' | null>(null);

  search = '';
  page = 1;
  form: ProductForm = emptyForm();
  private editingId: string | null = null;

  ngOnInit(): void {
    this.load();
    this.api.listBrands().subscribe((b) => this.brands.set(b));
    this.api.listCategories().subscribe((c) => this.categories.set(c as Category[]));
  }

  load(): void {
    this.loading.set(true);
    const params: Record<string, string | number> = { page: this.page, limit: 20 };
    if (this.search) params['search'] = this.search;
    this.api.listProducts(params).subscribe({
      next: (r) => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.form = emptyForm();
    this.editingId = null;
    this.panelMode.set('create');
  }

  openEdit(p: AdminProduct): void {
    this.form = {
      name: p.name,
      brandId: p.brand.id,
      categoryId: p.category.id,
      gender: p.gender,
      price: p.price,
      salePrice: p.salePrice,
      thumbnailUrl: p.thumbnailUrl,
      description: p.description ?? '',
      isActive: p.isActive,
    };
    this.editingId = p.id;
    this.panelMode.set('edit');
  }

  closePanel(): void {
    this.panelMode.set(null);
  }

  save(): void {
    const dto = {
      ...this.form,
      price: Number(this.form.price),
      salePrice: this.form.salePrice ? Number(this.form.salePrice) : null,
      description: this.form.description || null,
    };

    this.saving.set(true);
    const req =
      this.panelMode() === 'edit' && this.editingId
        ? this.api.updateProduct(this.editingId, dto)
        : this.api.createProduct(dto);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.closePanel();
        this.load();
      },
      error: () => this.saving.set(false),
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
