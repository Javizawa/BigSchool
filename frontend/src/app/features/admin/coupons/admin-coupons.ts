import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../core/api/admin.api';
import { AdminCoupon } from '../../../core/models';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [FormsModule, PricePipe, SpinnerComponent],
  template: `
    <div>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Cupones</h1>
        <button (click)="showForm.set(true)" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
          + Nuevo cupón
        </button>
      </div>

      @if (loading()) {
        <app-spinner />
      } @else {
        <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="px-5 py-3 text-left font-semibold text-gray-600">Código</th>
                <th class="px-5 py-3 text-left font-semibold text-gray-600">Tipo</th>
                <th class="px-5 py-3 text-right font-semibold text-gray-600">Valor</th>
                <th class="px-5 py-3 text-right font-semibold text-gray-600">Usos</th>
                <th class="px-5 py-3 text-center font-semibold text-gray-600">Estado</th>
                <th class="px-5 py-3 text-right font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (c of coupons(); track c.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-5 py-3 font-mono font-semibold text-gray-800">{{ c.code }}</td>
                  <td class="px-5 py-3 text-gray-600">{{ c.type === 'percentage' ? 'Porcentaje' : 'Fijo' }}</td>
                  <td class="px-5 py-3 text-right font-medium">
                    {{ c.type === 'percentage' ? c.value + '%' : (c.value | price) }}
                  </td>
                  <td class="px-5 py-3 text-right text-gray-600">
                    {{ c.usedCount }}{{ c.maxUses ? '/' + c.maxUses : '' }}
                  </td>
                  <td class="px-5 py-3 text-center">
                    <span class="text-xs font-semibold px-2 py-0.5 rounded-full"
                      [class.bg-green-100]="c.isActive" [class.text-green-700]="c.isActive"
                      [class.bg-gray-100]="!c.isActive" [class.text-gray-500]="!c.isActive">
                      {{ c.isActive ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-right">
                    <div class="flex justify-end gap-2">
                      <button (click)="toggle(c)" class="text-xs text-indigo-600 hover:text-indigo-800 transition-colors">
                        {{ c.isActive ? 'Desactivar' : 'Activar' }}
                      </button>
                      <button (click)="remove(c)" class="text-xs text-red-500 hover:text-red-700 transition-colors">Eliminar</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (showForm()) {
        <div class="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 class="font-bold text-gray-900 mb-4">Nuevo cupón</h2>
          <form (ngSubmit)="create()" class="grid grid-cols-2 gap-4">
            <div>
              <label for="coupon-code" class="block text-xs font-medium text-gray-600 mb-1">Código</label>
              <input id="coupon-code" type="text" [(ngModel)]="newCode" name="code" required
                class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 uppercase" />
            </div>
            <div>
              <label for="coupon-type" class="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
              <select id="coupon-type" [(ngModel)]="newType" name="type"
                class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400">
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Fijo (€)</option>
              </select>
            </div>
            <div>
              <label for="coupon-value" class="block text-xs font-medium text-gray-600 mb-1">Valor</label>
              <input id="coupon-value" type="number" [(ngModel)]="newValue" name="value" required min="0"
                class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label for="coupon-maxUses" class="block text-xs font-medium text-gray-600 mb-1">Máx. usos</label>
              <input id="coupon-maxUses" type="number" [(ngModel)]="newMaxUses" name="maxUses" min="1"
                class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div class="col-span-2 flex gap-3">
              <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                Crear
              </button>
              <button type="button" (click)="showForm.set(false)" class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-5 py-2.5 rounded-xl text-sm transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
})
export class AdminCouponsPage implements OnInit {
  private readonly api = inject(AdminApiService);
  readonly coupons = signal<AdminCoupon[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);

  newCode = '';
  newType: 'percentage' | 'fixed' = 'percentage';
  newValue = 10;
  newMaxUses: number | null = null;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.listCoupons().subscribe({
      next: (c) => { this.coupons.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  create(): void {
    this.api.createCoupon({
      code: this.newCode.toUpperCase(),
      type: this.newType,
      value: this.newValue,
      ...(this.newMaxUses && { maxUses: this.newMaxUses }),
    }).subscribe(() => { this.showForm.set(false); this.load(); });
  }

  toggle(c: AdminCoupon): void {
    this.api.updateCoupon(c.id, { isActive: !c.isActive }).subscribe(() => this.load());
  }

  remove(c: AdminCoupon): void {
    if (!confirm(`¿Eliminar cupón ${c.code}?`)) return;
    this.api.deleteCoupon(c.id).subscribe(() => this.load());
  }
}
