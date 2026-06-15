import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrdersApiService } from '../../../core/api/orders.api';
import { Order, PagedResult } from '../../../core/models';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner';

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pendiente de pago',
  payment_failed: 'Pago fallido',
  confirmed: 'Confirmado',
  processing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  return_requested: 'Devolución solicitada',
  return_approved: 'Devolución aprobada',
  refunded: 'Reembolsado',
};

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [RouterLink, DatePipe, PricePipe, SpinnerComponent, PaginationComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-10">
      <h1 class="text-2xl font-bold text-gray-900 mb-8">Mis pedidos</h1>

      @if (successOrderId()) {
        <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700">
          ✓ ¡Pedido <strong>{{ successOrderId() }}</strong> realizado con éxito! Te enviaremos un email de confirmación.
        </div>
      }

      @if (loading()) {
        <app-spinner />
      } @else if ((result()?.data?.length ?? 0) === 0) {
        <div class="text-center py-20 text-gray-500">
          <p class="text-5xl mb-4">📦</p>
          <p class="font-medium mb-4">Aún no tienes pedidos</p>
          <a routerLink="/products" class="text-indigo-600 hover:text-indigo-800 font-medium">Ir a la tienda →</a>
        </div>
      } @else {
        <div class="space-y-4">
          @for (order of result()!.data; track order.id) {
            <a [routerLink]="['/user/orders', order.id]"
               class="block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <p class="font-semibold text-gray-900">Pedido #{{ order.id.slice(0, 8).toUpperCase() }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ order.createdAt | date:'dd/MM/yyyy' }}</p>
                </div>
                <span class="text-xs font-semibold px-3 py-1 rounded-full"
                  [class]="statusClass(order.status)">
                  {{ statusLabel(order.status) }}
                </span>
              </div>
              <div class="flex gap-2 mb-3">
                @for (item of order.items.slice(0, 3); track item.id) {
                  @if (item.thumbnailUrl) {
                    <img [src]="item.thumbnailUrl" [alt]="item.productName" class="w-12 h-12 rounded-lg object-cover bg-gray-50" />
                  }
                }
                @if (order.items.length > 3) {
                  <div class="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500">+{{ order.items.length - 3 }}</div>
                }
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">{{ order.items.length }} artículo(s)</span>
                <span class="font-bold text-gray-900">{{ order.total | price }}</span>
              </div>
            </a>
          }
        </div>
        @if (result()!.meta.pages > 1) {
          <app-pagination [page]="result()!.meta.page" [pages]="result()!.meta.pages" (pageChange)="loadPage($event)" />
        }
      }
    </div>
  `,
})
export class OrdersPage implements OnInit {
  private readonly api = inject(OrdersApiService);
  private readonly route = inject(ActivatedRoute);

  readonly result = signal<PagedResult<Order> | null>(null);
  readonly loading = signal(true);
  readonly successOrderId = signal<string | null>(null);

  ngOnInit(): void {
    this.route.queryParams.subscribe((p) => {
      if (p['success']) this.successOrderId.set(p['success']);
    });
    this.loadPage(1);
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.api.list(page).subscribe({
      next: (r) => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(status: string): string { return STATUS_LABELS[status] ?? status; }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      confirmed: 'bg-blue-100 text-blue-700',
      processing: 'bg-yellow-100 text-yellow-700',
      shipped: 'bg-indigo-100 text-indigo-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      refunded: 'bg-purple-100 text-purple-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  }
}
