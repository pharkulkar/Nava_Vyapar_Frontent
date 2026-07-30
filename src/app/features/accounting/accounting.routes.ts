import type { Routes } from '@angular/router';
import { FeaturePlaceholderComponent } from '../../shared/components/feature-placeholder.component';

export const ACCOUNTING_ROUTES: Routes = [
  { path: '', component: FeaturePlaceholderComponent, data: { title: 'Accounting', icon: 'account_balance' } },
  { path: 'ledger', component: FeaturePlaceholderComponent, data: { title: 'Ledger', icon: 'menu_book' } },
  { path: 'reports', component: FeaturePlaceholderComponent, data: { title: 'Reports', icon: 'bar_chart' } },
];
