import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../core/api/admin.api';
import { AdminOrder, OrderStatus, PagedResult } from '../../../core/models';
import { FilterOption, FilterSelectComponent } from '../../../shared/components/filter-select/filter-select';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner';

interface AddressSnapshot {
  fullName?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

interface TrackingForm {
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Pago pendiente',
  payment_failed: 'Pago fallido',
  confirmed: 'Confirmado',
  processing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  return_requested: 'Dev. solicitada',
  return_approved: 'Dev. aprobada',
  refunded: 'Reembolsado',
};

const STATUS_CLASSES: Record<OrderStatus, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-700',
  payment_failed: 'bg-red-100 text-red-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  return_requested: 'bg-orange-100 text-orange-700',
  return_approved: 'bg-orange-200 text-orange-900',
  refunded: 'bg-teal-100 text-teal-700',
};

const ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending_payment: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['return_requested'],
  return_requested: ['return_approved', 'confirmed'],
  return_approved: ['refunded'],
};

const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { value: 'pending_payment', label: 'Pago pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'processing', label: 'En preparación' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'return_requested', label: 'Dev. solicitada' },
  { value: 'return_approved', label: 'Dev. aprobada' },
  { value: 'refunded', label: 'Reembolsado' },
];

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [FormsModule, DatePipe, PricePipe, SpinnerComponent, PaginationComponent, FilterSelectComponent],
  templateUrl: './admin-orders.html',
})
export class AdminOrdersPage implements OnInit {
  private readonly api = inject(AdminApiService);

  readonly result = signal<PagedResult<AdminOrder> | null>(null);
  readonly loading = signal(true);
  readonly selected = signal<AdminOrder | null>(null);
  readonly saving = signal(false);
  readonly statusFilter = signal<string | undefined>(undefined);
  readonly panelStatus = signal<string>('');

  readonly statusLabel = STATUS_LABEL;
  readonly statusClasses = STATUS_CLASSES;
  readonly statusFilterOptions = STATUS_FILTER_OPTIONS;

  search = '';
  page = 1;
  panelNotes = '';
  panelTracking: TrackingForm = { carrier: '', trackingNumber: '', trackingUrl: '' };

  readonly allowedStatusOptions = computed<FilterOption[]>(() => {
    const order = this.selected();
    if (!order) return [];
    return (ALLOWED_TRANSITIONS[order.status] ?? []).map((s) => ({
      value: s,
      label: STATUS_LABEL[s],
    }));
  });

  readonly showTracking = computed(
    () => this.panelStatus() === 'shipped' || !!this.selected()?.tracking,
  );

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    const params: Record<string, string> = { page: String(this.page) };
    if (this.search) params['search'] = this.search;
    const sf = this.statusFilter();
    if (sf) params['status'] = sf;
    this.api.listOrders(params).subscribe({
      next: (r) => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onFilterChange(value: string): void {
    this.statusFilter.set(value || undefined);
    this.page = 1;
    this.load();
  }

  openPanel(o: AdminOrder): void {
    this.selected.set(o);
    this.panelStatus.set('');
    this.panelNotes = o.adminNotes ?? '';
    this.panelTracking = {
      carrier: o.tracking?.carrier ?? '',
      trackingNumber: o.tracking?.trackingNumber ?? '',
      trackingUrl: o.tracking?.trackingUrl ?? '',
    };
  }

  closePanel(): void { this.selected.set(null); }

  save(): void {
    const order = this.selected();
    if (!order) return;
    this.saving.set(true);

    const dto: {
      status?: OrderStatus;
      adminNotes?: string;
      tracking?: { carrier: string; trackingNumber: string; trackingUrl?: string | null };
    } = { adminNotes: this.panelNotes };

    if (this.panelStatus()) dto.status = this.panelStatus() as OrderStatus;

    if (
      this.showTracking() &&
      this.panelTracking.carrier &&
      this.panelTracking.trackingNumber
    ) {
      dto.tracking = {
        carrier: this.panelTracking.carrier,
        trackingNumber: this.panelTracking.trackingNumber,
        trackingUrl: this.panelTracking.trackingUrl || null,
      };
    }

    this.api.updateOrder(order.id, dto).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.selected.set(updated as AdminOrder);
        this.panelStatus.set('');
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  snapshot(o: AdminOrder): AddressSnapshot {
    return (o.shippingAddressSnapshot as AddressSnapshot) ?? {};
  }
}
