import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme/theme.service';
import { AppStore } from './core/store/app.store';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { LoadingService } from './core/services/loading.service';
import { NgIf } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'nv-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastContainerComponent, NgIf, MatProgressBarModule],
  template: `
    <!-- Global loading bar -->
    <mat-progress-bar
      *ngIf="loading.isLoading()"
      mode="indeterminate"
      class="global-loader"
    />
    <router-outlet />
    <nv-toast-container />
  `,
  styles: [`
    .global-loader {
      @apply fixed top-0 left-0 right-0 z-[400];
    }
  `],
})
export class AppComponent implements OnInit {
  protected readonly loading = inject(LoadingService);
  private readonly themeService = inject(ThemeService);
  private readonly store = inject(AppStore);

  ngOnInit(): void {
    this.themeService.init();
    this._listenConnectivity();
  }

  private _listenConnectivity(): void {
    window.addEventListener('online', () => this.store.setOnline(true));
    window.addEventListener('offline', () => this.store.setOnline(false));
  }
}
