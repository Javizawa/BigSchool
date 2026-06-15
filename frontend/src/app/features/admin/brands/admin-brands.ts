import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../core/api/admin.api';
import { Brand } from '../../../core/models';
import { CloudinaryUploadComponent } from '../../../shared/components/cloudinary-upload/cloudinary-upload';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner';

interface BrandForm {
  name: string;
  logoUrl: string | null;
}

@Component({
  selector: 'app-admin-brands',
  standalone: true,
  imports: [FormsModule, SpinnerComponent, CloudinaryUploadComponent],
  templateUrl: './admin-brands.html',
})
export class AdminBrandsPage implements OnInit {
  private readonly api = inject(AdminApiService);

  readonly items = signal<Brand[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly panelMode = signal<'create' | 'edit' | null>(null);

  form: BrandForm = { name: '', logoUrl: null };
  private editingId: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.listBrands().subscribe({
      next: (brands) => { this.items.set(brands); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.form = { name: '', logoUrl: null };
    this.editingId = null;
    this.panelMode.set('create');
  }

  openEdit(brand: Brand): void {
    this.form = { name: brand.name, logoUrl: brand.logoUrl };
    this.editingId = brand.id;
    this.panelMode.set('edit');
  }

  closePanel(): void {
    this.panelMode.set(null);
  }

  save(): void {
    this.saving.set(true);
    const dto = { name: this.form.name.trim(), logoUrl: this.form.logoUrl ?? undefined };
    const req =
      this.panelMode() === 'edit' && this.editingId
        ? this.api.updateBrand(this.editingId, dto)
        : this.api.createBrand(dto);

    req.subscribe({
      next: () => { this.saving.set(false); this.closePanel(); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  delete(brand: Brand): void {
    if (!confirm(`¿Eliminar marca "${brand.name}"?`)) return;
    this.api.deleteBrand(brand.id).subscribe(() => this.load());
  }
}
