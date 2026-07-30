import type { Routes } from '@angular/router';
import { guestGuard } from '../../core/auth/guards/auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./login.component').then(m => m.LoginComponent),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
