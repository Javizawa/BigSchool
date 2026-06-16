import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../core/api/admin.api';
import { AdminReturn, ReturnStatus, PagedResult } from '../../../core/models';
import { FilterOption, FilterSelectComponent } from '../../../shared/components/filter-select/filter-select';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner';

const STATUS_LABEL: Record<ReturnStatus, string> = {
  requested: 'Solicitada',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  completed: 'Completada',
  refunded: 'Reembolsada',
};

const STATUS_CLASSES: Record<ReturnStatus, string> = {
  requested: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
  refunded: 'bg-teal-100 text-teal-700',
};

const ALLOWED_TRANSITIONS: Partial<Record<ReturnStatus, ReturnStatus[]>> = {
  requested: ['approved', 'rejected'],
  approved: ['completed'],
  completed: ['refunded'],
};

const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { value: 'requested', label: 'Solicitadas' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'rejected', label: 'Rechazadas' },
  { value: 'completed', label: 'Completadas' },
  { value: 'refunded', label: 'Reembolsadas' },
];

@Component({
  selector: 'app-admin-returns',
  standalone: true,
  imports: [FormsModule, DatePipe, PricePipe, SpinnerComponent, PaginationComponent, FilterSelectComponent],
  templateUrl: './admin-returns.html',
})
export class AdminReturnsPage implements OnInit {
  private readonly api = inject(AdminApiService);

  readonly result = signal<PagedResult<AdminReturn> | null>(null);
  readonly loading = signal(true);
  readonly selected = signal<AdminReturn | null>(null);
  readonly saving = signal(false);
  readonly statusFilter = signal<string | undefined>('requested');
  readonly panelStatus = signal<string>('');

  readonly statusLabel = STATUS_LABEL;
  readonly statusClasses = STATUS_CLASSES;
  readonly statusFilterOptions = STATUS_FILTER_OPTIONS;

  page = 1;
  panelNotes = '';
  panelRefundAmount: number | null = null;

  readonly allowedStatusOptions = computed<FilterOption[]>(() => {
    const ret = this.selected();
    if (!ret) return [];
    return (ALLOWED_TRANSITIONS[ret.status] ?? []).map((s) => ({
      value: s,
      label: STATUS_LABEL[s],
    }));
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    const sf = this.statusFilter();
    this.api.listReturns(sf).subscribe({
      next: (r) => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onFilterChange(value: string): void {
    this.statusFilter.set(value || undefined);
    this.page = 1;
    this.load();
  }

  openPanel(r: AdminReturn): void {
    this.selected.set(r);
    this.panelStatus.set('');
    this.panelNotes = r.adminNotes ?? '';
    this.panelRefundAmount = r.refundAmount;
  }

  closePanel(): void { this.selected.set(null); }

  save(): void {
    const ret = this.selected();
    if (!ret || !this.panelStatus()) return;
    this.saving.set(true);

    this.api.updateReturn(ret.id, {
      status: this.panelStatus(),
      adminNotes: this.panelNotes,
      refundAmount: this.panelRefundAmount,
    }).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.selected.set(updated);
        this.panelStatus.set('');
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }
}
