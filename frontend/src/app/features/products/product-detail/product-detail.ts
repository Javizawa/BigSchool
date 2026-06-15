import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsApiService } from '../../../core/api/products.api';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Product, ProductDetail, ProductVariant, Review } from '../../../core/models';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, ProductCardComponent, SpinnerComponent, PricePipe],
  templateUrl: './product-detail.html',
})
export class ProductDetailPage implements OnInit {
  private readonly api = inject(ProductsApiService);
  private readonly cart = inject(CartService);
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly product = signal<ProductDetail | null>(null);
  readonly related = signal<Product[]>([]);
  readonly reviews = signal<Review[]>([]);
  readonly loading = signal(true);
  readonly selectedVariant = signal<ProductVariant | null>(null);
  readonly addingToCart = signal(false);
  readonly notifySuccess = signal(false);

  ngOnInit(): void {
    this.route.params.subscribe(({ id }) => {
      this.loading.set(true);
      this.api.get(id).subscribe({
        next: (p) => {
          this.product.set(p);
          this.loading.set(false);
          this.api.related(id).subscribe((r) => this.related.set(r));
          this.api.reviews(id).subscribe((r) => this.reviews.set(r.data));
        },
        error: () => this.router.navigate(['/']),
      });
    });
  }

  selectVariant(v: ProductVariant): void {
    this.selectedVariant.set(v);
  }

  addToCart(): void {
    const v = this.selectedVariant();
    if (!v) return;
    this.addingToCart.set(true);
    this.cart.addItem(v.id).subscribe({
      next: () => {
        this.cart.refresh();
        this.addingToCart.set(false);
      },
      error: () => this.addingToCart.set(false),
    });
  }

  notifyStock(): void {
    const p = this.product();
    const v = this.selectedVariant();
    if (!p || !v) return;
    this.api.notifyStock(p.id, v.id).subscribe(() => this.notifySuccess.set(true));
  }

  get canBuy(): boolean {
    const v = this.selectedVariant();
    return !!v && v.stock > 0;
  }
}
