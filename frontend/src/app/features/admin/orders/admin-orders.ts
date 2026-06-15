import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../core/api/admin.api';
import { AdminOrder, OrderStatus, PagedResult } from '../../../core/models';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  confirmed: 'processing',
  processing: 'shipped',
  shipped: 'delivered',
};

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [FormsModule, DatePipe, PricePipe, SpinnerComponent, PaginationComponent],
  template: `
    <div>
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Pedidos</h1>

      <div class="flex gap-3 mb-6">
        <input type="search" [(ngModel)]="search" (keydown.enter)="load()" placeholder="Buscar por ID o email..."
          class="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400" />
        <select [(ngModel)]="statusFilter" (change)="load()"
          class="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400">
          <option value="">Todos los estados</option>
          <option value="confirmed">Confirmado</option>
          <option value="processing">En preparación</option>
          <option value="shipped">Enviado</option>
          <option value="delivered">Entregado</option>
          <option value="cancelled">Cancelado</option>
          <option value="return_requested">Devolución solicitada</option>
        </select>
      </div>

      @if (loading()) {
        <app-spinner />
      } @else if (result(); as res) {
        <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="px-5 py-3 text-left font-semibold text-gray-600">Pedido</th>
                <th class="px-5 py-3 text-left font-semibold text-gray-600">Cliente</th>
                <th class="px-5 py-3 text-right font-semibold text-gray-600">Total</th>
                <th class="px-5 py-3 text-center font-semibold text-gray-600">Estado</th>
                <th class="px-5 py-3 text-right font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (o of res.data; track o.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-5 py-3">
                    <p class="font-mono font-semibold text-gray-800">#{{ o.id.slice(0, 8).toUpperCase() }}</p>
                    <p class="text-xs text-gray-400">{{ o.createdAt | date:'dd/MM/yy HH:mm' }}</p>
                  </td>
                  <td class="px-5 py-3">
                    <p class="font-medium text-gray-800">{{ o.user.firstName }} {{ o.user.lastName }}</p>
                    <p class="text-xs text-gray-400">{{ o.user.email }}</p>
                  </td>
                  <td class="px-5 py-3 text-right font-semibold">{{ o.total | price }}</td>
                  <td class="px-5 py-3 text-center">
                    <span class="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">{{ o.status }}</span>
                  </td>
                  <td class="px-5 py-3 text-right">
                    @if (nextStatus(o.status)) {
                      <button (click)="advance(o)"
                        class="text-xs text-indigo-600 hover:text-indigo-800 transition-colors">
                        → {{ nextStatus(o.status) }}
                      </button>
                    }
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
export class AdminOrdersPage implements OnInit {
  private readonly api = inject(AdminApiService);
  readonly result = signal<PagedResult<AdminOrder> | null>(null);
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
    this.api.listOrders(params).subscribe({
      next: (r) => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  nextStatus(current: OrderStatus): OrderStatus | undefined {
    return NEXT_STATUS[current];
  }

  advance(o: AdminOrder): void {
    const next = this.nextStatus(o.status);
    if (!next) return;
    this.api.updateOrder(o.id, { status: next }).subscribe(() => this.load());
  }
}
