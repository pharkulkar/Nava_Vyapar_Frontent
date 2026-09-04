import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { ApiProduct } from '../product.model';

export interface ProductViewDialogData {
  product: ApiProduct;
}

@Component({
  selector: 'nv-product-view-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatTooltipModule,
  ],
  template: `
    <div class="pvd-container">

      <!-- ── Header ── -->
      <div class="pvd-header">
        <div class="pvd-header-left">
          <div class="pvd-avatar">{{ product.name.charAt(0).toUpperCase() }}</div>
          <div>
            <h2 class="pvd-title">{{ product.name }}</h2>
            <p class="pvd-code">{{ product.productCode }}</p>
          </div>
        </div>
        <div class="pvd-actions">
          <button mat-icon-button matTooltip="Print" (click)="print()">
            <mat-icon>print</mat-icon>
          </button>
          <button mat-icon-button mat-dialog-close>
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <mat-divider />

      <!-- ── Info grid ── -->
      <div class="pvd-body">

        <!-- Row 1: category + unit -->
        <div class="info-grid">
          <div class="info-card">
            <p class="info-label"><mat-icon>category</mat-icon> Category</p>
            <p class="info-value">{{ product.category }}</p>
          </div>
          <div class="info-card">
            <p class="info-label"><mat-icon>straighten</mat-icon> Unit of Measure</p>
            <p class="info-value">{{ product.uom }}</p>
          </div>
        </div>

        <!-- Row 2: price + gst -->
        <div class="info-grid">
          <div class="info-card highlight-card">
            <p class="info-label"><mat-icon>currency_rupee</mat-icon> Price</p>
            <p class="info-value price-val">₹{{ product.price }}</p>
          </div>
          <div class="info-card">
            <p class="info-label"><mat-icon>percent</mat-icon> GST Rate</p>
            <p class="info-value">{{ product.gstRate }}%</p>
          </div>
        </div>

        <!-- Price including GST -->
        <div class="gst-banner">
          <mat-icon>receipt</mat-icon>
          <span>Price incl. GST:</span>
          <strong>₹{{ priceWithGst() }}</strong>
          <span class="gst-note">({{ product.gstRate }}% GST on ₹{{ product.price }})</span>
        </div>

      </div>

      <mat-divider />

      <!-- ── Footer ── -->
      <div class="pvd-footer">
        <button class="pvd-close-btn" type="button" mat-dialog-close>Close</button>
        <button class="pvd-edit-btn" type="button" (click)="editProduct()">
          <mat-icon>edit</mat-icon>
          <span>Edit Product</span>
        </button>
      </div>

    </div>
  `,
  styles: [`
    .pvd-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 95vw;
      max-height: 90vh;
    }

    /* ── Header ── */
    .pvd-header {
      @apply flex items-center justify-between p-6 pb-4;
    }
    .pvd-header-left { @apply flex items-center gap-4; }
    .pvd-avatar {
      @apply w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/40
             text-primary-700 dark:text-primary-300
             flex items-center justify-center text-xl font-bold shrink-0;
    }
    .pvd-title { @apply text-lg font-semibold text-gray-900 dark:text-white; }
    .pvd-code  { @apply text-sm text-gray-400 dark:text-white/40 font-mono mt-0.5; }
    .pvd-actions { @apply flex items-center gap-1 text-gray-400; }

    /* ── Body ── */
    .pvd-body {
      @apply flex flex-col gap-4 p-6;
    }

    .info-grid {
      @apply grid grid-cols-2 gap-3;
    }

    .info-card {
      @apply flex flex-col gap-2 p-4 rounded-xl
             bg-gray-50 dark:bg-white/5
             border border-gray-100 dark:border-white/10;
      &.highlight-card {
        @apply bg-primary-50 dark:bg-primary-900/20
               border-primary-100 dark:border-primary-700/30;
      }
    }

    .info-label {
      @apply flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide
             text-gray-400 dark:text-white/50;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    .info-value {
      @apply text-base font-semibold text-gray-900 dark:text-white;
      &.price-val { @apply text-2xl text-primary-600 dark:text-primary-400; }
    }

    .gst-banner {
      @apply flex items-center gap-2 px-4 py-3 rounded-xl
             bg-amber-50 dark:bg-amber-900/20
             border border-amber-100 dark:border-amber-700/30
             text-sm text-amber-800 dark:text-amber-300;
      mat-icon { font-size: 18px; @apply text-amber-500 shrink-0; }
      strong { @apply font-bold; }
      .gst-note { @apply text-xs text-amber-600 dark:text-amber-400 ml-1; }
    }

    /* ── Footer ── */
    .pvd-footer {
      @apply flex items-center justify-end gap-3 px-6 py-4;
    }

    .pvd-close-btn {
      @apply h-10 px-5 rounded-xl border border-gray-300 dark:border-white/15
             text-sm font-medium text-gray-700 dark:text-white/80
             hover:bg-gray-50 dark:hover:bg-white/5 transition-all;
    }

    .pvd-edit-btn {
      @apply flex items-center gap-2 h-10 px-6 rounded-xl
             bg-primary-600 text-white text-sm font-semibold
             shadow-lg shadow-primary-600/25
             hover:bg-primary-700 active:scale-[0.99]
             transition-all duration-200;
    }

    @media (max-width: 480px) {
      .info-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class ProductViewDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ProductViewDialogComponent>);

  protected readonly product = inject<ProductViewDialogData>(MAT_DIALOG_DATA).product;

  priceWithGst(): string {
    const price = Number(this.product.price);
    const gst   = Number(this.product.gstRate);
    if (isNaN(price) || isNaN(gst)) return this.product.price;
    return (price + (price * gst) / 100).toFixed(2);
  }

  print(): void { window.print(); }

  editProduct(): void { this.dialogRef.close('edit'); }
}
