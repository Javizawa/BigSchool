import { Component, OnInit, inject, signal, Injector, afterNextRender } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';
import { OrdersApiService } from '../../core/api/orders.api';
import { UsersApiService } from '../../core/api/users.api';
import { CartService } from '../../core/services/cart.service';
import { Address } from '../../core/models';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { SpinnerComponent } from '../../shared/components/spinner/spinner';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [FormsModule, RouterLink, PricePipe, SpinnerComponent],
  templateUrl: './checkout.html',
})
export class CheckoutPage implements OnInit {
  private readonly ordersApi = inject(OrdersApiService);
  private readonly usersApi = inject(UsersApiService);
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);
  readonly cart = inject(CartService);
  private readonly router = inject(Router);

  readonly addresses = signal<Address[]>([]);
  readonly loading = signal(true);
  readonly processing = signal(false);
  readonly error = signal<string | null>(null);
  readonly step = signal<'address' | 'payment'>('address');

  selectedAddressId = '';
  couponCode = '';
  couponError = signal<string | null>(null);
  couponApplied = signal(false);

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private orderId: string | null = null;
  private clientSecret: string | null = null;

  ngOnInit(): void {
    this.cart.load();
    this.usersApi.listAddresses().subscribe({
      next: (addrs) => {
        this.addresses.set(addrs);
        const def = addrs.find((a) => a.isDefault);
        if (def) this.selectedAddressId = def.id;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  validateCoupon(): void {
    if (!this.couponCode.trim()) return;
    this.couponError.set(null);
    this.http
      .post<{ code: string }>(`${environment.apiUrl}/coupons/validate`, {
        code: this.couponCode,
        subtotal: this.subtotal,
      })
      .subscribe({
        next: () => this.couponApplied.set(true),
        error: (e) => this.couponError.set(e.error?.message ?? 'Cupón inválido'),
      });
  }

  proceedToPayment(): void {
    if (!this.selectedAddressId) {
      this.error.set('Selecciona una dirección de envío');
      return;
    }
    this.processing.set(true);
    this.error.set(null);

    this.ordersApi
      .create({
        shippingAddressId: this.selectedAddressId,
        couponCode: this.couponApplied() ? this.couponCode : undefined,
      })
      .subscribe({
        next: (order) => {
          this.orderId = order.id;
          this.ordersApi.createPaymentIntent(order.id).subscribe({
            next: async ({ clientSecret }) => {
              this.clientSecret = clientSecret;
              // Load Stripe before showing payment step so mount is instant
              this.stripe = await loadStripe(environment.stripePublishableKey);
              this.step.set('payment');
              this.processing.set(false);
              afterNextRender(() => this.mountPaymentElement(), { injector: this.injector });
            },
            error: (e) => {
              this.error.set(e.error?.message ?? 'Error al crear el pago');
              this.processing.set(false);
            },
          });
        },
        error: (e) => {
          this.error.set(e.error?.message ?? 'Error al crear el pedido');
          this.processing.set(false);
        },
      });
  }

  private mountPaymentElement(): void {
    if (!this.stripe || !this.clientSecret) return;
    this.elements = this.stripe.elements({
      clientSecret: this.clientSecret,
      locale: 'es',
      appearance: { theme: 'stripe', variables: { colorPrimary: '#4F46E5', borderRadius: '12px' } },
    });
    this.elements.create('payment').mount('#payment-element');
  }

  async confirmPayment(): Promise<void> {
    if (!this.stripe || !this.elements) return;
    this.processing.set(true);
    this.error.set(null);

    const { error } = await this.stripe.confirmPayment({
      elements: this.elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?orderId=${this.orderId}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      this.error.set(error.message ?? 'Pago rechazado');
      this.processing.set(false);
    } else {
      this.cart.clear();
      void this.router.navigate(['/checkout/success'], { queryParams: { orderId: this.orderId } });
    }
  }

  get subtotal(): number {
    return (
      this.cart.cart()?.items.reduce((s, i) => {
        return s + (i.variant.product.salePrice ?? i.variant.product.price) * i.quantity;
      }, 0) ?? 0
    );
  }
}
