import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/auth/auth.service';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { SpinnerComponent } from '../../shared/components/spinner/spinner';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [RouterLink, PricePipe, SpinnerComponent],
  templateUrl: './cart-page.html',
})
export class CartPage implements OnInit {
  readonly cartService = inject(CartService);
  readonly auth = inject(AuthService);

  ngOnInit(): void {
    this.cartService.load();
  }

  updateQty(itemId: string, qty: number): void {
    if (qty < 1) {
      this.removeItem(itemId);
      return;
    }
    this.cartService.updateItem(itemId, qty).subscribe(() => this.cartService.refresh());
  }

  removeItem(itemId: string): void {
    this.cartService.removeItem(itemId).subscribe(() => this.cartService.refresh());
  }

  get subtotal(): number {
    return this.cartService.cart()?.items.reduce((s, i) => {
      const price = i.variant.product.salePrice ?? i.variant.product.price;
      return s + price * i.quantity;
    }, 0) ?? 0;
  }
}
