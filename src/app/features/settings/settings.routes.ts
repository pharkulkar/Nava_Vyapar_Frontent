import type { Routes } from '@angular/router';
import { FeaturePlaceholderComponent } from '../../shared/components/feature-placeholder.component';
import { roleGuard } from '../../core/auth/guards/role.guard';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    // canActivate: [roleGuard(['owner', 'admin'])],
    component: FeaturePlaceholderComponent,
    data: { title: 'Settings', icon: 'settings' },
  },
  { path: 'profile', component: FeaturePlaceholderComponent, data: { title: 'Profile', icon: 'person' } },
];
