import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'nv-feature-placeholder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div class="w-20 h-20 rounded-2xl bg-primary-50 flex items-center justify-center">
        <mat-icon class="text-primary-600" style="font-size: 40px; width: 40px; height: 40px;">{{ icon }}</mat-icon>
      </div>
      <h2 class="text-xl font-semibold text-gray-800 dark:text-white">{{ title }}</h2>
      <p class="text-gray-500 dark:text-white/60 max-w-sm">{{ description }}</p>
      <span class="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">Coming Soon</span>
    </div>
  `,
})
export class FeaturePlaceholderComponent {
  @Input() title = 'Module Under Development';
  @Input() description = 'This feature is being built and will be available soon.';
  @Input() icon = 'construction';
}
