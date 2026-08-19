import type { Routes } from '@angular/router';
import { FeaturePlaceholderComponent } from '../../shared/components/feature-placeholder.component';

export const SALES_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'invoices',
    pathMatch: 'full',
  },
  {
    path: 'invoices',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./invoices/invoices.component').then(m => m.InvoicesComponent),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./invoices/components/invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./invoices/components/invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent),
      },
    ],
  },
  {
    path: 'quotations',
    component: FeaturePlaceholderComponent,
    data: { title: 'Quotations', icon: 'request_quote' },
  },
  {
    path: 'customers',
    component: FeaturePlaceholderComponent,
    data: { title: 'Customers', icon: 'people' },
  },
];
