import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="border-b border-gray-200 bg-white sticky top-16 z-10">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav class="flex gap-1 justify-center">
          @for (tab of tabs; track tab.path) {
            <a [routerLink]="tab.path"
               routerLinkActive="border-indigo-600 text-indigo-600"
               [routerLinkActiveOptions]="{ exact: tab.exact }"
               class="px-4 py-3 text-sm font-medium border-b-2 border-transparent -mb-px transition-colors text-gray-500 hover:text-indigo-600 hover:border-indigo-300">
              {{ tab.label }}
            </a>
          }
        </nav>
      </div>
    </div>
    <router-outlet />
  `,
})
export class UserLayoutComponent {
  readonly tabs = [
    { path: '/user/profile',   label: 'Perfil',       exact: true },
    { path: '/user/orders',    label: 'Pedidos',      exact: false },
    { path: '/user/wishlist',  label: 'Wishlist',     exact: true },
    { path: '/user/addresses', label: 'Direcciones',  exact: true },
  ];
}
