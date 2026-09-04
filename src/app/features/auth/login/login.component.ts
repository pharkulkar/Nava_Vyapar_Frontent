import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { AppStore } from '../../../core/store/app.store';

@Component({
  selector: 'nv-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NgIf, RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  protected readonly store = inject(AppStore);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected showPassword = false;

  protected readonly form = this.fb.nonNullable.group({
    mobileNo: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.store.clearSuccessMessage();
    const { mobileNo, password, rememberMe } = this.form.getRawValue();
    this.authService.login({ mobileNo, password, rememberMe }).subscribe();
  }
}
