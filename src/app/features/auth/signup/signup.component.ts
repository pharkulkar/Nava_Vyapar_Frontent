import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/services/auth.service';
import { AppStore } from '../../../core/store/app.store';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'nv-signup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NgIf, RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent {
  protected readonly store = inject(AppStore);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected showPassword = false;
  protected showConfirm = false;

  protected readonly form = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { firstName, lastName, phone, password } = this.form.getRawValue();
    this.authService
      .signup({ firstName, lastName, mobileNo: phone || undefined, password })
      .subscribe();
  }
}
