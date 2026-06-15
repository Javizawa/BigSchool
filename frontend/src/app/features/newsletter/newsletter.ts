import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-newsletter',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4">
      <div class="w-full max-w-lg text-center">

        <div class="text-5xl mb-6">📬</div>
        <h1 class="text-3xl font-black text-gray-900 mb-3">Únete al newsletter</h1>
        <p class="text-gray-500 mb-10">
          Sé el primero en enterarte de nuevas colecciones, ofertas exclusivas y drops limitados.
          Sin spam, solo lo mejor del mundo sneaker.
        </p>

        @if (success()) {
          <div class="bg-green-50 border border-green-200 rounded-2xl p-8">
            <div class="text-4xl mb-3">✓</div>
            <p class="font-semibold text-green-800 mb-1">¡Ya estás suscrito!</p>
            <p class="text-sm text-green-700">Revisa tu email para confirmar la suscripción.</p>
          </div>
        } @else {
          <form (ngSubmit)="subscribe()" class="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              placeholder="tu@email.com"
              [disabled]="loading()"
              class="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 transition-colors disabled:opacity-60"
            />
            <button
              type="submit"
              [disabled]="loading() || !email"
              class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors whitespace-nowrap">
              {{ loading() ? 'Enviando...' : 'Suscribirme' }}
            </button>
          </form>

          @if (error()) {
            <p class="mt-4 text-sm text-red-600">{{ error() }}</p>
          }

          <p class="mt-6 text-xs text-gray-400">
            Puedes darte de baja en cualquier momento. Consulta nuestra política de privacidad.
          </p>
        }
      </div>
    </div>
  `,
})
export class NewsletterPage {
  private readonly http = inject(HttpClient);

  email = '';
  readonly loading = signal(false);
  readonly success = signal(false);
  readonly error = signal<string | null>(null);

  subscribe(): void {
    if (!this.email) return;
    this.loading.set(true);
    this.error.set(null);

    this.http
      .post(`${environment.apiUrl}/newsletter/subscribe`, { email: this.email })
      .subscribe({
        next: () => {
          this.success.set(true);
          this.loading.set(false);
        },
        error: (err: { error?: { message?: string } }) => {
          const msg = err.error?.message ?? 'Error al suscribirse. Inténtalo de nuevo.';
          this.error.set(msg);
          this.loading.set(false);
        },
      });
  }
}
