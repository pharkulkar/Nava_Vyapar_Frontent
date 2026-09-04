import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService } from '../product.service';
import { ToastService } from '@core/services/toast.service';
import { PRODUCT_CATEGORIES } from '../product.model';
import type { ApiProduct, ApiProductUpdateRequest } from '../product.model';

export interface BulkEditDialogData {
  products: ApiProduct[];
}

interface EditRow {
  id: number;
  name: string;
  category: string;
  price: number;
  uom: string;
  gstRate: number;
}

@Component({
  selector: 'nv-bulk-edit-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgFor, NgIf, FormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="bed-container">

      <!-- Header -->
      <div class="bed-header">
        <div class="bed-header-left">
          <div class="bed-icon"><mat-icon>edit_note</mat-icon></div>
          <div>
            <h2 class="bed-title">Bulk Edit Products</h2>
            <p class="bed-subtitle">Edit {{ rows.length }} selected product{{ rows.length > 1 ? 's' : '' }} at once</p>
          </div>
        </div>
        <button class="bed-close" type="button" (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-divider />

      <!-- Table -->
      <div class="bed-body">
        <div class="bed-table-wrap">
          <table class="bed-table">
            <thead>
              <tr>
                <th class="col-name">Name</th>
                <th class="col-cat">Category</th>
                <th class="col-price">Price (₹)</th>
                <th class="col-uom">UOM</th>
                <th class="col-gst">GST %</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of rows; let i = index">
                <td class="col-name">
                  <div class="cell-with-avatar">
                    <div class="row-avatar">{{ row.name.charAt(0).toUpperCase() }}</div>
                    <input class="bed-input" type="text" [(ngModel)]="rows[i].name"
                           placeholder="Product name" />
                  </div>
                </td>
                <td class="col-cat">
                  <div class="bed-select-wrap">
                    <select class="bed-select" [(ngModel)]="rows[i].category">
                      <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
                    </select>
                    <mat-icon class="bed-caret">expand_more</mat-icon>
                  </div>
                </td>
                <td class="col-price">
                  <input class="bed-input num-input" type="number" [(ngModel)]="rows[i].price"
                         min="0" placeholder="0.00" />
                </td>
                <td class="col-uom">
                  <input class="bed-input" type="text" [(ngModel)]="rows[i].uom"
                         placeholder="kg / pcs" />
                </td>
                <td class="col-gst">
                  <div class="bed-select-wrap">
                    <select class="bed-select" [(ngModel)]="rows[i].gstRate">
                      <option [value]="0">0%</option>
                      <option [value]="5">5%</option>
                      <option [value]="12">12%</option>
                      <option [value]="18">18%</option>
                      <option [value]="28">28%</option>
                    </select>
                    <mat-icon class="bed-caret">expand_more</mat-icon>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <mat-divider />

      <!-- Footer -->
      <div class="bed-footer">
        <button class="bed-cancel-btn" type="button" (click)="close()" [disabled]="saving()">
          Cancel
        </button>
        <button class="bed-submit-btn" type="button" (click)="save()" [disabled]="saving()">
          <mat-spinner *ngIf="saving()" diameter="18" />
          <mat-icon *ngIf="!saving()">save</mat-icon>
          <span>{{ saving() ? 'Saving...' : 'Save All Changes' }}</span>
        </button>
      </div>

    </div>
  `,
  styles: [`
    .bed-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 95vw;
      max-height: 90vh;
      min-width: 700px;
    }

    /* Header */
    .bed-header {
      @apply flex items-center justify-between p-6 pb-4;
    }
    .bed-header-left { @apply flex items-center gap-4; }
    .bed-icon {
      @apply w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30
             flex items-center justify-center shrink-0;
      mat-icon { @apply text-primary-600; }
    }
    .bed-title  { @apply text-lg font-semibold text-gray-900 dark:text-white; }
    .bed-subtitle { @apply text-sm text-gray-500 dark:text-white/60 mt-0.5; }
    .bed-close {
      @apply w-8 h-8 rounded-lg flex items-center justify-center
             text-gray-400 hover:text-gray-600 hover:bg-gray-100
             dark:hover:text-white/70 dark:hover:bg-white/10 transition-colors;
    }

    /* Body */
    .bed-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px 24px;
    }

    .bed-table-wrap { overflow-x: auto; }

    .bed-table {
      @apply w-full border-collapse text-sm;

      th {
        @apply px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide
               text-gray-500 dark:text-white/50
               border-b border-gray-200 dark:border-white/10
               bg-gray-50 dark:bg-white/5;
      }

      td {
        @apply px-3 py-2.5 border-b border-gray-100 dark:border-white/10
               align-middle;
      }

      tr:last-child td { border-bottom: none; }
    }

    .col-name  { min-width: 200px; }
    .col-cat   { min-width: 140px; }
    .col-price { min-width: 110px; }
    .col-uom   { min-width: 90px; }
    .col-gst   { min-width: 90px; }

    .cell-with-avatar {
      @apply flex items-center gap-2;
    }

    .row-avatar {
      @apply w-7 h-7 rounded-lg shrink-0
             bg-gradient-to-br from-primary-400 to-primary-600
             text-white text-xs font-bold
             flex items-center justify-center;
    }

    /* Inputs */
    .bed-input {
      @apply w-full bg-transparent px-2.5 py-2 rounded-lg text-sm
             border border-gray-200 dark:border-white/15
             text-gray-900 dark:text-white
             outline-none placeholder:text-gray-400 dark:placeholder:text-white/30
             focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20
             transition-all duration-150;
      &.num-input { @apply text-right; }
      &::-webkit-outer-spin-button, &::-webkit-inner-spin-button { -webkit-appearance: none; }
    }

    .bed-select-wrap {
      @apply relative flex items-center;
    }

    .bed-select {
      @apply w-full appearance-none bg-transparent px-2.5 py-2 pr-7 rounded-lg text-sm
             border border-gray-200 dark:border-white/15
             text-gray-900 dark:text-white
             outline-none cursor-pointer
             focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20
             transition-all duration-150;
      option { @apply bg-white dark:bg-gray-900; }
    }

    .bed-caret {
      @apply absolute right-1.5 text-gray-400 dark:text-white/40 pointer-events-none shrink-0;
      font-size: 16px; width: 16px; height: 16px;
    }

    /* Footer */
    .bed-footer {
      @apply flex items-center justify-end gap-3 px-6 py-4;
    }

    .bed-cancel-btn {
      @apply h-10 px-5 rounded-xl border border-gray-300 dark:border-white/15
             text-sm font-medium text-gray-700 dark:text-white/80
             hover:bg-gray-50 dark:hover:bg-white/5
             disabled:opacity-50 disabled:cursor-not-allowed transition-all;
    }

    .bed-submit-btn {
      @apply flex items-center gap-2 h-10 px-6 rounded-xl
             bg-primary-600 text-white text-sm font-semibold
             shadow-lg shadow-primary-600/25
             hover:bg-primary-700 active:scale-[0.99]
             disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none
             transition-all duration-200;
    }

    @media (max-width: 720px) {
      .bed-container { min-width: unset; }
    }
  `],
})
export class BulkEditDialogComponent {
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(MatDialogRef<BulkEditDialogComponent>);

  @Inject(MAT_DIALOG_DATA) readonly data: BulkEditDialogData =
    inject<BulkEditDialogData>(MAT_DIALOG_DATA);

  protected readonly categories = PRODUCT_CATEGORIES;
  protected readonly saving = signal(false);

  // Editable rows pre-filled from selected products
  protected readonly rows: EditRow[] = this.data.products.map(p => ({
    id:       p.id,
    name:     p.name,
    category: p.category,
    price:    Number(p.price),
    uom:      p.uom,
    gstRate:  Number(p.gstRate),
  }));

  save(): void {
    if (this.saving()) return;
    this.saving.set(true);

    const payload: ApiProductUpdateRequest[] = this.rows.map(r => ({
      id:       r.id,
      name:     r.name,
      category: r.category,
      price:    r.price,
      uom:      r.uom,
      gstRate:  r.gstRate,
    }));

    this.productService.updateProducts(payload).subscribe({
      next: res => {
        this.toast.success(res.displayMessage ?? res.statusMessage ?? 'Products updated successfully');
        this.dialogRef.close(true);
      },
      error: err => {
        const body = err?.error;
        if (body?.status === 'success') {
          this.toast.success(body.displayMessage ?? 'Products updated');
          this.dialogRef.close(true);
          return;
        }
        this.toast.error(body?.displayMessage ?? body?.message ?? 'Failed to update products');
        this.saving.set(false);
      },
    });
  }

  close(): void { this.dialogRef.close(); }
}
