import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal, computed, effect,
} from '@angular/core';
import { NgFor, NgIf, NgClass, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
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
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { ProductDialogComponent } from './components/product-dialog.component';
import { BulkUploadDialogComponent } from './components/bulk-upload-dialog.component';
import { PRODUCT_CATEGORIES } from './product.model';
import type { Product, ProductFilters, ProductStatus } from './product.model';
import type { PaginationParams } from '@shared/models/api.model';

@Component({
  selector: 'nv-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgFor, NgIf, NgClass, FormsModule, CurrencyPipe,
    MatTableModule, MatSortModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatMenuModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCheckboxModule, MatChipsModule, MatTooltipModule,
    MatProgressSpinnerModule, MatDividerModule,
    PageHeaderComponent,
  ],
  template: `
    <nv-page-header title="Products" subtitle="Manage your product catalogue" icon="category">
      <div actions class="flex items-center gap-2">
        <button mat-stroked-button (click)="openBulkUpload()">
          <mat-icon>upload_file</mat-icon> Bulk Upload
        </button>
        <button mat-flat-button color="primary" (click)="openAddProduct()">
          <mat-icon>add</mat-icon> Add Product
        </button>
      </div>
    </nv-page-header>

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat-pill">
        <mat-icon class="text-blue-500">inventory_2</mat-icon>
        <div>
          <p class="stat-pill-value">{{ stats().total }}</p>
          <p class="stat-pill-label">Total Products</p>
        </div>
      </div>
      <div class="stat-pill">
        <mat-icon class="text-green-500">check_circle</mat-icon>
        <div>
          <p class="stat-pill-value">{{ stats().active }}</p>
          <p class="stat-pill-label">Active</p>
        </div>
      </div>
      <div class="stat-pill">
        <mat-icon class="text-amber-500">warning</mat-icon>
        <div>
          <p class="stat-pill-value">{{ stats().lowStock }}</p>
          <p class="stat-pill-label">Low Stock</p>
        </div>
      </div>
      <div class="stat-pill">
        <mat-icon class="text-red-500">remove_circle</mat-icon>
        <div>
          <p class="stat-pill-value">{{ stats().outOfStock }}</p>
          <p class="stat-pill-label">Out of Stock</p>
        </div>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar">
      <mat-form-field appearance="outline" class="search-field">
        <mat-icon matPrefix>search</mat-icon>
        <input
          matInput
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearch($event)"
          placeholder="Search by name, SKU or category..."
        />
        <button mat-icon-button matSuffix *ngIf="searchQuery" (click)="clearSearch()">
          <mat-icon>close</mat-icon>
        </button>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Category</mat-label>
        <mat-select [(ngModel)]="selectedCategory" (ngModelChange)="onFilterChange()">
          <mat-option value="">All Categories</mat-option>
          <mat-option *ngFor="let cat of categories" [value]="cat">{{ cat }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Status</mat-label>
        <mat-select [(ngModel)]="selectedStatus" (ngModelChange)="onFilterChange()">
          <mat-option value="">All Status</mat-option>
          <mat-option value="active">Active</mat-option>
          <mat-option value="inactive">Inactive</mat-option>
          <mat-option value="draft">Draft</mat-option>
        </mat-select>
      </mat-form-field>

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

      <button mat-icon-button matTooltip="Clear all filters" (click)="clearFilters()" *ngIf="hasActiveFilters()">
        <mat-icon>filter_alt_off</mat-icon>
      </button>
    </div>

    <!-- Bulk action bar -->
    <div class="bulk-action-bar" *ngIf="selectedIds().size > 0">
      <span class="text-sm font-medium text-primary-700 dark:text-primary-300">
        {{ selectedIds().size }} product{{ selectedIds().size > 1 ? 's' : '' }} selected
      </span>
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

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!loading() && products().length === 0">
        <mat-icon>inventory_2</mat-icon>
        <h3>No products found</h3>
        <p>{{ hasActiveFilters() ? 'Try adjusting your filters' : 'Add your first product to get started' }}</p>
        <button mat-flat-button color="primary" (click)="hasActiveFilters() ? clearFilters() : openAddProduct()">
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
                <p class="product-sku">{{ row.sku }}</p>
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

        <!-- Stock -->
        <ng-container matColumnDef="stockQuantity">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Stock</th>
          <td mat-cell *matCellDef="let row">
            <div class="stock-cell">
              <span class="stock-value" [ngClass]="getStockClass(row)">
                {{ row.stockQuantity }} {{ row.unit }}
              </span>
              <span class="low-stock-badge" *ngIf="row.stockQuantity > 0 && row.stockQuantity <= row.lowStockThreshold">
                Low
              </span>
              <span class="out-stock-badge" *ngIf="row.stockQuantity === 0">
                Out
              </span>
            </div>
          </td>
        </ng-container>

        <!-- Purchase Price -->
        <ng-container matColumnDef="purchasePrice">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Purchase</th>
          <td mat-cell *matCellDef="let row">
            <span class="price-text">{{ row.purchasePrice | currency:'INR':'symbol':'1.0-0' }}</span>
          </td>
        </ng-container>

        <!-- Selling Price -->
        <ng-container matColumnDef="sellingPrice">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Selling</th>
          <td mat-cell *matCellDef="let row">
            <span class="price-text font-semibold">{{ row.sellingPrice | currency:'INR':'symbol':'1.0-0' }}</span>
          </td>
        </ng-container>

        <!-- Tax -->
        <ng-container matColumnDef="taxRate">
          <th mat-header-cell *matHeaderCellDef>Tax</th>
          <td mat-cell *matCellDef="let row">
            <span class="tax-chip">{{ row.taxRate }}%</span>
          </td>
        </ng-container>

        <!-- Status -->
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let row">
            <span class="status-badge" [ngClass]="row.status">{{ row.status }}</span>
          </td>
        </ng-container>

        <!-- Actions -->
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef class="w-16"></th>
          <td mat-cell *matCellDef="let row">
            <button mat-icon-button [matMenuTriggerFor]="rowMenu" class="action-btn">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #rowMenu="matMenu">
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
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly search$ = new Subject<string>();

  protected readonly displayedColumns = ['select', 'name', 'category', 'stockQuantity', 'purchasePrice', 'sellingPrice', 'taxRate', 'status', 'actions'];
  protected readonly categories = PRODUCT_CATEGORIES;

  protected readonly loading = signal(false);
  protected readonly products = signal<Product[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly currentPage = signal(1);
  protected readonly selectedIds = signal<Set<string>>(new Set());
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
        this._updateStats(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load products');
        this.loading.set(false);
      },
    });
  }

  private _updateStats(products: Product[]): void {
    this.stats.set({
      total: this.totalCount(),
      active: products.filter(p => p.status === 'active').length,
      lowStock: products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold).length,
      outOfStock: products.filter(p => p.stockQuantity === 0).length,
    });
  }

  onSearch(val: string): void { this.search$.next(val); }
  clearSearch(): void { this.searchQuery = ''; this.search$.next(''); }
  onFilterChange(): void { this.currentPage.set(1); this.loadProducts(); }
  toggleLowStock(): void { this.showLowStock = !this.showLowStock; this.onFilterChange(); }

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

  toggleSelect(id: string): void {
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
      width: '720px',
      maxHeight: '90vh',
      panelClass: 'nv-dialog',
    }).afterClosed().subscribe(result => {
      if (result) this.loadProducts();
    });
  }

  openEditProduct(product: Product): void {
    this.dialog.open(ProductDialogComponent, {
      data: { product },
      width: '720px',
      maxHeight: '90vh',
      panelClass: 'nv-dialog',
    }).afterClosed().subscribe(result => {
      if (result) this.loadProducts();
    });
  }

  duplicateProduct(product: Product): void {
    const { id, createdAt, updatedAt, ...payload } = product;
    payload.name = `${payload.name} (Copy)`;
    payload.sku = `${payload.sku}-COPY`;
    this.productService.createProduct(payload).subscribe({
      next: () => { this.toast.success('Product duplicated'); this.loadProducts(); },
      error: () => this.toast.error('Failed to duplicate product'),
    });
  }

  deleteProduct(product: Product): void {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    this.productService.deleteProduct(product.id).subscribe({
      next: res => { this.toast.success(res.message); this.loadProducts(); },
      error: () => this.toast.error('Failed to delete product'),
    });
  }

  deleteSelected(): void {
    const ids = [...this.selectedIds()];
    if (!confirm(`Delete ${ids.length} products? This cannot be undone.`)) return;
    this.productService.deleteProducts(ids).subscribe({
      next: res => {
        this.toast.success(res.message);
        this.clearSelection();
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

  // ── Helpers ───────────────────────────────────────────────────────────────
  getCategoryColor(category: string): string {
    const map: Record<string, string> = {
      'Electronics': 'blue', 'Clothing': 'purple', 'Food & Beverages': 'green',
      'Furniture': 'orange', 'Stationery': 'cyan', 'Hardware': 'gray',
      'Cosmetics': 'pink', 'Medicines': 'teal', 'Toys': 'yellow', 'Other': 'slate',
    };
    return map[category] ?? 'slate';
  }

  getStockClass(product: Product): string {
    if (product.stockQuantity === 0) return 'out-of-stock';
    if (product.stockQuantity <= product.lowStockThreshold) return 'low-stock';
    return 'in-stock';
  }
}
