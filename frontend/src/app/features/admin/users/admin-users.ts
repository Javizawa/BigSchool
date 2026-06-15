import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../core/api/admin.api';
import { AdminUser, PagedResult } from '../../../core/models';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, PricePipe, SpinnerComponent, PaginationComponent],
  template: `
    <div>
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Usuarios</h1>

      <div class="flex gap-3 mb-6">
        <input type="search" [(ngModel)]="search" (keydown.enter)="load()" placeholder="Buscar por nombre o email..."
          class="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400" />
        <select [(ngModel)]="statusFilter" (change)="load()"
          class="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
          <option value="">Todos</option>
          <option value="active">Activos</option>
          <option value="banned">Bloqueados</option>
        </select>
      </div>

      @if (loading()) {
        <app-spinner />
      } @else if (result(); as res) {
        <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="px-5 py-3 text-left font-semibold text-gray-600">Usuario</th>
                <th class="px-5 py-3 text-center font-semibold text-gray-600">Rol</th>
                <th class="px-5 py-3 text-right font-semibold text-gray-600">Pedidos</th>
                <th class="px-5 py-3 text-right font-semibold text-gray-600">Gasto total</th>
                <th class="px-5 py-3 text-center font-semibold text-gray-600">Estado</th>
                <th class="px-5 py-3 text-right font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (u of res.data; track u.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-5 py-3">
                    <p class="font-medium text-gray-900">{{ u.firstName }} {{ u.lastName }}</p>
                    <p class="text-xs text-gray-400">{{ u.email }}</p>
                  </td>
                  <td class="px-5 py-3 text-center">
                    <span class="text-xs font-semibold px-2 py-0.5 rounded-full"
                      [class.bg-indigo-100]="u.role === 'ADMIN'" [class.text-indigo-700]="u.role === 'ADMIN'"
                      [class.bg-gray-100]="u.role !== 'ADMIN'" [class.text-gray-500]="u.role !== 'ADMIN'">
                      {{ u.role }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-right">{{ u.orderCount }}</td>
                  <td class="px-5 py-3 text-right font-medium">{{ u.totalSpent | price }}</td>
                  <td class="px-5 py-3 text-center">
                    <span class="text-xs font-semibold px-2 py-0.5 rounded-full"
                      [class.bg-green-100]="u.status === 'active'" [class.text-green-700]="u.status === 'active'"
                      [class.bg-red-100]="u.status === 'banned'" [class.text-red-700]="u.status === 'banned'">
                      {{ u.status }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-right">
                    <button (click)="toggleBan(u)" class="text-xs text-gray-500 hover:text-red-600 transition-colors">
                      {{ u.status === 'banned' ? 'Desbloquear' : 'Bloquear' }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (res.meta.pages > 1) {
          <app-pagination [page]="res.meta.page" [pages]="res.meta.pages" (pageChange)="page = $event; load()" />
        }
      }
    </div>
  `,
})
export class AdminUsersPage implements OnInit {
  private readonly api = inject(AdminApiService);
  readonly result = signal<PagedResult<AdminUser> | null>(null);
  readonly loading = signal(true);
  search = '';
  statusFilter = '';
  page = 1;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    const params: Record<string, string> = { page: String(this.page) };
    if (this.search) params['search'] = this.search;
    if (this.statusFilter) params['status'] = this.statusFilter;
    this.api.listUsers(params).subscribe({
      next: (r) => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleBan(u: AdminUser): void {
    const newStatus = u.status === 'banned' ? 'active' : 'banned';
    this.api.updateUser(u.id, { status: newStatus }).subscribe(() => this.load());
  }
}
