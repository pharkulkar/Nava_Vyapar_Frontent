import type { Routes } from '@angular/router';
import { FeaturePlaceholderComponent } from '../../shared/components/feature-placeholder.component';

export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full',
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./products/products.component').then(m => m.ProductsComponent),
  },
  {
    path: 'stock',
    component: FeaturePlaceholderComponent,
    data: { title: 'Stock Management', icon: 'inventory_2' },
  },
];
