import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { AppStore } from '../../store/app.store';
import type { UserRole } from '../models/auth.model';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn =>
  () => {
    const store = inject(AppStore);
    const router = inject(Router);
    const user = store.currentUser();

    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    return router.createUrlTree(['/unauthorized']);
  };
