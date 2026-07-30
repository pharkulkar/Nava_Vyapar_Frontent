import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgClass, NgIf } from '@angular/common';
import { AppStore } from '../../core/store/app.store';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'nv-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NgClass, NgIf, SidebarComponent, HeaderComponent, FooterComponent],
  template: `
    <div class="app-shell" [ngClass]="{ dark: store.darkMode(), 'sidebar-collapsed': store.sidebarCollapsed() }">
      <!-- Sidebar -->
      <nv-sidebar class="app-sidebar" />

      <!-- Mobile overlay -->
      <div
        class="sidebar-overlay"
        *ngIf="store.ui().isMobile && !store.sidebarCollapsed()"
        (click)="store.setSidebarCollapsed(true)"
      ></div>

      <!-- Main content area -->
      <div class="app-main">
        <nv-header />
        <main class="app-content">
          <router-outlet />
        </main>
        <nv-footer />
      </div>
    </div>
  `,
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent implements OnInit {
  protected readonly store = inject(AppStore);

  ngOnInit(): void {
    this._checkViewport();
  }

  @HostListener('window:resize')
  onResize(): void {
    this._checkViewport();
  }

  private _checkViewport(): void {
    this.store.setMobile(window.innerWidth < 768);
  }
}
