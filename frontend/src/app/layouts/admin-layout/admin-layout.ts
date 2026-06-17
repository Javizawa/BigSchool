import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LogoComponent } from '../../shared/components/logo/logo';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent],
  template: `
    <div class="min-h-screen flex bg-gray-100">
      <!-- Sidebar -->
      <aside class="w-60 bg-gray-900 text-gray-300 flex flex-col shrink-0">
        <div class="px-6 py-5 border-b border-gray-800">
          <a routerLink="/"><app-logo [admin]="true" /></a>
        </div>
        <nav class="flex-1 px-3 py-4 space-y-1 text-sm">
          @for (item of navItems; track item.path) {
            <a [routerLink]="['/admin', item.path]"
               routerLinkActive="bg-gray-800 text-white"
               class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
              <span>{{ item.icon }}</span>
              {{ item.label }}
            </a>
          }
        </nav>
        <div class="px-4 py-4 border-t border-gray-800 space-y-3">
          <p class="text-xs text-gray-500 truncate">{{ auth.user()?.email }}</p>
          <button (click)="auth.signOut()"
            class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-red-600 text-gray-300 hover:text-white text-sm font-medium transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <!-- Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 overflow-auto p-8">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
})
export class AdminLayout {
  readonly auth = inject(AuthService);

  readonly navItems = [
    { path: 'dashboard', label: 'Dashboard', icon: '📊' },
    { path: 'products', label: 'Productos', icon: '👟' },
    { path: 'orders', label: 'Pedidos', icon: '📦' },
    { path: 'returns', label: 'Devoluciones', icon: '↩️' },
    { path: 'users', label: 'Usuarios', icon: '👥' },
    { path: 'coupons', label: 'Cupones', icon: '🏷️' },
    { path: 'categories', label: 'Categorías', icon: '📂' },
    { path: 'brands', label: 'Marcas', icon: '🛡️' },
  ];
}
