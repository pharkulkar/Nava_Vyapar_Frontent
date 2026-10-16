import type { Routes } from '@angular/router';
import { FeaturePlaceholderComponent } from '../../shared/components/feature-placeholder.component';
import { ProfileComponent } from './profile.component';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    // canActivate: [roleGuard(['owner', 'admin'])],
    component: FeaturePlaceholderComponent,
    data: { title: 'Settings', icon: 'settings' },
  },
  { path: 'profile', component: ProfileComponent },
];
