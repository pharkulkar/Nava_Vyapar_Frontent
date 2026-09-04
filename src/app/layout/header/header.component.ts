import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { AppStore } from '../../core/store/app.store';
import { AuthService } from '../../core/auth/services/auth.service';
import { TauriService } from '../../core/tauri/tauri.service';

@Component({
  selector: 'nv-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, MatIconModule, MatButtonModule, MatMenuModule, MatBadgeModule, MatTooltipModule, MatDividerModule, RouterLink],
  template: `
    <header class="app-header" [class.dark]="store.darkMode()">
      <!-- Left: Sidebar toggle + breadcrumb area -->
      <div class="header-left">
        <button mat-icon-button (click)="store.toggleSidebar()" matTooltip="Toggle sidebar">
          <mat-icon>{{ store.sidebarCollapsed() ? 'menu_open' : 'menu' }}</mat-icon>
        </button>

        <!-- Business switcher chip -->
        <button
          *ngIf="store.selectedBusiness()"
          class="biz-switcher"
          (click)="switchBusiness()"
          matTooltip="Switch business"
          type="button"
        >
          <div class="biz-switcher-avatar">
            {{ store.selectedBusiness()!.name.charAt(0).toUpperCase() }}
          </div>
          <span class="biz-switcher-name">{{ store.selectedBusiness()!.name }}</span>
          <mat-icon class="biz-switcher-caret">unfold_more</mat-icon>
        </button>
      </div>

      <!-- Right: Actions -->
      <div class="header-right">
        <!-- Online indicator -->
        <div class="online-badge" [class.offline]="!store.ui().isOnline">
          <span class="dot"></span>
          <span class="label">{{ store.ui().isOnline ? 'Online' : 'Offline' }}</span>
        </div>

        <!-- Desktop indicator -->
        <span *ngIf="store.isTauriApp()" class="desktop-badge">
          <mat-icon class="text-sm">desktop_windows</mat-icon>
          Desktop
        </span>

        <!-- Theme toggle -->
        <button mat-icon-button (click)="store.toggleDarkMode()" matTooltip="Toggle theme">
          <mat-icon>{{ store.darkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>

        <!-- Notifications -->
        <button mat-icon-button matTooltip="Notifications">
          <mat-icon [matBadge]="'3'" matBadgeColor="warn" matBadgeSize="small">notifications</mat-icon>
        </button>

        <!-- User menu -->
        <button mat-button [matMenuTriggerFor]="userMenu" class="user-menu-trigger">
          <div class="user-avatar">
            {{ userInitials() }}
          </div>
          <span class="user-name">{{ store.currentUser()?.name ?? 'User' }}</span>
          <mat-icon>arrow_drop_down</mat-icon>
        </button>

        <mat-menu #userMenu="matMenu" xPosition="before">
          <button mat-menu-item routerLink="/settings/profile">
            <mat-icon>person</mat-icon> Profile
          </button>
          <button mat-menu-item routerLink="/settings">
            <mat-icon>settings</mat-icon> Settings
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon> Sign out
          </button>
        </mat-menu>
      </div>
    </header>
  `,
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  protected readonly store = inject(AppStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly tauri = inject(TauriService);

  userInitials(): string {
    const name = this.store.currentUser()?.name ?? 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  switchBusiness(): void {
    this.router.navigate(['/select-business']);
  }

  logout(): void {
    this.authService.logout();
  }
}
