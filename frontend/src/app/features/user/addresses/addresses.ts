import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsersApiService, AddressDto } from '../../../core/api/users.api';
import { Address } from '../../../core/models';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner';

const EMPTY_FORM = (): AddressDto => ({
  label: 'Casa', fullName: '', line1: '', city: '', province: '', postalCode: '', country: 'ES',
});

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [FormsModule, SpinnerComponent],
  templateUrl: './addresses.html',
})
export class AddressesPage implements OnInit {
  private readonly api = inject(UsersApiService);
  readonly addresses = signal<Address[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  editingId = signal<string | null>(null);
  form: AddressDto = EMPTY_FORM();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.listAddresses().subscribe({
      next: (a) => { this.addresses.set(a); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openNew(): void {
    this.form = EMPTY_FORM();
    this.editingId.set(null);
    this.showForm.set(true);
  }

  openEdit(a: Address): void {
    this.form = { label: a.label, fullName: a.fullName, line1: a.line1, line2: a.line2 ?? undefined, city: a.city, province: a.province, postalCode: a.postalCode, country: a.country, phone: a.phone ?? undefined, isDefault: a.isDefault };
    this.editingId.set(a.id);
    this.showForm.set(true);
  }

  save(): void {
    this.saving.set(true);
    const id = this.editingId();
    const req = id ? this.api.updateAddress(id, this.form) : this.api.createAddress(this.form);
    req.subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  delete(id: string): void {
    if (!confirm('¿Eliminar esta dirección?')) return;
    this.api.deleteAddress(id).subscribe(() => this.load());
  }
}
