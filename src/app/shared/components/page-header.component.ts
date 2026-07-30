import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'nv-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, MatIconModule],
  template: `
    <div class="page-header">
      <div class="page-header-content">
        <div class="flex items-center gap-3">
          <mat-icon *ngIf="icon" class="text-primary-600 text-2xl">{{ icon }}</mat-icon>
          <div>
            <h1 class="page-title">{{ title }}</h1>
            <p *ngIf="subtitle" class="page-subtitle">{{ subtitle }}</p>
          </div>
        </div>
        <div class="page-actions">
          <ng-content select="[actions]" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      @apply mb-6;
    }
    .page-header-content {
      @apply flex items-center justify-between flex-wrap gap-4;
    }
    .page-title {
      @apply text-2xl font-semibold text-gray-900 dark:text-white;
    }
    .page-subtitle {
      @apply text-sm text-gray-500 dark:text-white/60 mt-0.5;
    }
    .page-actions {
      @apply flex items-center gap-2;
    }
  `],
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() icon?: string;
}
