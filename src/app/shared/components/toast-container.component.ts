import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ToastService } from '../../core/services/toast.service';

const TOAST_ICONS: Record<string, string> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

@Component({
  selector: 'nv-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgFor, NgClass, MatIconModule, MatButtonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toastService.toasts(); trackBy: trackById"
        class="toast"
        [ngClass]="toast.type"
      >
        <mat-icon class="toast-icon">{{ icons[toast.type] }}</mat-icon>
        <span class="toast-message">{{ toast.message }}</span>
        <button mat-icon-button class="toast-close" (click)="toastService.dismiss(toast.id)">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      @apply fixed bottom-4 right-4 flex flex-col gap-2 z-[300] max-w-sm w-full;
    }
    .toast {
      @apply flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium
             animate-[slideIn_0.2s_ease-out];
    }
    .toast.success { @apply bg-green-600 text-white; }
    .toast.error { @apply bg-red-600 text-white; }
    .toast.warning { @apply bg-amber-500 text-white; }
    .toast.info { @apply bg-blue-600 text-white; }
    .toast-icon { @apply text-xl shrink-0; font-size: 20px; }
    .toast-message { @apply flex-1; }
    .toast-close { @apply shrink-0 opacity-80 hover:opacity-100; }
  `],
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
  protected readonly icons = TOAST_ICONS;

  trackById(_: number, toast: { id: string }): string {
    return toast.id;
  }
}
