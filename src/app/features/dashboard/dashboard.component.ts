import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NgFor } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card.component';
import { AppStore } from '../../core/store/app.store';

interface DashboardStat {
  label: string;
  value: string;
  icon: string;
  trend: string;
  trendPositive: boolean;
  colorClass: 'blue' | 'green' | 'orange' | 'purple';
}

@Component({
  selector: 'nv-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgFor, MatButtonModule, MatIconModule, PageHeaderComponent, StatCardComponent],
  template: `
    <nv-page-header
      title="Dashboard"
      subtitle="Welcome back, {{ store.currentUser()?.name ?? 'User' }}"
      icon="dashboard"
    >
      <!--<div actions class="flex gap-2">
        <button mat-stroked-button>
          <mat-icon>download</mat-icon> Export
        </button>
        <button mat-flat-button color="primary">
          <mat-icon>add</mat-icon> New Invoice
        </button>
      </div>-->
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

    <!-- Placeholder for charts -->
    <div class="charts-grid mt-6">
      <div class="chart-card">
        <h3 class="chart-title">Revenue Overview</h3>
        <div class="chart-placeholder">Chart component goes here</div>
      </div>
      <div class="chart-card">
        <h3 class="chart-title">Recent Transactions</h3>
        <div class="chart-placeholder">Table component goes here</div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid {
      @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4;
    }
    .charts-grid {
      @apply grid grid-cols-1 lg:grid-cols-2 gap-4;
    }
    .chart-card {
      @apply bg-white dark:bg-surface-dark-elevated rounded-xl p-5 border border-gray-100 dark:border-white/10 shadow-card;
    }
    .chart-title {
      @apply text-base font-semibold text-gray-800 dark:text-white mb-4;
    }
    .chart-placeholder {
      @apply h-48 bg-gray-50 dark:bg-white/5 rounded-lg flex items-center justify-center
             text-sm text-gray-400 border-2 border-dashed border-gray-200 dark:border-white/10;
    }
  `],
})
export class DashboardComponent implements OnInit {
  protected readonly store = inject(AppStore);
  protected readonly stats = signal<DashboardStat[]>([]);

  ngOnInit(): void {
    this.stats.set([
      { label: 'Total Revenue', value: '₹4,82,500', icon: 'currency_rupee', trend: '+12.5% this month', trendPositive: true, colorClass: 'blue' },
      { label: 'Pending Invoices', value: '24', icon: 'receipt_long', trend: '-3 from last week', trendPositive: true, colorClass: 'orange' },
      { label: 'Total Customers', value: '1,284', icon: 'people', trend: '+48 this month', trendPositive: true, colorClass: 'green' },
      { label: 'Low Stock Items', value: '7', icon: 'inventory_2', trend: '+2 since yesterday', trendPositive: false, colorClass: 'purple' },
    ]);
  }
}
