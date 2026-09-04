import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BusinessService } from '../../../core/business/business.service';
import { AppStore } from '../../../core/store/app.store';
import { AuthService } from '../../../core/auth/services/auth.service';
import type { Business } from '../../../core/auth/models/auth.model';

@Component({
  selector: 'nv-business-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgFor, NgIf, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './business-select.component.html',
  styleUrls: ['./business-select.component.scss'],
})
export class BusinessSelectComponent implements OnInit {
  private readonly businessService = inject(BusinessService);
  private readonly store = inject(AppStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly businesses = signal<Business[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly selecting = signal<number | null>(null);

  protected readonly user = this.store.currentUser;
  protected readonly currentBusiness = this.store.selectedBusiness;

  /** True when the user is switching, not doing initial selection */
  protected get isSwitching(): boolean {
    return !!this.store.selectedBusiness();
  }

  ngOnInit(): void {
    this.businessService.getBusinesses().subscribe({
      next: businesses => {
        this.businesses.set(businesses);
        this.loading.set(false);

        // Auto-select only on first login (no business chosen yet)
        if (!this.isSwitching && businesses.length === 1) {
          this.selectBusiness(businesses[0]);
        }
      },
      error: () => {
        this.error.set('Failed to load businesses. Please try again.');
        this.loading.set(false);
      },
    });
  }

  selectBusiness(business: Business): void {
    this.selecting.set(business.id);
    this.store.setSelectedBusiness(business);
    this.router.navigate(['/dashboard']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
  }
}
