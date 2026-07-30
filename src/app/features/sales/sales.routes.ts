import type { Routes } from '@angular/router';
import { FeaturePlaceholderComponent } from '../../shared/components/feature-placeholder.component';

export const SALES_ROUTES: Routes = [
  {
    path: '',
    component: FeaturePlaceholderComponent,
    data: { title: 'Sales', description: 'Manage invoices, quotations and customers.', icon: 'point_of_sale' },
  },
  { path: 'invoices', component: FeaturePlaceholderComponent, data: { title: 'Invoices', icon: 'receipt_long' } },
  { path: 'quotations', component: FeaturePlaceholderComponent, data: { title: 'Quotations', icon: 'request_quote' } },
  { path: 'customers', component: FeaturePlaceholderComponent, data: { title: 'Customers', icon: 'people' } },
];
