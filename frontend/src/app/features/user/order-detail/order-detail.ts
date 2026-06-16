import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrdersApiService } from '../../../core/api/orders.api';
import { Order, OrderItem } from '../../../core/models';

const RETURN_STATUS_LABEL: Record<string, string> = {
  requested: 'Solicitud recibida',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  completed: 'Completada',
  refunded: 'Reembolsada',
};
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner';

interface ReturnItem {
  orderItemId: string;
  productName: string;
  size: number;
  color: string;
  thumbnailUrl: string | null;
  maxQuantity: number;
  quantity: number;
  selected: boolean;
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Pago pendiente',
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

const ORDER_STATUS_CLASSES: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-700',
  payment_failed: 'bg-red-100 text-red-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  return_requested: 'bg-amber-100 text-amber-700',
  return_approved: 'bg-orange-100 text-orange-700',
  refunded: 'bg-teal-100 text-teal-700',
};

const RETURN_REASONS = [
  'Cambio de opinión',
  'Talla incorrecta',
  'Producto defectuoso',
  'No coincide con la descripción',
  'Recibí un producto equivocado',
  'Otro',
];

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, PricePipe, SpinnerComponent],
  templateUrl: './order-detail.html',
})
export class OrderDetailPage implements OnInit {
  private readonly api = inject(OrdersApiService);
  private readonly route = inject(ActivatedRoute);

  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly cancelling = signal(false);

  readonly returnPanelOpen = signal(false);
  readonly returnItems = signal<ReturnItem[]>([]);
  readonly returnSubmitting = signal(false);
  readonly returnSuccess = signal(false);
  readonly returnError = signal<string | null>(null);
  returnReason = '';

  readonly reasons = RETURN_REASONS;
  readonly statusLabel = ORDER_STATUS_LABEL;
  readonly statusClasses = ORDER_STATUS_CLASSES;
  readonly returnStatusLabel = RETURN_STATUS_LABEL;

  ngOnInit(): void {
    this.route.params.subscribe(({ id }) => {
      this.api.get(id).subscribe({
        next: (o) => { this.order.set(o); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    });
  }

  openReturnPanel(): void {
    const o = this.order();
    if (!o) return;
    this.returnItems.set(
      o.items.map((i: OrderItem) => ({
        orderItemId: i.id,
        productName: i.productName,
        size: i.size,
        color: i.color,
        thumbnailUrl: i.thumbnailUrl,
        maxQuantity: i.quantity,
        quantity: i.quantity,
        selected: true,
      })),
    );
    this.returnReason = '';
    this.returnError.set(null);
    this.returnSuccess.set(false);
    this.returnPanelOpen.set(true);
  }

  closeReturnPanel(): void {
    this.returnPanelOpen.set(false);
  }

  toggleItem(item: ReturnItem): void {
    item.selected = !item.selected;
    this.returnItems.update((list) => [...list]);
  }

  clampQuantity(item: ReturnItem): void {
    if (item.quantity < 1) item.quantity = 1;
    if (item.quantity > item.maxQuantity) item.quantity = item.maxQuantity;
    this.returnItems.update((list) => [...list]);
  }

  get selectedCount(): number {
    return this.returnItems().filter((i) => i.selected).length;
  }

  submitReturn(): void {
    const o = this.order();
    const selected = this.returnItems().filter((i) => i.selected);
    if (!o || selected.length === 0 || !this.returnReason) return;

    this.returnSubmitting.set(true);
    this.returnError.set(null);

    this.api
      .createReturn(
        o.id,
        this.returnReason,
        selected.map((i) => ({ orderItemId: i.orderItemId, quantity: i.quantity })),
      )
      .subscribe({
        next: () => {
          this.returnSubmitting.set(false);
          this.returnSuccess.set(true);
          this.returnPanelOpen.set(false);
          this.reloadOrder();
        },
        error: (e) => {
          this.returnError.set(e.error?.message ?? 'Error al solicitar la devolución');
          this.returnSubmitting.set(false);
        },
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
