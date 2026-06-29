import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md">
        <div class="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Crea tu cuenta</h1>
          <p class="text-gray-500 text-sm mb-8">Únete a Love4Sneakers y empieza a comprar</p>

          @if (error()) {
            <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{{ error() }}</div>
          }
          @if (success()) {
            <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              ✓ Cuenta creada. Revisa tu email para confirmar.
            </div>
          }

          <form (ngSubmit)="submit()" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="reg-firstName" class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input id="reg-firstName" type="text" [(ngModel)]="firstName" name="firstName" required
                  class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 transition-colors" />
              </div>
              <div>
                <label for="reg-lastName" class="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                <input id="reg-lastName" type="text" [(ngModel)]="lastName" name="lastName" required
                  class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 transition-colors" />
              </div>
            </div>
            <div>
              <label for="reg-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input id="reg-email" type="email" [(ngModel)]="email" name="email" required
                class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 transition-colors" />
            </div>
            <div>
              <label for="reg-password" class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input id="reg-password" type="password" [(ngModel)]="password" name="password" required minlength="8"
                class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 transition-colors" />
              <p class="text-xs text-gray-400 mt-1">Mínimo 8 caracteres</p>
            </div>
            <button type="submit" [disabled]="loading()"
              class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors">
              {{ loading() ? 'Creando cuenta...' : 'Crear cuenta' }}
            </button>
          </form>

          <p class="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta? <a routerLink="/auth/login" class="text-indigo-600 hover:text-indigo-800 font-medium">Inicia sesión</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  firstName = '';
  lastName = '';
  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);

  async submit(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.signUp(this.email, this.password, this.firstName, this.lastName);
      this.success.set(true);
    } catch (e: unknown) {
      this.error.set((e as { message?: string }).message ?? 'Error al registrarse');
    } finally {
      this.loading.set(false);
    }
  }
}
