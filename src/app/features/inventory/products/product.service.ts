import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, throwError } from 'rxjs';
import { environment } from '@env/environment';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@shared/models/api.model';
import type {
  Product, CreateProductRequest, UpdateProductRequest,
  ProductFilters, BulkUploadResult,
} from './product.model';

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — remove this section when connecting a real backend
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Wireless Keyboard', sku: 'EL-WK-001', category: 'Electronics', unit: 'pcs', purchasePrice: 800, sellingPrice: 1299, taxRate: 18, stockQuantity: 45, lowStockThreshold: 10, status: 'active', description: 'Compact wireless keyboard with USB receiver', barcode: '8901234567890', createdAt: '2025-01-10T10:00:00Z', updatedAt: '2025-01-10T10:00:00Z' },
  { id: '2', name: 'USB-C Hub 7-in-1', sku: 'EL-HB-002', category: 'Electronics', unit: 'pcs', purchasePrice: 1200, sellingPrice: 1999, taxRate: 18, stockQuantity: 8, lowStockThreshold: 10, status: 'active', description: '7-port USB-C hub with HDMI and SD card reader', createdAt: '2025-01-11T10:00:00Z', updatedAt: '2025-01-11T10:00:00Z' },
  { id: '3', name: 'A4 Printing Paper (500 sheets)', sku: 'ST-PP-003', category: 'Stationery', unit: 'pack', purchasePrice: 180, sellingPrice: 280, taxRate: 12, stockQuantity: 120, lowStockThreshold: 20, status: 'active', createdAt: '2025-01-12T10:00:00Z', updatedAt: '2025-01-12T10:00:00Z' },
  { id: '4', name: 'Ball Pen Blue (Box of 10)', sku: 'ST-BP-004', category: 'Stationery', unit: 'box', purchasePrice: 40, sellingPrice: 75, taxRate: 12, stockQuantity: 200, lowStockThreshold: 50, status: 'active', createdAt: '2025-01-13T10:00:00Z', updatedAt: '2025-01-13T10:00:00Z' },
  { id: '5', name: 'Office Chair Ergonomic', sku: 'FN-OC-005', category: 'Furniture', unit: 'pcs', purchasePrice: 8500, sellingPrice: 12999, taxRate: 18, stockQuantity: 5, lowStockThreshold: 3, status: 'active', description: 'Ergonomic mesh office chair with lumbar support', createdAt: '2025-01-14T10:00:00Z', updatedAt: '2025-01-14T10:00:00Z' },
  { id: '6', name: 'Hand Sanitizer 500ml', sku: 'CM-HS-006', category: 'Cosmetics', unit: 'ml', purchasePrice: 90, sellingPrice: 149, taxRate: 12, stockQuantity: 0, lowStockThreshold: 20, status: 'inactive', createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-01-15T10:00:00Z' },
  { id: '7', name: 'Laptop Stand Aluminium', sku: 'EL-LS-007', category: 'Electronics', unit: 'pcs', purchasePrice: 1500, sellingPrice: 2499, taxRate: 18, stockQuantity: 22, lowStockThreshold: 5, status: 'active', createdAt: '2025-01-16T10:00:00Z', updatedAt: '2025-01-16T10:00:00Z' },
  { id: '8', name: 'Green Tea 100 Bags', sku: 'FB-GT-008', category: 'Food & Beverages', unit: 'pack', purchasePrice: 120, sellingPrice: 199, taxRate: 5, stockQuantity: 60, lowStockThreshold: 15, status: 'active', createdAt: '2025-01-17T10:00:00Z', updatedAt: '2025-01-17T10:00:00Z' },
  { id: '9', name: 'Sticky Notes 3x3 (Pack of 5)', sku: 'ST-SN-009', category: 'Stationery', unit: 'pack', purchasePrice: 55, sellingPrice: 99, taxRate: 12, stockQuantity: 3, lowStockThreshold: 10, status: 'draft', createdAt: '2025-01-18T10:00:00Z', updatedAt: '2025-01-18T10:00:00Z' },
  { id: '10', name: 'HDMI Cable 2m', sku: 'EL-HC-010', category: 'Electronics', unit: 'pcs', purchasePrice: 200, sellingPrice: 349, taxRate: 18, stockQuantity: 35, lowStockThreshold: 10, status: 'active', createdAt: '2025-01-19T10:00:00Z', updatedAt: '2025-01-19T10:00:00Z' },
];

let _mockDb = [...MOCK_PRODUCTS];
let _nextId = 11;

function _mockPaginate(items: Product[], params: PaginationParams & ProductFilters): PaginatedResponse<Product> {
  let filtered = [...items];
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q),
    );
  }
  if (params.category) filtered = filtered.filter(p => p.category === params.category);
  if (params.status) filtered = filtered.filter(p => p.status === params.status);
  if (params.lowStock) filtered = filtered.filter(p => p.stockQuantity <= p.lowStockThreshold);
  if (params.sortBy) {
    filtered.sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[params.sortBy!];
      const bv = (b as unknown as Record<string, unknown>)[params.sortBy!];
      const dir = params.sortOrder === 'desc' ? -1 : 1;
      return av! > bv! ? dir : av! < bv! ? -dir : 0;
    });
  }
  const total = filtered.length;
  const start = (params.page - 1) * params.pageSize;
  return { data: filtered.slice(start, start + params.pageSize), total, page: params.page, pageSize: params.pageSize, totalPages: Math.ceil(total / params.pageSize) };
}
// ─────────────────────────────────────────────────────────────────────────────
// END MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  // ── Replace this with your real API base URL ──────────────────────────────
  private readonly BASE = `${environment.apiBaseUrl}/inventory/products`;
  // ─────────────────────────────────────────────────────────────────────────

  getProducts(params: PaginationParams & ProductFilters): Observable<PaginatedResponse<Product>> {
    // ── MOCK ─────────────────────────────────────────────────────────────────
    if (!environment.production) {
      return of(_mockPaginate(_mockDb, params)).pipe(delay(400));
    }
    // ── REAL ─────────────────────────────────────────────────────────────────
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    return this.http.get<PaginatedResponse<Product>>(this.BASE, { params: httpParams });
  }

  getProduct(id: string): Observable<ApiResponse<Product>> {
    // ── MOCK ─────────────────────────────────────────────────────────────────
    if (!environment.production) {
      const product = _mockDb.find(p => p.id === id);
      if (!product) return throwError(() => new Error('Product not found'));
      return of({ data: product, message: 'OK', success: true, timestamp: new Date().toISOString() }).pipe(delay(200));
    }
    // ── REAL ─────────────────────────────────────────────────────────────────
    return this.http.get<ApiResponse<Product>>(`${this.BASE}/${id}`);
  }

  createProduct(payload: CreateProductRequest): Observable<ApiResponse<Product>> {
    // ── MOCK ─────────────────────────────────────────────────────────────────
    if (!environment.production) {
      const now = new Date().toISOString();
      const product: Product = { ...payload, id: String(_nextId++), createdAt: now, updatedAt: now };
      _mockDb = [product, ..._mockDb];
      return of({ data: product, message: 'Product created successfully', success: true, timestamp: now }).pipe(delay(600));
    }
    // ── REAL ─────────────────────────────────────────────────────────────────
    return this.http.post<ApiResponse<Product>>(this.BASE, payload);
  }

  updateProduct(payload: UpdateProductRequest): Observable<ApiResponse<Product>> {
    // ── MOCK ─────────────────────────────────────────────────────────────────
    if (!environment.production) {
      const idx = _mockDb.findIndex(p => p.id === payload.id);
      if (idx === -1) return throwError(() => new Error('Product not found'));
      _mockDb[idx] = { ..._mockDb[idx], ...payload, updatedAt: new Date().toISOString() };
      return of({ data: _mockDb[idx], message: 'Product updated successfully', success: true, timestamp: new Date().toISOString() }).pipe(delay(500));
    }
    // ── REAL ─────────────────────────────────────────────────────────────────
    return this.http.put<ApiResponse<Product>>(`${this.BASE}/${payload.id}`, payload);
  }

  deleteProduct(id: string): Observable<ApiResponse<null>> {
    // ── MOCK ─────────────────────────────────────────────────────────────────
    if (!environment.production) {
      _mockDb = _mockDb.filter(p => p.id !== id);
      return of({ data: null, message: 'Product deleted successfully', success: true, timestamp: new Date().toISOString() }).pipe(delay(400));
    }
    // ── REAL ─────────────────────────────────────────────────────────────────
    return this.http.delete<ApiResponse<null>>(`${this.BASE}/${id}`);
  }

  deleteProducts(ids: string[]): Observable<ApiResponse<null>> {
    // ── MOCK ─────────────────────────────────────────────────────────────────
    if (!environment.production) {
      _mockDb = _mockDb.filter(p => !ids.includes(p.id));
      return of({ data: null, message: `${ids.length} products deleted`, success: true, timestamp: new Date().toISOString() }).pipe(delay(500));
    }
    // ── REAL ─────────────────────────────────────────────────────────────────
    return this.http.post<ApiResponse<null>>(`${this.BASE}/bulk-delete`, { ids });
  }

  bulkUpload(file: File): Observable<ApiResponse<BulkUploadResult>> {
    // ── MOCK ─────────────────────────────────────────────────────────────────
    if (!environment.production) {
      return new Observable(observer => {
        const reader = new FileReader();
        reader.onload = e => {
          const text = e.target?.result as string;
          const lines = text.trim().split('\n').filter(Boolean);
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const errors: BulkUploadResult['errors'] = [];
          let success = 0;
          const now = new Date().toISOString();

          lines.slice(1).forEach((line, i) => {
            const row = i + 2;
            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const obj: Record<string, string> = {};
            headers.forEach((h, idx) => { obj[h] = values[idx] ?? ''; });

            if (!obj['name']) { errors.push({ row, field: 'name', message: 'Name is required' }); return; }
            if (!obj['sku']) { errors.push({ row, field: 'sku', message: 'SKU is required' }); return; }
            if (isNaN(Number(obj['sellingprice'] ?? obj['selling_price']))) { errors.push({ row, field: 'sellingPrice', message: 'Invalid selling price' }); return; }

            const product: Product = {
              id: String(_nextId++),
              name: obj['name'],
              sku: obj['sku'],
              category: obj['category'] ?? 'Other',
              unit: (obj['unit'] as Product['unit']) ?? 'pcs',
              purchasePrice: Number(obj['purchaseprice'] ?? obj['purchase_price'] ?? 0),
              sellingPrice: Number(obj['sellingprice'] ?? obj['selling_price'] ?? 0),
              taxRate: Number(obj['taxrate'] ?? obj['tax_rate'] ?? 18),
              stockQuantity: Number(obj['stockquantity'] ?? obj['stock_quantity'] ?? 0),
              lowStockThreshold: Number(obj['lowstockthreshold'] ?? obj['low_stock_threshold'] ?? 10),
              status: (obj['status'] as Product['status']) ?? 'active',
              description: obj['description'],
              barcode: obj['barcode'],
              createdAt: now,
              updatedAt: now,
            };
            _mockDb = [product, ..._mockDb];
            success++;
          });

          observer.next({ data: { total: lines.length - 1, success, failed: errors.length, errors }, message: 'Bulk upload complete', success: true, timestamp: now });
          observer.complete();
        };
        reader.readAsText(file);
      });
    }
    // ── REAL ─────────────────────────────────────────────────────────────────
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<BulkUploadResult>>(`${this.BASE}/bulk-upload`, formData);
  }

  downloadTemplate(): void {
    const csv = [
      'name,sku,category,unit,purchasePrice,sellingPrice,taxRate,stockQuantity,lowStockThreshold,status,description,barcode',
      'Sample Product,SKU-001,Electronics,pcs,500,999,18,100,10,active,Sample description,8901234567890',
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nava_vyapar_products_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
