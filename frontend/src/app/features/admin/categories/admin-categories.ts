import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../core/api/admin.api';
import { Category } from '../../../core/models';
import { CloudinaryUploadComponent } from '../../../shared/components/cloudinary-upload/cloudinary-upload';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner';

type AdminCategory = Category & { productCount: number };

interface CategoryForm {
  name: string;
  imageUrl: string | null;
}

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [FormsModule, SpinnerComponent, CloudinaryUploadComponent],
  templateUrl: './admin-categories.html',
})
export class AdminCategoriesPage implements OnInit {
  private readonly api = inject(AdminApiService);

  readonly items = signal<AdminCategory[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly panelMode = signal<'create' | 'edit' | null>(null);

  form: CategoryForm = { name: '', imageUrl: null };
  private editingId: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.listCategories().subscribe({
      next: (cats) => { this.items.set(cats); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.form = { name: '', imageUrl: null };
    this.editingId = null;
    this.panelMode.set('create');
  }

  openEdit(cat: AdminCategory): void {
    this.form = { name: cat.name, imageUrl: cat.imageUrl };
    this.editingId = cat.id;
    this.panelMode.set('edit');
  }

  closePanel(): void {
    this.panelMode.set(null);
  }

  save(): void {
    this.saving.set(true);
    const dto = { name: this.form.name.trim(), imageUrl: this.form.imageUrl ?? undefined };
    const req =
      this.panelMode() === 'edit' && this.editingId
        ? this.api.updateCategory(this.editingId, dto)
        : this.api.createCategory(dto);

    req.subscribe({
      next: () => { this.saving.set(false); this.closePanel(); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  delete(cat: AdminCategory): void {
    if (!confirm(`¿Eliminar categoría "${cat.name}"? Esta acción no se puede deshacer.`)) return;
    this.api.deleteCategory(cat.id).subscribe(() => this.load());
  }
}
