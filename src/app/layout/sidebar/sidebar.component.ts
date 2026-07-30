import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppStore } from '../../core/store/app.store';
import { NAV_ITEMS } from './nav-items';
import type { NavItem } from './nav-items';

@Component({
  selector: 'nv-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, NgFor, NgIf, MatIconModule, MatTooltipModule],
  template: `
    <aside
      class="sidebar-container"
      [class.collapsed]="store.sidebarCollapsed()"
      [class.dark]="store.darkMode()"
    >
      <!-- Brand -->
      <div class="sidebar-brand">
        <div class="brand-icon">
          <mat-icon>storefront</mat-icon>
        </div>
        <span class="brand-name" *ngIf="!store.sidebarCollapsed()">Nava Vyapar</span>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <ng-container *ngFor="let item of navItems">
          <!-- Group item with children -->
          <div *ngIf="item.children; else leafItem" class="nav-group">
            <button
              class="nav-item nav-group-trigger"
              [matTooltip]="store.sidebarCollapsed() ? item.label : ''"
              matTooltipPosition="right"
              (click)="toggleGroup(item.label)"
            >
              <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
              <span class="nav-label" *ngIf="!store.sidebarCollapsed()">{{ item.label }}</span>
              <mat-icon class="nav-chevron" *ngIf="!store.sidebarCollapsed()">
                {{ expandedGroups().has(item.label) ? 'expand_less' : 'expand_more' }}
              </mat-icon>
            </button>
            <div class="nav-children" *ngIf="expandedGroups().has(item.label) && !store.sidebarCollapsed()">
              <a
                *ngFor="let child of item.children"
                [routerLink]="child.route"
                routerLinkActive="active"
                class="nav-item nav-child"
              >
                <mat-icon class="nav-icon">{{ child.icon }}</mat-icon>
                <span class="nav-label">{{ child.label }}</span>
              </a>
            </div>
          </div>

          <!-- Leaf item -->
          <ng-template #leafItem>
            <a
              [routerLink]="item.route"
              routerLinkActive="active"
              class="nav-item"
              [matTooltip]="store.sidebarCollapsed() ? item.label : ''"
              matTooltipPosition="right"
            >
              <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
              <span class="nav-label" *ngIf="!store.sidebarCollapsed()">{{ item.label }}</span>
            </a>
            <hr *ngIf="item.dividerAfter" class="nav-divider" />
          </ng-template>
        </ng-container>
      </nav>
    </aside>
  `,
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  protected readonly store = inject(AppStore);
  protected readonly navItems: NavItem[] = NAV_ITEMS;
  protected readonly expandedGroups = signal<Set<string>>(new Set());

  toggleGroup(label: string): void {
    this.expandedGroups.update(groups => {
      const next = new Set(groups);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }
}
