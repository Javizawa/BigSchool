import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsersApiService } from '../../../core/api/users.api';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-10">
      <h1 class="text-2xl font-bold text-gray-900 mb-8">Mi perfil</h1>

@if (saved()) {
        <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">✓ Cambios guardados</div>
      }

      <div class="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="p-firstName" class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input id="p-firstName" type="text" [(ngModel)]="firstName" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label for="p-lastName" class="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
            <input id="p-lastName" type="text" [(ngModel)]="lastName" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
          </div>
        </div>
        <div>
          <label for="p-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input id="p-email" type="email" [value]="auth.user()?.email ?? ''" disabled class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500" />
        </div>
        <div>
          <label for="p-phone" class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input id="p-phone" type="tel" [(ngModel)]="phone" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
        </div>
        <button (click)="save()" [disabled]="saving()"
          class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
          {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </div>
  `,
})
export class ProfilePage {
  readonly auth = inject(AuthService);
  private readonly usersApi = inject(UsersApiService);

  firstName = '';
  lastName = '';
  phone = '';
  readonly saving = signal(false);
  readonly saved = signal(false);

  private populated = false;

  constructor() {
    effect(() => {
      const u = this.auth.user();
      if (u && !this.populated) {
        this.firstName = u.firstName ?? '';
        this.lastName = u.lastName ?? '';
        this.phone = u.phone ?? '';
        this.populated = true;
      }
    });
  }

  save(): void {
    this.saving.set(true);
    this.usersApi.updateMe({ firstName: this.firstName, lastName: this.lastName, phone: this.phone }).subscribe({
      next: () => {
        this.saved.set(true);
        this.saving.set(false);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: () => this.saving.set(false),
    });
  }
}
