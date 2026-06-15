import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-checkout-success',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4">
      <div class="text-center max-w-md">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 class="text-3xl font-black text-gray-900 mb-3">¡Pedido confirmado!</h1>
        <p class="text-gray-600 mb-2">
          Gracias por tu compra. Recibirás un email de confirmación en breve.
        </p>
        @if (orderId()) {
          <p class="text-sm text-gray-400 mb-8">Nº de pedido: <span class="font-mono font-medium text-gray-600">{{ orderId() }}</span></p>
        } @else {
          <div class="mb-8"></div>
        }

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a routerLink="/user/orders"
             class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Ver mis pedidos
          </a>
          <a routerLink="/products"
             class="border border-gray-200 hover:border-indigo-400 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-colors">
            Seguir comprando
          </a>
        </div>
      </div>
    </div>
  `,
})
export class CheckoutSuccessPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly orderId = signal<string | null>(null);

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.orderId.set(params['orderId'] ?? null);
    });
  }
}
