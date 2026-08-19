import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';
import { AppStore } from '../../core/store/app.store';

@Component({
  selector: 'nv-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NgIf, RouterLink, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-page">
      <!-- Brand panel -->
      <aside class="auth-aside">
        <div class="auth-aside-inner">
          <div class="brand">
            <div class="brand-logo">
              <mat-icon>storefront</mat-icon>
            </div>
            <span class="brand-name">Nava Vyapar</span>
          </div>

          <h2 class="aside-title">Welcome back to your business hub.</h2>
          <p class="aside-subtitle">
            Sign in to manage invoices, inventory, purchases and accounting — all in one place.
          </p>

          <ul class="aside-features">
            <li>
              <mat-icon>receipt_long</mat-icon>
              <span>Create &amp; track GST invoices in seconds</span>
            </li>
            <li>
              <mat-icon>inventory_2</mat-icon>
              <span>Keep your stock and inventory in sync</span>
            </li>
            <li>
              <mat-icon>insights</mat-icon>
              <span>Real-time insights and business reports</span>
            </li>
          </ul>

          <div class="aside-footer">Trusted by 10,000+ growing businesses</div>
        </div>
      </aside>

      <!-- Form panel -->
      <main class="auth-main">
        <div class="auth-card">
          <header class="auth-header">
            <h1 class="auth-title">Sign in</h1>
            <p class="auth-subtitle">Enter your credentials to continue</p>
          </header>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form" novalidate>
            <!-- Email -->
            <div class="field">
              <label class="field-label" for="email">Email</label>
              <div
                class="field-control"
                [class.error]="form.get('email')?.invalid && form.get('email')?.touched"
              >
                <mat-icon class="field-icon">email</mat-icon>
                <input
                  id="email"
                  class="field-input"
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                />
              </div>
              <div
                class="field-error"
                *ngIf="form.get('email')?.invalid && form.get('email')?.touched"
              >
                <span *ngIf="form.get('email')?.hasError('required')">Email is required</span>
                <span *ngIf="form.get('email')?.hasError('email')"
                  >Enter a valid email address</span
                >
              </div>
            </div>

            <!-- Password -->
            <div class="field">
              <div class="field-label-row">
                <label class="field-label" for="password">Password</label>
                <a routerLink="/auth/forgot-password" class="forgot-link">Forgot password?</a>
              </div>
              <div
                class="field-control"
                [class.error]="form.get('password')?.invalid && form.get('password')?.touched"
              >
                <mat-icon class="field-icon">lock</mat-icon>
                <input
                  id="password"
                  class="field-input"
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="field-toggle"
                  (click)="showPassword = !showPassword"
                  [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
                >
                  <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
              <div
                class="field-error"
                *ngIf="form.get('password')?.invalid && form.get('password')?.touched"
              >
                <span *ngIf="form.get('password')?.hasError('required')">Password is required</span>
                <span *ngIf="form.get('password')?.hasError('minlength')"
                  >Use at least 8 characters</span
                >
              </div>
            </div>

            <label class="remember">
              <input type="checkbox" formControlName="rememberMe" class="remember-box" />
              <span>Remember me</span>
            </label>

            <div *ngIf="store.auth().error" class="error-banner">
              <mat-icon>error_outline</mat-icon>
              {{ store.auth().error }}
            </div>

            <button
              type="submit"
              class="submit-btn"
              [disabled]="form.invalid || store.authLoading()"
            >
              <mat-spinner *ngIf="store.authLoading()" diameter="20" class="spinner" />
              <span>{{ store.authLoading() ? 'Signing in...' : 'Sign In' }}</span>
            </button>
          </form>

          <p class="auth-footer">
            Don't have an account?
            <a routerLink="/auth/signup" class="link">Create one</a>
          </p>
        </div>
      </main>
    </div>
  `,
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  protected readonly store = inject(AppStore);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected showPassword = false;

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    const { email, password, rememberMe } = this.form.getRawValue();
    this.authService.login({ email, password, rememberMe }).subscribe();
  }
}
