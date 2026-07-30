import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';
import { AppStore } from '../../core/store/app.store';

@Component({
  selector: 'nv-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, NgIf, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatCheckboxModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="login-page">
      <div class="login-card">
        <!-- Brand -->
        <div class="login-brand">
          <div class="brand-logo">
            <mat-icon>storefront</mat-icon>
          </div>
          <h1 class="brand-title">Nava Vyapar</h1>
          <p class="brand-subtitle">Enterprise Business Management</p>
        </div>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" placeholder="you@company.com" />
            <mat-icon matPrefix>email</mat-icon>
            <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
            <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPassword ? 'text' : 'password'" formControlName="password" />
            <mat-icon matPrefix>lock</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="showPassword = !showPassword">
              <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="form.get('password')?.hasError('required')">Password is required</mat-error>
          </mat-form-field>

          <div class="flex items-center justify-between">
            <mat-checkbox formControlName="rememberMe" color="primary">Remember me</mat-checkbox>
            <a routerLink="/auth/forgot-password" class="text-sm text-primary-600 hover:underline">
              Forgot password?
            </a>
          </div>

          <div *ngIf="store.auth().error" class="error-banner">
            <mat-icon>error_outline</mat-icon>
            {{ store.auth().error }}
          </div>

          <button
            mat-flat-button
            color="primary"
            type="submit"
            class="w-full h-11"
            [disabled]="form.invalid || store.authLoading()"
          >
            <mat-spinner *ngIf="store.authLoading()" diameter="20" class="mr-2" />
            {{ store.authLoading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>
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
