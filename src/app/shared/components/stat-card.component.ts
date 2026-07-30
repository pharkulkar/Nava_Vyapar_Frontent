import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'nv-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, NgIf, MatIconModule],
  template: `
    <div class="stat-card" [ngClass]="colorClass">
      <div class="stat-icon">
        <mat-icon>{{ icon }}</mat-icon>
      </div>
      <div class="stat-body">
        <p class="stat-label">{{ label }}</p>
        <p class="stat-value">{{ value }}</p>
        <p *ngIf="trend" class="stat-trend" [class.positive]="trendPositive">
          <mat-icon class="text-sm">{{ trendPositive ? 'trending_up' : 'trending_down' }}</mat-icon>
          {{ trend }}
        </p>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      @apply flex items-start gap-4 p-5 rounded-xl bg-white dark:bg-surface-dark-elevated
             shadow-card hover:shadow-card-hover transition-shadow duration-200 border border-gray-100 dark:border-white/10;
    }
    .stat-icon {
      @apply flex items-center justify-center w-12 h-12 rounded-xl shrink-0;
      mat-icon { @apply text-2xl; }
    }
    .stat-body { @apply flex-1 min-w-0; }
    .stat-label { @apply text-sm text-gray-500 dark:text-white/60 font-medium; }
    .stat-value { @apply text-2xl font-bold text-gray-900 dark:text-white mt-0.5; }
    .stat-trend {
      @apply flex items-center gap-0.5 text-xs mt-1 text-red-500;
      &.positive { @apply text-green-500; }
    }
    .blue .stat-icon { @apply bg-blue-50 text-blue-600; }
    .green .stat-icon { @apply bg-green-50 text-green-600; }
    .orange .stat-icon { @apply bg-orange-50 text-orange-600; }
    .purple .stat-icon { @apply bg-purple-50 text-purple-600; }
  `],
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() icon = 'analytics';
  @Input() trend?: string;
  @Input() trendPositive = true;
  @Input() colorClass: 'blue' | 'green' | 'orange' | 'purple' = 'blue';
}
