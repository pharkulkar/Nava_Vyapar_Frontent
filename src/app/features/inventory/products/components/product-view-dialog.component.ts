import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIf, CurrencyPipe, TitleCasePipe, NgClass } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PRODUCT_STATUS_CONFIG } from '../product.model';
import type { Product } from '../product.model';

export interface ProductViewDialogData {
  product: Product;
}

@Component({
  selector: 'nv-product-view-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgIf,
    NgClass,
    CurrencyPipe,
    TitleCasePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  template: `
    <div class="view-dialog" id="product-print-area">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-left">
          <h2 class="prod-title">{{ product.name }}</h2>
          <span class="status-badge" [ngClass]="product.status">
            <mat-icon class="status-icon">{{ statusConfig[product.status].icon }}</mat-icon>
            {{ statusConfig[product.status].label }}
          </span>
        </div>
        <div class="header-actions no-print">
          <button mat-icon-button matTooltip="Print" (click)="print()">
            <mat-icon>print</mat-icon>
          </button>
          <button mat-icon-button mat-dialog-close>
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <mat-divider />

      <!-- Product Meta -->
      <div class="product-meta">
        <div class="meta-block">
          <p class="meta-label">SKU</p>
          <p class="meta-value bold">{{ product.sku }}</p>
          <p class="meta-label" *ngIf="product.barcode">Barcode</p>
          <p class="meta-value" *ngIf="product.barcode">{{ product.barcode }}</p>
        </div>
        <div class="meta-block right">
          <div class="meta-row">
            <span class="meta-label">Category</span>
            <span class="meta-value">{{ product.category }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Unit</span>
            <span class="meta-value">{{ product.unit | titlecase }}</span>
          </div>
        </div>
      </div>

      <!-- Pricing -->
      <div class="pricing-section">
        <h3 class="section-title"><mat-icon>currency_rupee</mat-icon> Pricing & Tax</h3>
        <div class="pricing-grid">
          <div class="price-card">
            <p class="price-label">Purchase Price</p>
            <p class="price-value">{{ product.purchasePrice | currency: 'INR' : 'symbol' : '1.0-0' }}</p>
          </div>
          <div class="price-card">
            <p class="price-label">Selling Price</p>
            <p class="price-value highlight">{{ product.sellingPrice | currency: 'INR' : 'symbol' : '1.0-0' }}</p>
          </div>
          <div class="price-card">
            <p class="price-label">Tax Rate</p>
            <p class="price-value">{{ product.taxRate }}%</p>
          </div>
          <div class="price-card">
            <p class="price-label">Profit Margin</p>
            <p class="price-value" [class.positive]="margin > 0" [class.negative]="margin <= 0">
              {{ margin > 0 ? '+' : '' }}{{ margin }}%
            </p>
          </div>
        </div>
      </div>

      <!-- Stock -->
      <div class="stock-section">
        <h3 class="section-title"><mat-icon>warehouse</mat-icon> Stock Information</h3>
        <div class="stock-grid">
          <div class="stock-card">
            <p class="stock-label">Current Stock</p>
            <p class="stock-value" [ngClass]="getStockClass(product)">
              {{ product.stockQuantity }} {{ product.unit }}
            </p>
          </div>
          <div class="stock-card">
            <p class="stock-label">Low Stock Alert</p>
            <p class="stock-value">{{ product.lowStockThreshold }} {{ product.unit }}</p>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div class="desc-section" *ngIf="product.description">
        <h3 class="section-title"><mat-icon>description</mat-icon> Description</h3>
        <p class="desc-text">{{ product.description }}</p>
      </div>

      <!-- Footer Actions -->
      <div class="dialog-footer no-print">
        <button mat-stroked-button mat-dialog-close>Close</button>
        <button mat-flat-button color="primary" (click)="editProduct()">
          <mat-icon>edit</mat-icon> Edit Product
        </button>
      </div>
    </div>
  `,
  styles: [`
    .view-dialog { @apply flex flex-col w-full max-h-[90vh]; min-width: 640px; }

    .dialog-header {
      @apply flex items-start justify-between p-6 pb-4;
      .header-left { @apply flex flex-col gap-2; }
      .header-actions { @apply flex items-center gap-1; }
      .prod-title { @apply text-lg font-semibold text-gray-900 dark:text-white; }
    }

    .product-meta {
      @apply grid grid-cols-2 gap-6 px-6 py-4;
      .meta-block { @apply flex flex-col gap-1; }
      .meta-label { @apply text-xs text-gray-500 dark:text-white/60 uppercase tracking-wide; }
      .meta-value { @apply text-sm text-gray-700 dark:text-white/80; }
      .meta-value.bold { @apply font-semibold text-gray-900 dark:text-white; }
    }

    .pricing-section, .stock-section, .desc-section {
      @apply px-6 py-4;
      .section-title {
        @apply flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-white/80 uppercase tracking-wide mb-4;
        mat-icon { @apply text-base text-primary-500; font-size: 18px; }
      }
    }

    .pricing-grid {
      @apply grid grid-cols-2 sm:grid-cols-4 gap-3;
      .price-card {
        @apply p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10;
        .price-label { @apply text-xs text-gray-500 dark:text-white/60 mb-1; }
        .price-value { @apply text-lg font-bold text-gray-900 dark:text-white; }
        .price-value.highlight { @apply text-primary-600 dark:text-primary-400; }
        .price-value.positive { @apply text-green-600; }
        .price-value.negative { @apply text-red-500; }
      }
    }

    .stock-grid {
      @apply grid grid-cols-2 gap-3;
      .stock-card {
        @apply p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10;
        .stock-label { @apply text-xs text-gray-500 dark:text-white/60 mb-1; }
        .stock-value { @apply text-lg font-bold; }
      }
    }

    .desc-text { @apply text-sm text-gray-600 dark:text-white/70 leading-relaxed; }

    .dialog-footer {
      @apply flex items-center justify-end gap-3 px-6 py-4 mt-auto;
    }

    .status-badge {
      @apply inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize w-fit;
      .status-icon { @apply text-xs; font-size: 14px; width: 14px; height: 14px; }
      &.active   { @apply bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400; }
      &.inactive { @apply bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400; }
      &.draft    { @apply bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400; }
    }
  `],
})
export class ProductViewDialogComponent {
  private readonly data = inject<ProductViewDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ProductViewDialogComponent>);
  private readonly dialog = inject(MatDialog);

  protected readonly product = this.data.product;
  protected readonly statusConfig = PRODUCT_STATUS_CONFIG as Record<
    string,
    { label: string; color: string; icon: string }
  >;
  protected readonly margin = this.product.purchasePrice > 0
    ? ((this.product.sellingPrice - this.product.purchasePrice) / this.product.purchasePrice) * 100
    : 0;

  getStockClass(product: Product): string {
    if (product.stockQuantity === 0) return 'out-of-stock';
    if (product.stockQuantity <= product.lowStockThreshold) return 'low-stock';
    return 'in-stock';
  }

  print(): void {
    window.print();
  }

  editProduct(): void {
    this.dialogRef.close('edit');
  }
}
