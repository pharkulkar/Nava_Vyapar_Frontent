import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal, computed,
} from '@angular/core';
import { NgFor, NgIf, NgClass, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductService } from './product.service';
import { ToastService } from '@core/services/toast.service';
import { ProductCacheService } from '@core/business/product-cache.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { ProductDialogComponent } from './components/product-dialog.component';
import { ProductViewDialogComponent } from './components/product-view-dialog.component';
import { BulkUploadDialogComponent } from './components/bulk-upload-dialog.component';
import { BulkEditDialogComponent } from './components/bulk-edit-dialog.component';
import { PRODUCT_CATEGORIES, PRODUCT_STATUS_CONFIG } from './product.model';
import type { ApiProduct, Product, ProductFilters, ProductStatus } from './product.model';
import type { PaginationParams } from '@shared/models/api.model';

@Component({
  selector: 'nv-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgFor, NgIf, NgClass, FormsModule, CurrencyPipe,
    MatTableModule, MatSortModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatMenuModule,
    MatCheckboxModule, MatChipsModule, MatTooltipModule,
    MatProgressSpinnerModule, MatDividerModule,
    PageHeaderComponent,
  ],
  template: `
    <nv-page-header title="Products" subtitle="Manage your product catalogue" icon="category">
      <div actions class="flex items-center gap-2">
        <button mat-stroked-button (click)="exportCsv()"><mat-icon>download</mat-icon> Export</button>
        <button mat-stroked-button (click)="openBulkUpload()">
          <mat-icon>upload_file</mat-icon> Bulk Upload
        </button>
        <button mat-flat-button color="primary" (click)="openAddProduct()">
          <mat-icon>add</mat-icon> Add Product
        </button>
      </div>
    </nv-page-header>

    <!-- Summary Cards -->
    <div class="summary-row" *ngIf="stats()">
      <div class="summary-card accent-blue">
        <div class="summary-icon bg-gradient-to-br from-blue-500 to-blue-600">
          <mat-icon>inventory_2</mat-icon>
        </div>
        <div class="summary-meta">
          <p class="summary-value">{{ stats().total }}</p>
          <p class="summary-label">Total Products</p>
        </div>
      </div>

      <div class="summary-card accent-green">
        <div class="summary-icon bg-gradient-to-br from-green-500 to-emerald-600">
          <mat-icon>check_circle</mat-icon>
        </div>
        <div class="summary-meta">
          <p class="summary-value">{{ stats().active }}</p>
          <p class="summary-label">Active</p>
        </div>
      </div>

      <div class="summary-card accent-amber">
        <div class="summary-icon bg-gradient-to-br from-amber-500 to-orange-500">
          <mat-icon>warning</mat-icon>
        </div>
        <div class="summary-meta">
          <p class="summary-value">{{ stats().lowStock }}</p>
          <p class="summary-label">Low Stock</p>
        </div>
      </div>

      <div class="summary-card accent-red">
        <div class="summary-icon bg-gradient-to-br from-red-500 to-rose-600">
          <mat-icon>remove_circle</mat-icon>
        </div>
        <div class="summary-meta">
          <p class="summary-value">{{ stats().outOfStock }}</p>
          <p class="summary-label">Out of Stock</p>
        </div>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar">
      <!-- Search -->
      <div class="field-control search-field">
        <mat-icon class="field-icon">search</mat-icon>
        <input
          class="field-input"
          type="text"
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearch($event)"
          placeholder="Search by name, SKU or category..."
        />
        <button type="button" class="field-toggle" *ngIf="searchQuery" (click)="clearSearch()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Category -->
      <div class="field-control filter-field">
        <mat-icon class="field-icon">category</mat-icon>
        <select class="field-select" [(ngModel)]="selectedCategory" (ngModelChange)="onFilterChange()">
          <option value="">All Categories</option>
          <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
        </select>
        <mat-icon class="select-caret">expand_more</mat-icon>
      </div>

      <!-- Status -->
      <div class="field-control filter-field">
        <mat-icon class="field-icon">filter_list</mat-icon>
        <select class="field-select" [(ngModel)]="selectedStatus" (ngModelChange)="onFilterChange()">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="draft">Draft</option>
        </select>
        <mat-icon class="select-caret">expand_more</mat-icon>
      </div>

      <button
        mat-stroked-button
        [color]="showLowStock ? 'warn' : ''"
        (click)="toggleLowStock()"
        class="low-stock-btn"
        [class.active]="showLowStock"
      >
        <mat-icon>warning</mat-icon>
        Low Stock Only
      </button>

      <button mat-stroked-button class="refresh-btn" (click)="refresh()" [disabled]="loading()" matTooltip="Refresh">
        <mat-icon [class.spinning]="loading()">refresh</mat-icon>
        <span class="refresh-label">Refresh</span>
      </button>

      <button mat-icon-button matTooltip="Clear all filters" (click)="clearFilters()" *ngIf="hasActiveFilters()">
        <mat-icon>filter_alt_off</mat-icon>
      </button>
    </div>

    <!-- Bulk action bar -->
    <div class="bulk-action-bar" *ngIf="selectedIds().size > 0">
      <span class="text-sm font-medium text-primary-700 dark:text-primary-300">
        {{ selectedIds().size }} product{{ selectedIds().size > 1 ? 's' : '' }} selected
      </span>
      <button mat-stroked-button color="primary" (click)="editSelected()">
        <mat-icon>edit</mat-icon> Edit Selected
      </button>
      <button mat-stroked-button color="warn" (click)="deleteSelected()">
        <mat-icon>delete</mat-icon> Delete Selected
      </button>
      <button mat-icon-button (click)="clearSelection()" matTooltip="Clear selection">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <!-- Table -->
    <div class="table-card">
      <!-- Loading overlay -->
      <div class="table-loading" *ngIf="loading()">
        <mat-spinner diameter="40" />
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading() && products().length === 0">
        <div class="empty-illustration">
          <mat-icon>inventory_2</mat-icon>
        </div>
        <h3>{{ hasActiveFilters() ? 'No matching products' : 'No products yet' }}</h3>
        <p>
          {{ hasActiveFilters() ? 'Try adjusting your filters or search.' : 'Add your first product to get started.' }}
        </p>
        <button
          mat-flat-button
          color="primary"
          (click)="hasActiveFilters() ? clearFilters() : openAddProduct()"
        >
          <mat-icon>{{ hasActiveFilters() ? 'filter_alt_off' : 'add' }}</mat-icon>
          {{ hasActiveFilters() ? 'Clear Filters' : 'Add Product' }}
        </button>
      </div>

      <table mat-table [dataSource]="products()" matSort (matSortChange)="onSort($event)"
             class="products-table" *ngIf="!loading() && products().length > 0">

        <!-- Checkbox -->
        <ng-container matColumnDef="select">
          <th mat-header-cell *matHeaderCellDef class="w-12">
            <mat-checkbox
              [checked]="isAllSelected()"
              [indeterminate]="isSomeSelected()"
              (change)="toggleAll($event.checked)"
              color="primary"
            />
          </th>
          <td mat-cell *matCellDef="let row">
            <mat-checkbox
              [checked]="selectedIds().has(row.id)"
              (change)="toggleSelect(row.id)"
              color="primary"
            />
          </td>
        </ng-container>

        <!-- Product -->
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Product</th>
          <td mat-cell *matCellDef="let row">
            <div class="product-cell">
              <div class="product-avatar" [ngClass]="getCategoryColor(row.category)">
                {{ row.name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <p class="product-name">{{ row.name }}</p>
                <p class="product-sku">{{ row.productCode }}</p>
              </div>
            </div>
          </td>
        </ng-container>

        <!-- Category -->
        <ng-container matColumnDef="category">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Category</th>
          <td mat-cell *matCellDef="let row">
            <span class="category-chip">{{ row.category }}</span>
          </td>
        </ng-container>

        <!-- Price -->
        <ng-container matColumnDef="price">
          <th mat-header-cell *matHeaderCellDef>Price</th>
          <td mat-cell *matCellDef="let row">
            <span class="price-text font-semibold">{{ row.price | currency:'INR':'symbol':'1.2-2' }}</span>
          </td>
        </ng-container>

        <!-- UOM -->
        <ng-container matColumnDef="uom">
          <th mat-header-cell *matHeaderCellDef>Unit</th>
          <td mat-cell *matCellDef="let row">
            <span class="category-chip">{{ row.uom }}</span>
          </td>
        </ng-container>

        <!-- GST Rate -->
        <ng-container matColumnDef="gstRate">
          <th mat-header-cell *matHeaderCellDef>GST</th>
          <td mat-cell *matCellDef="let row">
            <span class="tax-chip">{{ row.gstRate }}%</span>
          </td>
        </ng-container>

        <!-- Actions -->
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef class="actions-col"></th>
          <td mat-cell *matCellDef="let row" class="actions-col">
            <button mat-icon-button [matMenuTriggerFor]="rowMenu" class="row-action-btn">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #rowMenu="matMenu">
              <button mat-menu-item (click)="viewProduct(row)">
                <mat-icon>visibility</mat-icon> View
              </button>
              <button mat-menu-item (click)="openEditProduct(row)">
                <mat-icon>edit</mat-icon> Edit
              </button>
              <button mat-menu-item (click)="duplicateProduct(row)">
                <mat-icon>content_copy</mat-icon> Duplicate
              </button>
              <mat-divider />
              <button mat-menu-item (click)="deleteProduct(row)" class="text-red-600">
                <mat-icon class="text-red-500">delete</mat-icon> Delete
              </button>
            </mat-menu>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"
            class="table-row"
            [class.selected]="selectedIds().has(row.id)">
        </tr>
      </table>

      <!-- Paginator -->
      <mat-paginator
        *ngIf="totalCount() > 0"
        [length]="totalCount()"
        [pageSize]="pageSize"
        [pageSizeOptions]="[10, 25, 50, 100]"
        [pageIndex]="currentPage() - 1"
        (page)="onPageChange($event)"
        showFirstLastButtons
        class="table-paginator"
      />
    </div>
  `,
  styleUrls: ['./products.component.scss'],
})
export class ProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly productCache = inject(ProductCacheService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly search$ = new Subject<string>();

  protected readonly statusConfig = PRODUCT_STATUS_CONFIG as Record<
    string,
    { label: string; color: string; icon: string }
  >;
  protected readonly displayedColumns = ['select', 'name', 'category', 'price', 'uom', 'gstRate', 'actions'];
  protected readonly categories = PRODUCT_CATEGORIES;

  protected readonly loading = signal(false);
  protected readonly products = signal<ApiProduct[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly currentPage = signal(1);
  protected readonly selectedIds = signal<Set<number>>(new Set());
  protected readonly stats = signal({ total: 0, active: 0, lowStock: 0, outOfStock: 0 });

  protected searchQuery = '';
  protected selectedCategory = '';
  protected selectedStatus = '';
  protected showLowStock = false;
  protected pageSize = 10;
  protected sortBy = '';
  protected sortOrder: 'asc' | 'desc' = 'asc';

  protected hasActiveFilters = computed(() =>
    !!this.searchQuery || !!this.selectedCategory || !!this.selectedStatus || this.showLowStock,
  );

  constructor() {
    this.search$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ).subscribe(() => {
      this.currentPage.set(1);
      this.loadProducts();
    });
  }

  ngOnInit(): void { this.loadProducts(); }

  private loadProducts(): void {
    this.loading.set(true);
    const params: PaginationParams & ProductFilters = {
      page: this.currentPage(),
      pageSize: this.pageSize,
      search: this.searchQuery || undefined,
      category: this.selectedCategory || undefined,
      status: (this.selectedStatus as ProductStatus) || undefined,
      lowStock: this.showLowStock || undefined,
      sortBy: this.sortBy || undefined,
      sortOrder: this.sortOrder,
    };

    this.productService.getProducts(params).subscribe({
      next: res => {
        this.products.set(res.data);
        this.totalCount.set(res.total);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load products');
        this.loading.set(false);
      },
    });
  }

  private _updateStats(products: ApiProduct[]): void {
    this.stats.set({
      total: this.totalCount(),
      active: products.length,
      lowStock: 0,
      outOfStock: 0,
    });
  }

  onSearch(val: string): void { this.search$.next(val); }
  clearSearch(): void { this.searchQuery = ''; this.search$.next(''); }
  onFilterChange(): void { this.currentPage.set(1); this.loadProducts(); }
  toggleLowStock(): void { this.showLowStock = !this.showLowStock; this.onFilterChange(); }

  refresh(): void {
    this.productCache.invalidate();
    this.loadProducts();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.showLowStock = false;
    this.currentPage.set(1);
    this.loadProducts();
  }

  onSort(sort: Sort): void {
    this.sortBy = sort.active;
    this.sortOrder = sort.direction as 'asc' | 'desc' || 'asc';
    this.loadProducts();
  }

  onPageChange(e: PageEvent): void {
    this.pageSize = e.pageSize;
    this.currentPage.set(e.pageIndex + 1);
    this.loadProducts();
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  isAllSelected(): boolean { return this.products().length > 0 && this.products().every(p => this.selectedIds().has(p.id)); }
  isSomeSelected(): boolean { return this.selectedIds().size > 0 && !this.isAllSelected(); }

  toggleAll(checked: boolean): void {
    this.selectedIds.set(checked ? new Set(this.products().map(p => p.id)) : new Set());
  }

  toggleSelect(id: number): void {
    this.selectedIds.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  clearSelection(): void { this.selectedIds.set(new Set()); }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  openAddProduct(): void {
    this.dialog.open(ProductDialogComponent, {
      data: {},
      width: '680px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'nv-dialog',
    }).afterClosed().subscribe(result => {
      if (result) this.loadProducts();
    });
  }

  viewProduct(product: ApiProduct): void {
    this.dialog
      .open(ProductViewDialogComponent, {
        data: { product },
        width: '500px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        panelClass: 'nv-dialog',
      })
      .afterClosed()
      .subscribe(result => {
        if (result === 'edit') {
          this.openEditProduct(product);
        } else if (result) {
          this.loadProducts();
        }
      });
  }

  openEditProduct(product: ApiProduct): void {
    this.dialog.open(ProductDialogComponent, {
      data: { product },
      width: '680px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'nv-dialog',
    }).afterClosed().subscribe(result => {
      if (result) this.loadProducts();
    });
  }

  duplicateProduct(product: ApiProduct): void {
    const apiPayload = {
      productCode: `${product.productCode}-COPY`,
      name:        `${product.name} (Copy)`,
      category:    product.category,
      price:       Number(product.price),
      uom:         product.uom,
      gstRate:     Number(product.gstRate),
    };
    this.productService.addProducts([apiPayload]).subscribe({
      next: () => { this.toast.success('Product duplicated'); this.loadProducts(); },
      error: () => this.toast.error('Failed to duplicate product'),
    });
  }

  deleteProduct(product: ApiProduct): void {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    this.productService.deleteProducts([product.id]).subscribe({
      next: res => {
        this.toast.success(res.displayMessage ?? 'Product deleted');
        this.productCache.invalidate();
        this.loadProducts();
      },
      error: () => this.toast.error('Failed to delete product'),
    });
  }

  editSelected(): void {
    const selectedProducts = this.products().filter(p => this.selectedIds().has(p.id));
    if (selectedProducts.length === 0) return;

    this.dialog.open(BulkEditDialogComponent, {
      data: { products: selectedProducts },
      width: '860px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'nv-dialog',
    }).afterClosed().subscribe(result => {
      if (result) {
        this.clearSelection();
        this.productCache.invalidate();
        this.loadProducts();
      }
    });
  }

  deleteSelected(): void {
    const ids = [...this.selectedIds()];
    if (!confirm(`Delete ${ids.length} products? This cannot be undone.`)) return;
    this.productService.deleteProducts(ids).subscribe({
      next: res => {
        this.toast.success(res.displayMessage ?? `${ids.length} products deleted`);
        this.clearSelection();
        this.productCache.invalidate();
        this.loadProducts();
      },
      error: () => this.toast.error('Failed to delete products'),
    });
  }

  openBulkUpload(): void {
    this.dialog.open(BulkUploadDialogComponent, {
      width: '620px',
      maxHeight: '90vh',
      panelClass: 'nv-dialog',
    }).afterClosed().subscribe(result => {
      if (result) this.loadProducts();
    });
  }

  exportCsv(): void {
    const rows = [
      ['Name', 'Product Code', 'Category', 'Price', 'UOM', 'GST Rate'],
      ...this.products().map(p => [
        p.name,
        p.productCode,
        p.category,
        p.price,
        p.uom,
        p.gstRate,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getCategoryColor(category: string): string {
    const map: Record<string, string> = {
      'Electronics': 'blue', 'Clothing': 'purple', 'Food & Beverages': 'green',
      'Furniture': 'orange', 'Stationery': 'cyan', 'Hardware': 'gray',
      'Cosmetics': 'pink', 'Medicines': 'teal', 'Toys': 'yellow',
      'Grocery': 'green', 'Silk': 'purple', 'Other': 'slate',
    };
    return map[category] ?? 'slate';
  }
}
