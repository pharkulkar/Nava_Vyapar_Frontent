import type { Routes } from '@angular/router';
import { FeaturePlaceholderComponent } from '../../shared/components/feature-placeholder.component';

export const INVENTORY_ROUTES: Routes = [
  { path: '', component: FeaturePlaceholderComponent, data: { title: 'Inventory', icon: 'warehouse' } },
  { path: 'products', component: FeaturePlaceholderComponent, data: { title: 'Products', icon: 'category' } },
  { path: 'stock', component: FeaturePlaceholderComponent, data: { title: 'Stock', icon: 'inventory_2' } },
];
