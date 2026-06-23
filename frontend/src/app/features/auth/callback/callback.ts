import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [SpinnerComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center">
      <app-spinner />
    </div>
  `,
})
export class AuthCallbackPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly initialized$ = toObservable(this.auth.initialized);

  ngOnInit(): void {
    this.initialized$
      .pipe(filter(Boolean), take(1))
      .subscribe(() => {
        if (this.auth.isAuthenticated()) {
          this.router.navigate([this.auth.isAdmin() ? '/admin' : '/']);
        } else {
          this.router.navigate(['/auth/login']);
        }
      });
  }
}
