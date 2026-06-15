import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Session, SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AppUser } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
  );

  readonly session = signal<Session | null>(null);
  readonly user = signal<AppUser | null>(null);
  readonly initialized = signal(false);

  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');

  constructor() {
    this.supabase.auth.getSession().then(({ data }) => {
      this.session.set(data.session);
      if (data.session) {
        this.loadUser();
      } else {
        this.initialized.set(true);
      }
    });

    this.supabase.auth.onAuthStateChange((_, session) => {
      this.session.set(session);
      if (session) {
        this.loadUser();
      } else {
        this.user.set(null);
        this.initialized.set(true);
      }
    });
  }

  private loadUser(): void {
    this.http.get<AppUser>(`${environment.apiUrl}/auth/me`).subscribe({
      next: (u) => {
        this.user.set(u);
        this.initialized.set(true);
      },
      error: () => {
        this.initialized.set(true);
      },
    });
  }

  async getAccessToken(): Promise<string | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async signUp(email: string, password: string, firstName: string, lastName: string): Promise<void> {
    const { error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { data: { firstName, lastName } },
    });
    if (error) throw error;
  }

  async signInWithGoogle(): Promise<void> {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.router.navigate(['/']);
  }
}
