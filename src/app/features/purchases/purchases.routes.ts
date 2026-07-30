import type { Routes } from '@angular/router';
import { FeaturePlaceholderComponent } from '../../shared/components/feature-placeholder.component';

export const PURCHASES_ROUTES: Routes = [
  { path: '', component: FeaturePlaceholderComponent, data: { title: 'Purchases', icon: 'shopping_cart' } },
  { path: 'orders', component: FeaturePlaceholderComponent, data: { title: 'Purchase Orders', icon: 'inventory' } },
  { path: 'vendors', component: FeaturePlaceholderComponent, data: { title: 'Vendors', icon: 'store' } },
];
