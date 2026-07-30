import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'nv-unauthorized',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center p-6">
      <div class="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center">
        <mat-icon class="text-red-500" style="font-size: 40px; width: 40px; height: 40px;">lock</mat-icon>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h1>
      <p class="text-gray-500 dark:text-white/60 max-w-sm">
        You don't have permission to access this page. Contact your administrator.
      </p>
      <button mat-flat-button color="primary" routerLink="/dashboard">
        <mat-icon>home</mat-icon> Back to Dashboard
      </button>
    </div>
  `,
})
export class UnauthorizedComponent {}
