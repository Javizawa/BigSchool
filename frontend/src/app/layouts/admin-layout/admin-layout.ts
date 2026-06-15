import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex bg-gray-100">
      <!-- Sidebar -->
      <aside class="w-60 bg-gray-900 text-gray-300 flex flex-col shrink-0">
        <div class="px-6 py-5 border-b border-gray-800">
          <a routerLink="/" class="text-lg font-black text-white">Big<span class="text-indigo-400">School</span></a>
          <p class="text-xs text-gray-500 mt-0.5">Panel de administración</p>
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
        <div class="px-4 py-4 border-t border-gray-800">
          <p class="text-xs text-gray-500 mb-2 truncate">{{ auth.user()?.email }}</p>
          <button (click)="auth.signOut()"
            class="text-xs text-gray-400 hover:text-white transition-colors">Cerrar sesión</button>
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
  ];
}
