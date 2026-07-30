import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { AppStore } from '../../store/app.store';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const store = inject(AppStore);
  const authService = inject(AuthService);
  const router = inject(Router);

  if (store.isAuthenticated() || authService.isTokenValid()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};

export const guestGuard: CanActivateFn = () => {
  const store = inject(AppStore);
  const router = inject(Router);

  if (store.isAuthenticated()) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
