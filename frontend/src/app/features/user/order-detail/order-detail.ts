import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrdersApiService } from '../../../core/api/orders.api';
import { Order } from '../../../core/models';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, PricePipe, SpinnerComponent],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-10">
      <a routerLink="/user/orders" class="text-sm text-indigo-600 hover:text-indigo-800 mb-6 inline-block">← Mis pedidos</a>

      @if (loading()) {
        <app-spinner />
      } @else if (order(); as o) {
        <div class="space-y-6">
          <div class="flex items-start justify-between">
            <div>
              <h1 class="text-xl font-bold text-gray-900">Pedido #{{ o.id.slice(0, 8).toUpperCase() }}</h1>
              <p class="text-sm text-gray-500">{{ o.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
            </div>
            <span class="text-sm font-semibold px-3 py-1 bg-blue-100 text-blue-700 rounded-full">{{ o.status }}</span>
          </div>

          <!-- Tracking -->
          @if (o.tracking) {
            <div class="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p class="font-semibold text-blue-800 text-sm mb-1">Seguimiento del envío</p>
              <p class="text-sm text-blue-700">{{ o.tracking.carrier }} · {{ o.tracking.trackingNumber }}</p>
              @if (o.tracking.trackingUrl) {
                <a [href]="o.tracking.trackingUrl" target="_blank" class="text-sm text-blue-600 hover:underline">Ver estado →</a>
              }
            </div>
          }

          <!-- Items -->
          <div class="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 class="font-semibold text-gray-900 mb-4">Artículos</h2>
            <div class="space-y-3">
              @for (item of o.items; track item.id) {
                <div class="flex gap-3">
                  @if (item.thumbnailUrl) {
                    <img [src]="item.thumbnailUrl" [alt]="item.productName" class="w-16 h-16 object-cover rounded-xl bg-gray-50" />
                  }
                  <div class="flex-1">
                    <p class="font-medium text-gray-900">{{ item.productName }}</p>
                    <p class="text-sm text-gray-500">T.{{ item.size }} · {{ item.color }} · x{{ item.quantity }}</p>
                  </div>
                  <span class="font-semibold text-gray-900">{{ item.subtotal | price }}</span>
                </div>
              }
            </div>
            <div class="border-t border-gray-100 mt-4 pt-4 space-y-1 text-sm">
              <div class="flex justify-between text-gray-600"><span>Subtotal</span><span>{{ o.subtotal | price }}</span></div>
              @if (o.discount > 0) {
                <div class="flex justify-between text-green-600"><span>Descuento</span><span>-{{ o.discount | price }}</span></div>
              }
              <div class="flex justify-between text-gray-600"><span>Envío</span><span>{{ o.shippingCost | price }}</span></div>
              <div class="flex justify-between font-bold text-gray-900 text-base pt-1"><span>Total</span><span>{{ o.total | price }}</span></div>
            </div>
          </div>

          <!-- Actions -->
          @if (o.status === 'delivered') {
            <button (click)="requestReturn()" [disabled]="returning()"
              class="w-full border-2 border-gray-200 hover:border-indigo-400 text-gray-700 font-medium py-3 rounded-2xl text-sm transition-colors">
              {{ returning() ? 'Procesando...' : 'Solicitar devolución' }}
            </button>
          }
          @if (o.status === 'pending_payment' || o.status === 'confirmed') {
            <button (click)="cancelOrder()" [disabled]="cancelling()"
              class="w-full border-2 border-red-200 hover:border-red-400 text-red-600 font-medium py-3 rounded-2xl text-sm transition-colors">
              {{ cancelling() ? 'Cancelando...' : 'Cancelar pedido' }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class OrderDetailPage implements OnInit {
  private readonly api = inject(OrdersApiService);
  private readonly route = inject(ActivatedRoute);

  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly returning = signal(false);
  readonly cancelling = signal(false);

  ngOnInit(): void {
    this.route.params.subscribe(({ id }) => {
      this.api.get(id).subscribe({
        next: (o) => { this.order.set(o); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    });
  }

  requestReturn(): void {
    const o = this.order();
    if (!o) return;
    this.returning.set(true);
    this.api.createReturn(o.id, 'Devolución solicitada', o.items.map((i) => ({ orderItemId: i.id, quantity: i.quantity }))).subscribe({
      next: () => { this.returning.set(false); this.reloadOrder(); },
      error: () => this.returning.set(false),
    });
  }

  cancelOrder(): void {
    const o = this.order();
    if (!o) return;
    this.cancelling.set(true);
    this.api.cancel(o.id).subscribe({
      next: (updated) => { this.order.set(updated); this.cancelling.set(false); },
      error: () => this.cancelling.set(false),
    });
  }

  private reloadOrder(): void {
    const o = this.order();
    if (!o) return;
    this.api.get(o.id).subscribe((updated) => this.order.set(updated));
  }
}
