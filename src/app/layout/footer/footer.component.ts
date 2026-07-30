import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AppStore } from '../../core/store/app.store';

@Component({
  selector: 'nv-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="app-footer" [class.dark]="store.darkMode()">
      <span class="text-xs text-gray-400">
        &copy; {{ year }} Nava Vyapar &mdash; v{{ version }}
      </span>
    </footer>
  `,
  styles: [`
    .app-footer {
      @apply flex items-center justify-center h-10 border-t border-gray-100 bg-white;
      &.dark { @apply bg-surface-dark border-white/10; }
    }
  `],
})
export class FooterComponent {
  protected readonly store = inject(AppStore);
  readonly year = new Date().getFullYear();
  readonly version = '0.1.0';
}
