import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppStore } from '../../core/store/app.store';

interface DetailRow {
  icon: string;
  label: string;
  value: string;
}

@Component({
  selector: 'nv-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgFor, MatIconModule, MatButtonModule, PageHeaderComponent],
  template: `
    <nv-page-header title="Profile" subtitle="Your business and account details" icon="person" />

    <ng-container *ngIf="business() as biz; else noBusiness">
      <!-- Business summary card -->
      <div class="profile-card">
        <div class="profile-banner">
          <div class="profile-avatar">{{ initials() }}</div>
          <div class="profile-heading">
            <h2 class="profile-name">{{ biz.name }}</h2>
            <p class="profile-tag" *ngIf="userRole()">
              <mat-icon>badge</mat-icon> {{ userRole() }}
            </p>
          </div>
        </div>

        <!-- Business details -->
        <div class="detail-section">
          <p class="section-label"><mat-icon>store</mat-icon> Business Details</p>
          <div class="detail-grid">
            <div class="detail-row" *ngFor="let row of businessRows()">
              <div class="detail-icon"><mat-icon>{{ row.icon }}</mat-icon></div>
              <div class="detail-meta">
                <p class="detail-label">{{ row.label }}</p>
                <p class="detail-value">{{ row.value || '—' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact / account details -->
        <div class="detail-section">
          <p class="section-label"><mat-icon>contact_phone</mat-icon> Contact Details</p>
          <div class="detail-grid">
            <div class="detail-row" *ngFor="let row of contactRows()">
              <div class="detail-icon"><mat-icon>{{ row.icon }}</mat-icon></div>
              <div class="detail-meta">
                <p class="detail-label">{{ row.label }}</p>
                <p class="detail-value">{{ row.value || '—' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ng-container>

    <ng-template #noBusiness>
      <div class="empty-state">
        <div class="empty-illustration"><mat-icon>store</mat-icon></div>
        <h3>No business selected</h3>
        <p>Select or create a business to see its profile details here.</p>
      </div>
    </ng-template>
  `,
  styles: [`
    :host { display: block; }

    .profile-card {
      @apply bg-white dark:bg-surface-dark-elevated rounded-2xl border border-gray-100 dark:border-white/10
             shadow-card overflow-hidden max-w-3xl;
    }

    /* Banner */
    .profile-banner {
      @apply flex items-center gap-4 p-6
             bg-gradient-to-r from-primary-600 to-primary-500 text-white;
    }
    .profile-avatar {
      @apply w-16 h-16 rounded-2xl bg-white/20 backdrop-blur
             flex items-center justify-center text-2xl font-bold shrink-0;
    }
    .profile-heading { @apply min-w-0; }
    .profile-name { @apply text-xl font-bold truncate; }
    .profile-tag {
      @apply flex items-center gap-1 text-sm text-white/85 mt-1 capitalize;
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
    }

    /* Detail sections */
    .detail-section {
      @apply p-6 border-t border-gray-100 dark:border-white/10;
      &:first-of-type { border-top: none; }
    }
    .section-label {
      @apply flex items-center gap-2 text-xs font-semibold uppercase tracking-wider
             text-gray-500 dark:text-white/50 mb-4;
      mat-icon { font-size: 16px; width: 16px; height: 16px; @apply text-primary-500; }
    }
    .detail-grid { @apply grid grid-cols-1 sm:grid-cols-2 gap-4; }

    .detail-row { @apply flex items-start gap-3; }
    .detail-icon {
      @apply w-9 h-9 rounded-lg bg-gray-50 dark:bg-white/5
             flex items-center justify-center shrink-0;
      mat-icon { @apply text-gray-400 dark:text-white/40; font-size: 18px; width: 18px; height: 18px; }
    }
    .detail-meta { @apply min-w-0; }
    .detail-label { @apply text-xs text-gray-400 dark:text-white/40 font-medium; }
    .detail-value { @apply text-sm font-medium text-gray-800 dark:text-white break-words; }

    /* Empty */
    .empty-state {
      @apply flex flex-col items-center justify-center gap-2 py-16 text-center;
      .empty-illustration {
        @apply w-20 h-20 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-2;
        mat-icon { font-size: 38px; width: 38px; height: 38px; @apply text-gray-300 dark:text-white/20; }
      }
      h3 { @apply text-lg font-semibold text-gray-800 dark:text-white; }
      p { @apply text-sm text-gray-500 dark:text-white/60 max-w-xs; }
    }
  `],
})
export class ProfileComponent {
  private readonly store = inject(AppStore);

  protected readonly business = computed(() => this.store.selectedBusiness());
  protected readonly user = computed(() => this.store.currentUser());
  protected readonly userRole = computed(() => this.user()?.role ?? '');

  protected readonly initials = computed(() => {
    const name = this.business()?.name?.trim() ?? '';
    if (!name) return '?';
    const parts = name.split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  });

  protected readonly businessRows = computed<DetailRow[]>(() => {
    const biz = this.business();
    if (!biz) return [];
    return [
      { icon: 'store', label: 'Business Name', value: biz.name },
      { icon: 'receipt_long', label: 'GST Number', value: biz.gstNumber },
      { icon: 'location_on', label: 'Address', value: biz.address },
    ];
  });

  protected readonly contactRows = computed<DetailRow[]>(() => {
    const biz = this.business();
    const user = this.user();
    if (!biz) return [];
    return [
      { icon: 'phone', label: 'Contact Number', value: biz.contactNumber },
      { icon: 'person', label: 'Account Holder', value: user?.name ?? '' },
    ];
  });
}
