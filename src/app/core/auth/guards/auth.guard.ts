import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { AppStore } from '../../store/app.store';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const store = inject(AppStore);
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!store.isAuthenticated() && !authService.isTokenValid()) {
    return router.createUrlTree(['/auth/login']);
  }

  // Authenticated but no business selected — send to picker
  if (!store.selectedBusiness()) {
    return router.createUrlTree(['/select-business']);
  }

  return true;
};

export const guestGuard: CanActivateFn = () => {
  const store = inject(AppStore);
  const router = inject(Router);

  if (store.isAuthenticated()) {
    // If business already selected go to dashboard, otherwise to picker
    return store.selectedBusiness()
      ? router.createUrlTree(['/dashboard'])
      : router.createUrlTree(['/select-business']);
  }

  return true;
};

/** Protects /select-business — must be logged in */
export const businessSelectGuard: CanActivateFn = () => {
  const store = inject(AppStore);
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!store.isAuthenticated() && !authService.isTokenValid()) {
    return router.createUrlTree(['/auth/login']);
  }

  return true;
};
