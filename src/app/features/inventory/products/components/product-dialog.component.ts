import {
  ChangeDetectionStrategy, Component, Inject, OnInit, inject, signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf, DecimalPipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { ProductService } from '../product.service';
import { ToastService } from '@core/services/toast.service';
import {
  PRODUCT_UNITS, PRODUCT_CATEGORIES, TAX_RATES,
} from '../product.model';
import type { Product, CreateProductRequest } from '../product.model';

export interface ProductDialogData {
  product?: Product;
}

@Component({
  selector: 'nv-product-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, NgFor, NgIf, DecimalPipe,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatDividerModule, MatChipsModule,
  ],
  template: `
    <div class="dialog-container">
      <!-- Header -->
      <div class="dialog-header">
        <div class="flex items-center gap-3">
          <div class="header-icon">
            <mat-icon>{{ isEdit ? 'edit' : 'add_box' }}</mat-icon>
          </div>
          <div>
            <h2 class="dialog-title">{{ isEdit ? 'Edit Product' : 'Add New Product' }}</h2>
            <p class="dialog-subtitle">{{ isEdit ? 'Update product details' : 'Fill in the details to add a product to your inventory' }}</p>
          </div>
        </div>
        <button mat-icon-button (click)="close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-divider />

      <!-- Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="dialog-body">

        <!-- Section: Basic Info -->
        <div class="form-section">
          <h3 class="section-title">
            <mat-icon>info</mat-icon> Basic Information
          </h3>
          <div class="form-grid-2">
            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Product Name</mat-label>
              <input matInput formControlName="name" placeholder="e.g. Wireless Keyboard" />
              <mat-icon matPrefix>inventory_2</mat-icon>
              <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required</mat-error>
              <mat-error *ngIf="form.get('name')?.hasError('maxlength')">Max 100 characters</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>SKU</mat-label>
              <input matInput formControlName="sku" placeholder="e.g. EL-WK-001" />
              <mat-icon matPrefix>qr_code</mat-icon>
              <mat-error *ngIf="form.get('sku')?.hasError('required')">SKU is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Barcode (optional)</mat-label>
              <input matInput formControlName="barcode" placeholder="e.g. 8901234567890" />
              <mat-icon matPrefix>barcode_reader</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select formControlName="category">
                <mat-option *ngFor="let cat of categories" [value]="cat">{{ cat }}</mat-option>
              </mat-select>
              <mat-icon matPrefix>category</mat-icon>
              <mat-error *ngIf="form.get('category')?.hasError('required')">Category is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Unit of Measure</mat-label>
              <mat-select formControlName="unit">
                <mat-option *ngFor="let u of units" [value]="u.value">{{ u.label }}</mat-option>
              </mat-select>
              <mat-icon matPrefix>straighten</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Description (optional)</mat-label>
              <textarea matInput formControlName="description" rows="2" placeholder="Brief product description..."></textarea>
            </mat-form-field>
          </div>
        </div>

        <mat-divider />

        <!-- Section: Pricing -->
        <div class="form-section">
          <h3 class="section-title">
            <mat-icon>currency_rupee</mat-icon> Pricing & Tax
          </h3>
          <div class="form-grid-3">
            <mat-form-field appearance="outline">
              <mat-label>Purchase Price (₹)</mat-label>
              <input matInput type="number" formControlName="purchasePrice" min="0" placeholder="0.00" />
              <span matPrefix class="prefix-text">₹</span>
              <mat-error *ngIf="form.get('purchasePrice')?.hasError('required')">Required</mat-error>
              <mat-error *ngIf="form.get('purchasePrice')?.hasError('min')">Must be ≥ 0</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Selling Price (₹)</mat-label>
              <input matInput type="number" formControlName="sellingPrice" min="0" placeholder="0.00" />
              <span matPrefix class="prefix-text">₹</span>
              <mat-error *ngIf="form.get('sellingPrice')?.hasError('required')">Required</mat-error>
              <mat-error *ngIf="form.get('sellingPrice')?.hasError('min')">Must be ≥ 0</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Tax Rate</mat-label>
              <mat-select formControlName="taxRate">
                <mat-option *ngFor="let t of taxRates" [value]="t.value">{{ t.label }}</mat-option>
              </mat-select>
              <mat-icon matPrefix>percent</mat-icon>
            </mat-form-field>
          </div>

          <!-- Margin preview -->
          <div class="margin-preview" *ngIf="margin() !== null">
            <span class="margin-label">Profit Margin</span>
            <span class="margin-value" [class.positive]="margin()! > 0" [class.negative]="margin()! <= 0">
              {{ margin()! > 0 ? '+' : '' }}{{ margin() | number:'1.1-1' }}%
            </span>
          </div>
        </div>

        <mat-divider />

        <!-- Section: Stock -->
        <div class="form-section">
          <h3 class="section-title">
            <mat-icon>warehouse</mat-icon> Stock & Status
          </h3>
          <div class="form-grid-3">
            <mat-form-field appearance="outline">
              <mat-label>Opening Stock</mat-label>
              <input matInput type="number" formControlName="stockQuantity" min="0" placeholder="0" />
              <mat-icon matPrefix>inventory</mat-icon>
              <mat-error *ngIf="form.get('stockQuantity')?.hasError('min')">Must be ≥ 0</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Low Stock Alert</mat-label>
              <input matInput type="number" formControlName="lowStockThreshold" min="0" placeholder="10" />
              <mat-icon matPrefix>warning</mat-icon>
              <mat-hint>Alert when stock falls below this</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="active">
                  <span class="status-option active">Active</span>
                </mat-option>
                <mat-option value="inactive">
                  <span class="status-option inactive">Inactive</span>
                </mat-option>
                <mat-option value="draft">
                  <span class="status-option draft">Draft</span>
                </mat-option>
              </mat-select>
              <mat-icon matPrefix>toggle_on</mat-icon>
            </mat-form-field>
          </div>
        </div>
      </form>

      <mat-divider />

      <!-- Footer -->
      <div class="dialog-footer">
        <button mat-stroked-button type="button" (click)="close()" [disabled]="saving()">
          Cancel
        </button>
        <button
          mat-flat-button
          color="primary"
          type="submit"
          (click)="onSubmit()"
          [disabled]="form.invalid || saving()"
          class="save-btn"
        >
          <mat-spinner *ngIf="saving()" diameter="18" class="mr-2" />
          <mat-icon *ngIf="!saving()">{{ isEdit ? 'save' : 'add' }}</mat-icon>
          {{ saving() ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Product' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container { @apply flex flex-col w-full max-h-[90vh]; min-width: 680px; }

    .dialog-header {
      @apply flex items-start justify-between p-6 pb-4;
      .header-icon {
        @apply w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0;
        mat-icon { @apply text-primary-600; }
      }
      .dialog-title { @apply text-lg font-semibold text-gray-900 dark:text-white; }
      .dialog-subtitle { @apply text-sm text-gray-500 dark:text-white/60 mt-0.5; }
      .close-btn { @apply text-gray-400 hover:text-gray-600; }
    }

    .dialog-body {
      @apply flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-5;
    }

    .form-section { @apply flex flex-col gap-4; }

    .section-title {
      @apply flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-white/80 uppercase tracking-wide;
      mat-icon { @apply text-base text-primary-500; font-size: 18px; }
    }

    .form-grid-2 { @apply grid grid-cols-2 gap-4; .col-span-2 { grid-column: span 2; } }
    .form-grid-3 { @apply grid grid-cols-3 gap-4; }

    .prefix-text { @apply text-gray-500 text-sm mr-1; }

    .margin-preview {
      @apply flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 w-fit;
      .margin-label { @apply text-xs text-gray-500 dark:text-white/60; }
      .margin-value { @apply text-sm font-semibold; &.positive { @apply text-green-600; } &.negative { @apply text-red-500; } }
    }

    .status-option { @apply text-sm font-medium; &.active { @apply text-green-600; } &.inactive { @apply text-red-500; } &.draft { @apply text-amber-600; } }

    .dialog-footer {
      @apply flex items-center justify-end gap-3 px-6 py-4;
      .save-btn { @apply flex items-center gap-2 px-6; }
    }
  `],
})
export class ProductDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(MatDialogRef<ProductDialogComponent>);

  @Inject(MAT_DIALOG_DATA) readonly data: ProductDialogData =
    inject<ProductDialogData>(MAT_DIALOG_DATA);

  protected readonly units = PRODUCT_UNITS;
  protected readonly categories = PRODUCT_CATEGORIES;
  protected readonly taxRates = TAX_RATES;
  protected readonly saving = signal(false);
  protected readonly margin = signal<number | null>(null);

  get isEdit(): boolean { return !!this.data?.product; }

  protected readonly form = this.fb.nonNullable.group({
    name:              ['', [Validators.required, Validators.maxLength(100)]],
    sku:               ['', Validators.required],
    barcode:           [''],
    category:          ['', Validators.required],
    unit:              ['pcs' as Product['unit'], Validators.required],
    description:       [''],
    purchasePrice:     [0, [Validators.required, Validators.min(0)]],
    sellingPrice:      [0, [Validators.required, Validators.min(0)]],
    taxRate:           [18, Validators.required],
    stockQuantity:     [0, Validators.min(0)],
    lowStockThreshold: [10, Validators.min(0)],
    status:            ['active' as Product['status'], Validators.required],
  });

  ngOnInit(): void {
    if (this.data?.product) {
      this.form.patchValue(this.data.product);
    }
    this.form.valueChanges.subscribe(() => this._calcMargin());
    this._calcMargin();
  }

  private _calcMargin(): void {
    const { purchasePrice, sellingPrice } = this.form.getRawValue();
    if (purchasePrice > 0 && sellingPrice > 0) {
      this.margin.set(((sellingPrice - purchasePrice) / purchasePrice) * 100);
    } else {
      this.margin.set(null);
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const payload = this.form.getRawValue() as CreateProductRequest;
    const request$ = this.isEdit
      ? this.productService.updateProduct({ ...payload, id: this.data.product!.id })
      : this.productService.createProduct(payload);

    request$.subscribe({
      next: res => {
        this.toast.success(res.message);
        this.dialogRef.close(res.data);
      },
      error: () => {
        this.toast.error('Failed to save product. Please try again.');
        this.saving.set(false);
      },
    });
  }

  close(): void { this.dialogRef.close(); }
}
