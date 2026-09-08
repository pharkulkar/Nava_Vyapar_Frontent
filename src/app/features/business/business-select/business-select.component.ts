import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [NgFor, NgIf, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './business-select.component.html',
  styleUrls: ['./business-select.component.scss'],
})
export class BusinessSelectComponent implements OnInit {
  private readonly businessService = inject(BusinessService);
  private readonly store = inject(AppStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading    = signal(true);
  protected readonly businesses = signal<Business[]>([]);
  protected readonly error      = signal<string | null>(null);
  protected readonly selecting  = signal<number | null>(null);
  protected readonly saving     = signal(false);
  protected readonly showForm   = signal(false);

  protected readonly user            = this.store.currentUser;
  protected readonly currentBusiness = this.store.selectedBusiness;

  protected newBusiness = {
    name:          '',
    address:       '',
    gstNumber:     '',
    contactNumber: '',
  };

  protected get isSwitching(): boolean {
    return !!this.store.selectedBusiness();
  }

  ngOnInit(): void {
    this.businessService.getBusinesses().subscribe({
      next: businesses => {
        this.businesses.set(businesses);
        this.loading.set(false);

        // Auto-select on first login when only one business exists
        if (!this.isSwitching && businesses.length === 1) {
          this.selectBusiness(businesses[0]);
          return;
        }
        // No businesses → show create form immediately
        if (!this.isSwitching && businesses.length === 0) {
          this.showForm.set(true);
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

  openCreateForm(): void {
    this.newBusiness = { name: '', address: '', gstNumber: '', contactNumber: '' };
    this.error.set(null);
    this.showForm.set(true);
  }

  cancelCreate(): void {
    this.showForm.set(false);
    this.error.set(null);
  }

  createBusiness(): void {
    if (!this.newBusiness.name.trim()) {
      this.error.set('Business name is required.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);

    this.businessService.createBusiness(this.newBusiness).subscribe({
      next: res => {
        const created = res.business;
        this.businesses.update(list => [...list, created]);
        this.saving.set(false);
        this.showForm.set(false);

        const total = this.businesses().length;
        if (total === 1) {
          // Only this business exists — auto-select and proceed
          this.selectBusiness(created);
        }
        // More than one → show the list so user can choose
      },
      error: err => {
        const body = err?.error;
        this.error.set(body?.displayMessage ?? body?.message ?? 'Failed to create business.');
        this.saving.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
  }
}
