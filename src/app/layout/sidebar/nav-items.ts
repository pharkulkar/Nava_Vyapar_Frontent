import type { UserRole } from '../../core/auth/models/auth.model';

export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
  roles?: UserRole[];
  badge?: string;
  dividerAfter?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
  { label: 'Sales', icon: 'point_of_sale', route: '/sales', dividerAfter: false,
    children: [
      { label: 'Invoices', icon: 'receipt_long', route: '/sales/invoices' },
      { label: 'Quotations', icon: 'request_quote', route: '/sales/quotations' },
      { label: 'Customers', icon: 'people', route: '/sales/customers' },
    ],
  },
  { label: 'Purchases', icon: 'shopping_cart', route: '/purchases',
    children: [
      { label: 'Purchase Orders', icon: 'inventory', route: '/purchases/orders' },
      { label: 'Vendors', icon: 'store', route: '/purchases/vendors' },
    ],
  },
  { label: 'Inventory', icon: 'warehouse', route: '/inventory',
    children: [
      { label: 'Products', icon: 'category', route: '/inventory/products' },
      { label: 'Stock', icon: 'inventory_2', route: '/inventory/stock' },
    ],
  },
  { label: 'Accounting', icon: 'account_balance', route: '/accounting', dividerAfter: true,
    children: [
      { label: 'Ledger', icon: 'menu_book', route: '/accounting/ledger' },
      { label: 'Reports', icon: 'bar_chart', route: '/accounting/reports' },
    ],
  },
  { label: 'Settings', icon: 'settings', route: '/settings', roles: ['owner', 'admin'] },
];
