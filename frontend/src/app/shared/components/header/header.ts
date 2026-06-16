import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { LogoComponent } from '../logo/logo';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LogoComponent],
  templateUrl: './header.html',
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
}
