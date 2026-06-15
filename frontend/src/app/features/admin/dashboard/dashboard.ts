import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminApiService } from '../../../core/api/admin.api';
import { AnalyticsSummary } from '../../../core/models';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner';

type Period = 'today' | 'week' | 'month' | 'year';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [PricePipe, SpinnerComponent],
  template: `
    <div>
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div class="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
          @for (p of periods; track p.value) {
            <button (click)="setPeriod(p.value)"
              class="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              [class.bg-indigo-600]="period() === p.value"
              [class.text-white]="period() === p.value"
              [class.text-gray-500]="period() !== p.value">
              {{ p.label }}
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <app-spinner />
      } @else if (data(); as d) {
        <!-- KPI cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="bg-white rounded-2xl border border-gray-100 p-5">
            <p class="text-sm text-gray-500 mb-1">Revenue</p>
            <p class="text-2xl font-black text-gray-900">{{ d.revenue | price }}</p>
          </div>
          <div class="bg-white rounded-2xl border border-gray-100 p-5">
            <p class="text-sm text-gray-500 mb-1">Pedidos</p>
            <p class="text-2xl font-black text-gray-900">{{ d.orders }}</p>
          </div>
          <div class="bg-white rounded-2xl border border-gray-100 p-5">
            <p class="text-sm text-gray-500 mb-1">Nuevos usuarios</p>
            <p class="text-2xl font-black text-gray-900">{{ d.newUsers }}</p>
          </div>
          <div class="bg-white rounded-2xl border border-gray-100 p-5">
            <p class="text-sm text-gray-500 mb-1">Pedidos pendientes</p>
            <p class="text-2xl font-black text-gray-900">{{ d.pendingOrders }}</p>
          </div>
        </div>

        <!-- Alerts row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          @if (d.pendingReturns > 0) {
            <div class="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p class="text-sm font-semibold text-yellow-800">⚠️ Devoluciones pendientes</p>
              <p class="text-2xl font-black text-yellow-700">{{ d.pendingReturns }}</p>
            </div>
          }
          @if (d.lowStockVariants > 0) {
            <div class="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p class="text-sm font-semibold text-red-800">🔴 Variantes con stock bajo</p>
              <p class="text-2xl font-black text-red-700">{{ d.lowStockVariants }}</p>
            </div>
          }
        </div>

        <!-- Top products -->
        @if (d.topProducts.length > 0) {
          <div class="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 class="font-bold text-gray-900 mb-4">Top productos</h2>
            <div class="space-y-3">
              @for (p of d.topProducts; track p.productSlug; let i = $index) {
                <div class="flex items-center gap-4">
                  <span class="text-lg font-black text-gray-300 w-6">{{ i + 1 }}</span>
                  <div class="flex-1">
                    <p class="font-medium text-gray-900">{{ p.productSlug }}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-semibold text-gray-900">{{ p.unitsSold }} uds.</p>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class DashboardPage implements OnInit {
  private readonly api = inject(AdminApiService);
  readonly data = signal<AnalyticsSummary | null>(null);
  readonly loading = signal(true);
  readonly period = signal<Period>('month');

  readonly periods: { value: Period; label: string }[] = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'year', label: 'Año' },
  ];

  ngOnInit(): void { this.load(); }

  setPeriod(p: Period): void { this.period.set(p); this.load(); }

  private load(): void {
    this.loading.set(true);
    this.api.analytics(this.period()).subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
