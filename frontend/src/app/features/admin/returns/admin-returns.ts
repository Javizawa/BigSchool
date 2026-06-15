import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../core/api/admin.api';
import { AdminReturn, PagedResult } from '../../../core/models';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner';

@Component({
  selector: 'app-admin-returns',
  standalone: true,
  imports: [FormsModule, DatePipe, SpinnerComponent, PaginationComponent],
  template: `
    <div>
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Devoluciones</h1>

      <div class="mb-6">
        <select [(ngModel)]="statusFilter" (change)="load()"
          class="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-400">
          <option value="">Todas</option>
          <option value="requested">Solicitadas</option>
          <option value="approved">Aprobadas</option>
          <option value="rejected">Rechazadas</option>
          <option value="completed">Completadas</option>
          <option value="refunded">Reembolsadas</option>
        </select>
      </div>

      @if (loading()) {
        <app-spinner />
      } @else if (result(); as res) {
        <div class="space-y-4">
          @for (r of res.data; track r.id) {
            <div class="bg-white rounded-2xl border border-gray-100 p-5">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <p class="font-semibold text-gray-900">Pedido #{{ r.orderId.slice(0, 8).toUpperCase() }}</p>
                  <p class="text-sm text-gray-500">{{ r.reason }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ r.createdAt | date:'dd/MM/yyyy' }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">{{ r.status }}</span>
                  @if (r.status === 'requested') {
                    <button (click)="updateStatus(r, 'approved')"
                      class="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors">Aprobar</button>
                    <button (click)="updateStatus(r, 'rejected')"
                      class="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg transition-colors">Rechazar</button>
                  }
                  @if (r.status === 'approved') {
                    <button (click)="updateStatus(r, 'completed')"
                      class="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors">Completar</button>
                  }
                  @if (r.status === 'completed') {
                    <button (click)="updateStatus(r, 'refunded')"
                      class="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-colors">Reembolsar</button>
                  }
                </div>
              </div>
              <div class="flex gap-4 text-sm text-gray-600">
                @for (item of r.items; track item.id) {
                  <span>{{ item.orderItem.productName }} × {{ item.quantity }}</span>
                }
              </div>
            </div>
          }
        </div>
        @if (res.meta.pages > 1) {
          <app-pagination [page]="res.meta.page" [pages]="res.meta.pages" (pageChange)="page = $event; load()" />
        }
      }
    </div>
  `,
})
export class AdminReturnsPage implements OnInit {
  private readonly api = inject(AdminApiService);
  readonly result = signal<PagedResult<AdminReturn> | null>(null);
  readonly loading = signal(true);
  statusFilter = 'requested';
  page = 1;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.listReturns(this.statusFilter || undefined).subscribe({
      next: (r) => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  updateStatus(r: AdminReturn, status: string): void {
    this.api.updateReturn(r.id, { status }).subscribe(() => this.load());
  }
}
