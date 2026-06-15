import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { FooterComponent } from '../../shared/components/footer/footer';
import { HeaderComponent } from '../../shared/components/header/header';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-gray-50">
      <app-header />
      <main class="flex-1">
        <router-outlet />
      </main>
      <app-footer />
    </div>
  `,
})
export class MainLayout implements OnInit {
  private readonly cart = inject(CartService);

  ngOnInit(): void {
    this.cart.load();
  }
}
