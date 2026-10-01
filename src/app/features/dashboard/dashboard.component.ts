import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card.component';
import { AppStore } from '../../core/store/app.store';
import { InvoiceService } from '../sales/invoices/invoice.service';
import { ProductCacheService } from '../../core/business/product-cache.service';
import type { ApiInvoice } from '../sales/invoices/invoice.model';
import type { ApiProduct } from '../inventory/products/product.model';

interface DashboardStat {
  label: string;
  value: string;
  icon: string;
  trend: string;
  trendPositive: boolean;
  colorClass: 'blue' | 'green' | 'orange' | 'purple';
}

interface RevenueBar {
  label: string;   // e.g. "Jan"
  amount: number;
  heightPct: number;
}

@Component({
  selector: 'nv-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgFor, NgIf, CurrencyPipe, DatePipe, RouterLink,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    PageHeaderComponent, StatCardComponent,
  ],
  template: `
    <nv-page-header
      title="Dashboard"
      subtitle="Welcome back, {{ store.currentUser()?.name ?? 'User' }}"
      icon="dashboard"
    >
      <div actions class="flex gap-2">
        <button mat-stroked-button (click)="refresh()" [disabled]="loading()">
          <mat-icon [class.spin]="loading()">refresh</mat-icon> Refresh
        </button>
        <button mat-flat-button color="primary" routerLink="/invoices/new">
          <mat-icon>add</mat-icon> New Invoice
        </button>
      </div>
    </nv-page-header>

    <!-- KPI Stats -->
    <div class="stats-grid">
      <nv-stat-card
        *ngFor="let stat of stats()"
        [label]="stat.label"
        [value]="stat.value"
        [icon]="stat.icon"
        [trend]="stat.trend"
        [trendPositive]="stat.trendPositive"
        [colorClass]="stat.colorClass"
      />
    </div>

    <!-- Charts / data -->
    <div class="charts-grid mt-6">
      <!-- Revenue Overview -->
      <div class="chart-card">
        <h3 class="chart-title">Revenue Overview <span class="chart-sub">last 6 months</span></h3>

        <div class="chart-loading" *ngIf="loading()">
          <mat-spinner diameter="28" />
        </div>

        <div class="revenue-chart" *ngIf="!loading() && revenueBars().length > 0">
          <div class="revenue-bar-col" *ngFor="let bar of revenueBars()">
            <div class="revenue-bar-wrap">
              <span class="revenue-amount" *ngIf="bar.amount > 0">
                {{ bar.amount | currency: 'INR' : 'symbol' : '1.0-0' }}
              </span>
              <div class="revenue-bar" [style.height.%]="bar.heightPct || 2"></div>
            </div>
            <span class="revenue-label">{{ bar.label }}</span>
          </div>
        </div>

        <div class="chart-empty" *ngIf="!loading() && revenueBars().length === 0">
          <mat-icon>bar_chart</mat-icon>
          <p>No revenue data yet</p>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="chart-card">
        <h3 class="chart-title">Recent Transactions</h3>

        <div class="chart-loading" *ngIf="loading()">
          <mat-spinner diameter="28" />
        </div>

        <div class="recent-list" *ngIf="!loading() && recentInvoices().length > 0">
          <a class="recent-row" *ngFor="let inv of recentInvoices()" routerLink="/invoices">
            <div class="recent-avatar">{{ (inv.customerName || '?').charAt(0).toUpperCase() }}</div>
            <div class="recent-meta">
              <p class="recent-name">{{ inv.customerName || 'Unknown' }}</p>
              <p class="recent-sub">{{ inv.billNo }} · {{ inv.date | date: 'dd MMM yyyy' }}</p>
            </div>
            <div class="recent-right">
              <span class="recent-amount">{{ asNumber(inv.totalPrice) | currency: 'INR' : 'symbol' : '1.0-0' }}</span>
              <span class="recent-status" [class]="statusClass(inv.status)">{{ inv.status }}</span>
            </div>
          </a>
        </div>

        <div class="chart-empty" *ngIf="!loading() && recentInvoices().length === 0">
          <mat-icon>receipt_long</mat-icon>
          <p>No invoices yet</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid { @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4; }
    .charts-grid { @apply grid grid-cols-1 lg:grid-cols-2 gap-4; }

    .chart-card {
      @apply bg-white dark:bg-surface-dark-elevated rounded-xl p-5 border border-gray-100 dark:border-white/10 shadow-card;
    }
    .chart-title {
      @apply flex items-baseline gap-2 text-base font-semibold text-gray-800 dark:text-white mb-4;
      .chart-sub { @apply text-xs font-normal text-gray-400; }
    }

    .chart-loading { @apply flex items-center justify-center h-48; }
    .chart-empty {
      @apply flex flex-col items-center justify-center gap-2 h-48 text-gray-400;
      mat-icon { @apply text-4xl opacity-40; font-size: 36px; width: 36px; height: 36px; }
      p { @apply text-sm; }
    }

    .spin { animation: nv-spin 0.8s linear infinite; }
    @keyframes nv-spin { to { transform: rotate(360deg); } }

    /* ── Revenue bar chart ── */
    .revenue-chart {
      @apply flex items-end justify-between gap-2 h-48 pt-6;
    }
    .revenue-bar-col {
      @apply flex flex-col items-center gap-2 flex-1 h-full justify-end;
    }
    .revenue-bar-wrap {
      @apply relative flex flex-col items-center justify-end w-full;
      height: 100%;
    }
    .revenue-amount {
      @apply absolute -top-5 text-[10px] font-semibold text-gray-500 dark:text-white/60 whitespace-nowrap;
    }
    .revenue-bar {
      @apply w-full max-w-[42px] rounded-t-lg bg-gradient-to-t from-primary-500 to-primary-400
             transition-all duration-500;
      min-height: 2px;
    }
    .revenue-label { @apply text-xs text-gray-500 dark:text-white/50 font-medium; }

    /* ── Recent transactions ── */
    .recent-list { @apply flex flex-col; }
    .recent-row {
      @apply flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-white/5
             no-underline cursor-pointer transition-colors
             hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg px-2 -mx-2;
      &:last-child { @apply border-b-0; }
    }
    .recent-avatar {
      @apply w-9 h-9 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300
             flex items-center justify-center font-bold text-sm shrink-0;
    }
    .recent-meta { @apply flex-1 min-w-0; }
    .recent-name { @apply text-sm font-medium text-gray-800 dark:text-white truncate; }
    .recent-sub { @apply text-xs text-gray-400; }
    .recent-right { @apply flex flex-col items-end gap-1; }
    .recent-amount { @apply text-sm font-semibold text-gray-900 dark:text-white; }
    .recent-status {
      @apply px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize;
      &.paid { @apply bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300; }
      &.partial { @apply bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300; }
      &.pending { @apply bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300; }
      &.cancelled { @apply bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/50; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  protected readonly store = inject(AppStore);
  private readonly invoiceService = inject(InvoiceService);
  private readonly productCache = inject(ProductCacheService);

  protected readonly loading = signal(false);
  private readonly invoices = signal<ApiInvoice[]>([]);
  private readonly products = signal<ApiProduct[]>([]);

  // ── Derived KPI cards ───────────────────────────────────────────────────────
  protected readonly stats = computed<DashboardStat[]>(() => {
    const inv = this.invoices();
    const prods = this.products();

    const totalRevenue   = inv.reduce((s, i) => s + this.asNumber(i.totalPrice), 0);
    const outstanding    = inv.reduce((s, i) => s + this.asNumber(i.balance), 0);
    const pendingCount   = inv.filter(i => this.asNumber(i.balance) > 0).length;
    const customerCount  = new Set(
      inv.map(i => (i.customerMobile || i.customerName || '').trim().toLowerCase()).filter(Boolean),
    ).size;
    const totalProducts  = prods.length;
    const outOfStock     = prods.filter(p => (p.currentStock ?? 0) <= 0).length;

    return [
      {
        label: 'Total Revenue',
        value: this.formatInr(totalRevenue),
        icon: 'currency_rupee',
        trend: `${inv.length} invoice${inv.length === 1 ? '' : 's'}`,
        trendPositive: true,
        colorClass: 'blue',
      },
      {
        label: 'Outstanding',
        value: this.formatInr(outstanding),
        icon: 'account_balance_wallet',
        trend: `${pendingCount} pending`,
        trendPositive: pendingCount === 0,
        colorClass: 'orange',
      },
      {
        label: 'Customers',
        value: String(customerCount),
        icon: 'people',
        trend: 'from invoices',
        trendPositive: true,
        colorClass: 'green',
      },
      {
        label: 'Products',
        value: String(totalProducts),
        icon: 'inventory_2',
        trend: `${outOfStock} out of stock`,
        trendPositive: outOfStock === 0,
        colorClass: 'purple',
      },
    ];
  });

  // ── Recent transactions (latest 6 by date) ──────────────────────────────────
  protected readonly recentInvoices = computed(() =>
    [...this.invoices()]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6),
  );

  // ── Monthly revenue for the last 6 months ───────────────────────────────────
  protected readonly revenueBars = computed<RevenueBar[]>(() => {
    const inv = this.invoices();
    if (inv.length === 0) return [];

    const now = new Date();
    const buckets: { key: string; label: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleString('en-US', { month: 'short' }),
        amount: 0,
      });
    }

    for (const i of inv) {
      const d = new Date(i.date);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = buckets.find(b => b.key === key);
      if (bucket) bucket.amount += this.asNumber(i.totalPrice);
    }

    const max = Math.max(...buckets.map(b => b.amount), 1);
    return buckets.map(b => ({
      label: b.label,
      amount: b.amount,
      heightPct: Math.round((b.amount / max) * 100),
    }));
  });

  ngOnInit(): void {
    this.load();
  }

  protected refresh(): void {
    this.load(true);
  }

  private load(force = false): void {
    this.loading.set(true);
    forkJoin({
      invoices: this.invoiceService
        .getInvoices({ page: 1, pageSize: 9999 })
        .pipe(catchError(() => of({ data: [] as ApiInvoice[] } as { data: ApiInvoice[] }))),
      products: this.productCache.getProducts(force).pipe(catchError(() => of([] as ApiProduct[]))),
    }).subscribe({
      next: ({ invoices, products }) => {
        this.invoices.set(invoices.data ?? []);
        this.products.set(products ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  protected asNumber(v: string | number | undefined): number {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  protected statusClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('paid') && !s.includes('partial')) return 'paid';
    if (s.includes('partial')) return 'partial';
    if (s.includes('cancel')) return 'cancelled';
    return 'pending';
  }

  private formatInr(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
