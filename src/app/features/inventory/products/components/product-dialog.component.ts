import {
  ChangeDetectionStrategy, Component, Inject, OnInit, inject, signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf, DecimalPipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { forkJoin, of, catchError, concatMap, map } from 'rxjs';
import { AppStore } from '@core/store/app.store';
import { ProductService } from '../product.service';
import { ToastService } from '@core/services/toast.service';
import {
  PRODUCT_UNITS, PRODUCT_CATEGORIES, TAX_RATES,
} from '../product.model';
import type {
  Product, ApiProductRequest, ApiProduct, ApiProductUpdateRequest,
  ApiInventoryRequest, ApiInventoryResponse,
} from '../product.model';

export interface ProductDialogData {
  product?: ApiProduct;
}

@Component({
  selector: 'nv-product-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, NgFor, NgIf,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatDividerModule,
  ],
  template: `
    <div class="pd-container">

      <!-- ── Header ── -->
      <div class="pd-header">
        <div class="pd-header-left">
          <div class="pd-header-icon">
            <mat-icon>{{ isEdit ? 'edit' : 'inventory_2' }}</mat-icon>
          </div>
          <div>
            <h2 class="pd-title">{{ isEdit ? 'Edit Product' : 'Add New Product' }}</h2>
            <p class="pd-subtitle">{{ isEdit ? 'Update the product details below' : 'Fill in the details to add to your catalogue' }}</p>
          </div>
        </div>
        <button class="pd-close" type="button" (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-divider />

      <!-- ── Form ── -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="pd-body" novalidate>

        <!-- Section: Basic Info -->
        <p class="pd-section-label"><mat-icon>info</mat-icon> Basic Information</p>

        <div class="pd-grid-2">
          <!-- Product Name -->
          <div class="field col-span-2">
            <label class="field-label" for="pd-name">Product Name</label>
            <div class="field-control" [class.error]="f.name.invalid && f.name.touched">
              <mat-icon class="field-icon">inventory_2</mat-icon>
              <input id="pd-name" class="field-input" type="text" formControlName="name"
                     placeholder="e.g. Basmati Rice" autocomplete="off" />
            </div>
            <div class="field-error" *ngIf="f.name.invalid && f.name.touched">
              <span *ngIf="f.name.hasError('required')">Product name is required</span>
              <span *ngIf="f.name.hasError('maxlength')">Max 100 characters</span>
            </div>
          </div>

          <!-- SKU / Product Code -->
          <div class="field">
            <label class="field-label" for="pd-sku">SKU / Product Code</label>
            <div class="field-control" [class.error]="f.sku.invalid && f.sku.touched">
              <mat-icon class="field-icon">qr_code</mat-icon>
              <input id="pd-sku" class="field-input" type="text" formControlName="sku"
                     placeholder="e.g. P001" autocomplete="off" />
            </div>
            <div class="field-error" *ngIf="f.sku.invalid && f.sku.touched">
              <span *ngIf="f.sku.hasError('required')">SKU is required</span>
            </div>
          </div>

          <!-- Category -->
          <div class="field">
            <label class="field-label" for="pd-category">Category</label>
            <div class="field-control" [class.error]="f.category.invalid && f.category.touched">
              <mat-icon class="field-icon">category</mat-icon>
              <select id="pd-category" class="field-select" formControlName="category">
                <option value="" disabled>Select category</option>
                <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
              </select>
              <mat-icon class="select-caret">expand_more</mat-icon>
            </div>
            <div class="field-error" *ngIf="f.category.invalid && f.category.touched">
              <span *ngIf="f.category.hasError('required')">Category is required</span>
            </div>
          </div>

          <!-- Unit of Measure -->
          <div class="field">
            <label class="field-label" for="pd-unit">Unit of Measure</label>
            <div class="field-control">
              <mat-icon class="field-icon">straighten</mat-icon>
              <select id="pd-unit" class="field-select" formControlName="unit">
                <option *ngFor="let u of units" [value]="u.value">{{ u.label }}</option>
              </select>
              <mat-icon class="select-caret">expand_more</mat-icon>
            </div>
          </div>

          <!-- Description -->
          <div class="field col-span-2">
            <label class="field-label" for="pd-desc">Description <span class="optional">(optional)</span></label>
            <div class="field-control textarea-control">
              <mat-icon class="field-icon" style="align-self:flex-start;margin-top:12px">notes</mat-icon>
              <textarea id="pd-desc" class="field-input field-textarea" formControlName="description"
                        rows="2" placeholder="Brief product description..."></textarea>
            </div>
          </div>
        </div>

        <mat-divider />

        <!-- Section: Pricing -->
        <p class="pd-section-label"><mat-icon>currency_rupee</mat-icon> Pricing & Tax</p>

        <div class="pd-grid-3">
          <!-- Selling Price -->
          <div class="field">
            <label class="field-label" for="pd-price">Selling Price (₹)</label>
            <div class="field-control" [class.error]="f.sellingPrice.invalid && f.sellingPrice.touched">
              <mat-icon class="field-icon">currency_rupee</mat-icon>
              <input id="pd-price" class="field-input" type="number" formControlName="sellingPrice"
                     min="0" placeholder="0.00" />
            </div>
            <div class="field-error" *ngIf="f.sellingPrice.invalid && f.sellingPrice.touched">
              <span *ngIf="f.sellingPrice.hasError('required')">Required</span>
              <span *ngIf="f.sellingPrice.hasError('min')">Must be ≥ 0</span>
            </div>
          </div>

          <!-- Purchase Price — commented out for now -->
          
          <div class="field">
            <label class="field-label" for="pd-purchase">Purchase Price (₹) <span class="optional">(opt)</span></label>
            <div class="field-control">
              <mat-icon class="field-icon">currency_rupee</mat-icon>
              <input id="pd-purchase" class="field-input" type="number" formControlName="purchasePrice"
                     min="0" placeholder="0.00" />
            </div>
          </div>
          

          <!-- Tax Rate (GST) -->
          <div class="field">
            <label class="field-label" for="pd-tax">GST Rate</label>
            <div class="field-control">
              <mat-icon class="field-icon">percent</mat-icon>
              <select id="pd-tax" class="field-select" formControlName="taxRate">
                <option *ngFor="let t of taxRates" [value]="t.value">{{ t.label }}</option>
              </select>
              <mat-icon class="select-caret">expand_more</mat-icon>
            </div>
          </div>
        </div>

        <!-- Margin preview — commented out for now -->
        <!--
        <div class="margin-preview" *ngIf="margin() !== null">
          <mat-icon>trending_up</mat-icon>
          <span class="margin-label">Profit Margin:</span>
          <span class="margin-value" [class.positive]="margin()! > 0" [class.negative]="margin()! <= 0">
            {{ margin()! > 0 ? '+' : '' }}{{ margin() | number:'1.1-1' }}%
          </span>
        </div>
        -->

        <!-- Section: Stock — updates inventory via POST /inventory (add & edit) -->
        <ng-container>
          <mat-divider />

          <p class="pd-section-label"><mat-icon>warehouse</mat-icon> Stock</p>

          <div class="pd-grid-3">
            <div class="field">
              <label class="field-label" for="pd-stock">Quantity</label>
              <div class="field-control">
                <mat-icon class="field-icon">inventory</mat-icon>
                <input id="pd-stock" class="field-input" type="number" formControlName="stockQuantity"
                       min="0" placeholder="0" />
              </div>
            </div>

            <div class="field">
              <label class="field-label" for="pd-threshold">Low Stock Quantity</label>
              <div class="field-control">
                <mat-icon class="field-icon">warning_amber</mat-icon>
                <input id="pd-threshold" class="field-input" type="number" formControlName="lowStockThreshold"
                       min="0" placeholder="10" />
              </div>
            </div>

            <div class="field">
              <label class="field-label" for="pd-note">Note <span class="optional">(optional)</span></label>
              <div class="field-control">
                <mat-icon class="field-icon">sticky_note_2</mat-icon>
                <input id="pd-note" class="field-input" type="text" formControlName="note"
                       placeholder="e.g. Restocked" autocomplete="off" />
              </div>
            </div>
          </div>
        </ng-container>

      </form>

      <mat-divider />

      <!-- ── Footer ── -->
      <div class="pd-footer">
        <button class="pd-cancel-btn" type="button" (click)="close()" [disabled]="saving()">
          Cancel
        </button>
        <button class="pd-submit-btn" type="submit" (click)="onSubmit()"
                [disabled]="form.invalid || saving()">
          <mat-spinner *ngIf="saving()" diameter="18" />
          <mat-icon *ngIf="!saving()">{{ isEdit ? 'save' : 'add' }}</mat-icon>
          <span>{{ saving() ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Product' }}</span>
        </button>
      </div>

    </div>
  `,
  styles: [`
    .pd-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-height: 90vh;
      background: var(--mat-sys-surface, #fff);
    }

    /* ── Header ── */
    .pd-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 24px 24px 16px;
    }
    .pd-header-left { display: flex; align-items: flex-start; gap: 14px; }
    .pd-header-icon {
      @apply w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30
             flex items-center justify-center shrink-0;
      mat-icon { @apply text-primary-600; }
    }
    .pd-title { @apply text-lg font-semibold text-gray-900 dark:text-white; }
    .pd-subtitle { @apply text-sm text-gray-500 dark:text-white/60 mt-0.5; }
    .pd-close {
      @apply w-8 h-8 rounded-lg flex items-center justify-center
             text-gray-400 hover:text-gray-600 hover:bg-gray-100
             dark:hover:text-white/70 dark:hover:bg-white/10 transition-colors;
    }

    /* ── Body ── */
    .pd-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .pd-section-label {
      @apply flex items-center gap-2 text-xs font-semibold uppercase tracking-widest
             text-gray-500 dark:text-white/50 mt-2;
      mat-icon { font-size: 15px; width: 15px; height: 15px; @apply text-primary-500; }
    }

    .pd-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .pd-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
    .col-span-2 { grid-column: span 2; }

    @media (max-width: 560px) {
      .pd-grid-2, .pd-grid-3 { grid-template-columns: 1fr; }
      .col-span-2 { grid-column: span 1; }
    }

    @media (min-width: 561px) and (max-width: 720px) {
      .pd-grid-3 { grid-template-columns: 1fr 1fr; }
    }

    /* ── Login-style fields ── */
    .field { display: flex; flex-direction: column; gap: 6px; }

    .field-label {
      @apply text-sm font-medium text-gray-700 dark:text-white/80;
      .optional { @apply text-gray-400 dark:text-white/40 font-normal text-xs; }
    }

    .field-control {
      @apply flex items-center gap-3 rounded-xl border border-gray-300 bg-white px-3.5
             transition-all duration-200
             focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/15
             dark:border-white/10 dark:bg-white/5 dark:focus-within:border-primary-400;
      &.error {
        @apply border-red-400 focus-within:border-red-400 focus-within:ring-red-400/15;
      }
      &.textarea-control { @apply items-start; }
    }

    .field-icon {
      @apply text-gray-400 dark:text-white/40 shrink-0;
      font-size: 18px; width: 18px; height: 18px;
    }

    .field-input {
      @apply flex-1 bg-transparent py-3 text-sm text-gray-900 outline-none
             placeholder:text-gray-400 dark:text-white dark:placeholder:text-white/30;
      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button { -webkit-appearance: none; }
    }

    .field-textarea {
      @apply py-3 resize-none;
      min-height: 60px;
    }

    .field-select {
      @apply flex-1 bg-transparent py-3 text-sm text-gray-900 outline-none cursor-pointer
             dark:text-white appearance-none;
      option { @apply bg-white dark:bg-gray-900; }
    }

    .select-caret {
      @apply text-gray-400 dark:text-white/40 shrink-0 pointer-events-none;
      font-size: 18px; width: 18px; height: 18px;
    }

    .field-error {
      @apply text-xs font-medium text-red-500 dark:text-red-400;
    }

    /* ── Margin preview ── */
    .margin-preview {
      @apply flex items-center gap-2 px-4 py-2.5 rounded-xl
             bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 w-fit;
      mat-icon { @apply text-gray-400 dark:text-white/40; font-size: 16px; }
      .margin-label { @apply text-xs text-gray-500 dark:text-white/60; }
      .margin-value {
        @apply text-sm font-semibold;
        &.positive { @apply text-green-600; }
        &.negative { @apply text-red-500; }
      }
    }

    /* ── Footer ── */
    .pd-footer {
      @apply flex items-center justify-end gap-3 px-6 py-4;
    }

    .pd-cancel-btn {
      @apply h-10 px-5 rounded-xl border border-gray-300 dark:border-white/15
             text-sm font-medium text-gray-700 dark:text-white/80
             hover:bg-gray-50 dark:hover:bg-white/5
             disabled:opacity-50 disabled:cursor-not-allowed transition-all;
    }

    .pd-submit-btn {
      @apply flex items-center gap-2 h-10 px-6 rounded-xl
             bg-primary-600 text-white text-sm font-semibold
             shadow-lg shadow-primary-600/25
             hover:bg-primary-700 active:scale-[0.99]
             disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none
             transition-all duration-200;
    }

  `],
})
export class ProductDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);
  private readonly store = inject(AppStore);
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
    // Inventory fields — sent to POST /inventory on edit
    stockQuantity:     [0, Validators.min(0)],
    lowStockThreshold: [10, Validators.min(0)],
    note:              [''],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    if (this.data?.product) {
      const p: ApiProduct = this.data.product;
      this.form.patchValue({
        name:          p.name,
        sku:           p.productCode,
        category:      p.category,
        unit:          (p.uom as Product['unit']) ?? 'pcs',
        sellingPrice:  Number(p.price),
        taxRate:       Number(p.gstRate),
        purchasePrice: p.purchasePrice ?? 0,
        description:   p.description ?? '',
        stockQuantity: Number(p.currentStock) ?? ''
        // stockQuantity / lowStockThreshold start at defaults — the GET /products
        // list response doesn't include current stock levels
      });
    }
  }

  // private _calcMargin(): void {
  //   const { purchasePrice, sellingPrice } = this.form.getRawValue();
  //   if (purchasePrice > 0 && sellingPrice > 0) {
  //     this.margin.set(((sellingPrice - purchasePrice) / purchasePrice) * 100);
  //   } else {
  //     this.margin.set(null);
  //   }
  // }

  onSubmit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const raw = this.form.getRawValue();

    if (this.isEdit) {
      const updatePayload: ApiProductUpdateRequest = {
        id:       this.data.product!.id,
        name:     raw.name,
        category: raw.category,
        price:    raw.sellingPrice,
        uom:      raw.unit,
        gstRate:  raw.taxRate,
        purchasePrice: raw.purchasePrice,
        description: raw.description,
      };

      // Inventory update — uses the SKU/productCode as productId, per the API contract
      const inventoryPayload: ApiInventoryRequest = {
        productId:         raw.sku,
        businessId:        this.store.selectedBusiness()?.id ?? 0,
        quantity:          raw.stockQuantity,
        lowStockThreshold: raw.lowStockThreshold,
        uom:               raw.unit,
        note:              raw.note || undefined,
      };

      // Fire product update and inventory update together. Inventory errors are
      // tolerated (swallowed to null) so a stock hiccup doesn't block a valid
      // product edit — but a genuine product-update failure still surfaces.
      forkJoin({
        product: this.productService.updateProducts([updatePayload]),
        inventory: this.productService.updateInventory([inventoryPayload]).pipe(
          catchError(() => of(null)),
        ),
      }).subscribe({
        next: ({ product, inventory }) => {
          if (inventory === null) {
            this.toast.error('Product saved, but stock update failed. Please retry stock update.');
          } else {
            this.toast.success(product.displayMessage ?? product.statusMessage ?? 'Product updated successfully');
          }
          this.dialogRef.close(true);
        },
        error: err => {
          const body = err?.error;
          if (body?.status === 'success') {
            this.toast.success(body.displayMessage ?? 'Product updated successfully');
            this.dialogRef.close(true);
            return;
          }
          this.toast.error(body?.displayMessage ?? body?.message ?? 'Failed to update product.');
          this.saving.set(false);
        },
      });
    } else {
      const apiPayload: ApiProductRequest = {
        productCode: raw.sku,
        name:        raw.name,
        category:    raw.category,
        price:       raw.sellingPrice,
        uom:         raw.unit,
        gstRate:     raw.taxRate,
        purchasePrice: raw.purchasePrice,
        description: raw.description,
      };

      const inventoryPayload: ApiInventoryRequest = {
        productId:         raw.sku,
        businessId:        this.store.selectedBusiness()?.id ?? 0,
        quantity:          raw.stockQuantity,
        lowStockThreshold: raw.lowStockThreshold,
        uom:               raw.unit,
        note:              raw.note || undefined,
      };

      // Create the product first, then attach inventory once it exists.
      // Inventory errors are tolerated so a stock hiccup doesn't discard a
      // successfully created product.
      this.productService.addProducts([apiPayload]).pipe(
        concatMap(res =>
          this.productService.updateInventory([inventoryPayload]).pipe(
            map(inv => ({ product: res, inventory: inv as ApiInventoryResponse | null })),
            catchError(() => of({ product: res, inventory: null as ApiInventoryResponse | null })),
          ),
        ),
      ).subscribe({
        next: ({ product, inventory }) => {
          if (inventory === null) {
            this.toast.error('Product created, but stock update failed. Please set stock from Edit.');
          } else {
            this.toast.success(product.displayMessage ?? product.statusMessage ?? 'Product added successfully');
          }
          this.dialogRef.close(true);
        },
        error: err => {
          const body = err?.error;
          if (body?.status === 'success') {
            // Product create returned success via error channel — still try inventory
            this.productService.updateInventory([inventoryPayload]).pipe(
              catchError(() => of(null)),
            ).subscribe(inv => {
              if (inv === null) {
                this.toast.error('Product created, but stock update failed. Please set stock from Edit.');
              } else {
                this.toast.success(body.displayMessage ?? 'Product added successfully');
              }
              this.dialogRef.close(true);
            });
            return;
          }
          this.toast.error(body?.displayMessage ?? body?.message ?? 'Failed to add product.');
          this.saving.set(false);
        },
      });
    }
  }

  close(): void { this.dialogRef.close(); }
}
