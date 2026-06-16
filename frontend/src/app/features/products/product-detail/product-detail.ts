import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductsApiService } from '../../../core/api/products.api';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Product, ProductDetail, ProductVariant, Review } from '../../../core/models';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner';
import { PricePipe } from '../../../shared/pipes/price.pipe';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, ProductCardComponent, SpinnerComponent, PricePipe],
  templateUrl: './product-detail.html',
})
export class ProductDetailPage implements OnInit {
  private readonly api = inject(ProductsApiService);
  private readonly cart = inject(CartService);
  readonly wishlist = inject(WishlistService);
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

  readonly reviewRating = signal(5);
  readonly reviewSubmitting = signal(false);
  readonly reviewSubmitted = signal(false);
  readonly reviewError = signal<string | null>(null);
  reviewTitle = '';
  reviewBody = '';

  private productId = '';

  ngOnInit(): void {
    this.route.params.subscribe(({ id }) => {
      this.productId = id;
      this.loading.set(true);
      this.selectedVariant.set(null);
      this.api.get(id).subscribe({
        next: (p) => {
          this.product.set(p);
          this.loading.set(false);
          this.api.related(id).subscribe((r) => this.related.set(r));
          this.api.reviews(id).subscribe((r) => this.reviews.set(r.data));
        },
        error: () => void this.router.navigate(['/']),
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

  setRating(r: number): void {
    this.reviewRating.set(r);
  }

  submitReview(): void {
    if (!this.reviewBody.trim() || this.reviewBody.trim().length < 10) return;
    this.reviewSubmitting.set(true);
    this.reviewError.set(null);

    this.api
      .createReview(this.productId, {
        rating: this.reviewRating(),
        title: this.reviewTitle.trim() || null,
        body: this.reviewBody.trim(),
      })
      .subscribe({
        next: (review) => {
          this.reviews.update((list) => [review, ...list]);
          this.reviewSubmitted.set(true);
          this.reviewSubmitting.set(false);
          this.reviewTitle = '';
          this.reviewBody = '';
          this.reviewRating.set(5);
        },
        error: (e) => {
          const msg = e.status === 409
            ? 'Ya has valorado este producto'
            : e.error?.message ?? 'Error al enviar la valoración';
          this.reviewError.set(msg);
          this.reviewSubmitting.set(false);
        },
      });
  }

  get canBuy(): boolean {
    const v = this.selectedVariant();
    return !!v && v.stock > 0;
  }

  readonly stars = [1, 2, 3, 4, 5];
}
