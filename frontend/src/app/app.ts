import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WishlistService } from './core/services/wishlist.service';
import { AuthService } from './core/auth/auth.service';
import { ChatWidgetComponent } from './shared/components/chat-widget/chat-widget';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChatWidgetComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly wishlist = inject(WishlistService);
  private readonly auth = inject(AuthService);

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.wishlist.load();
      } else {
        this.wishlist.clear();
      }
    });
  }
}
