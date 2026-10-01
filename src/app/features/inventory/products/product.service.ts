import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, map, catchError, of, from, switchMap } from 'rxjs';
import * as XLSX from 'xlsx';
import { environment } from '@env/environment';
import { AppStore } from '../../../core/store/app.store';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@shared/models/api.model';
import type {
  ProductFilters, BulkUploadResult, ApiProductRequest, ApiProductsResponse, ApiProduct,
  ApiProductUpdateRequest, ApiProductDeleteRequest,
  ApiInventoryRequest, ApiInventoryResponse,
} from './product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(AppStore);
  private readonly BASE = `${environment.apiBaseUrl}/products`;
  private readonly INVENTORY_BASE = `${environment.apiBaseUrl}/inventory`;

  private get businessId(): number | null {
    return this.store.selectedBusiness()?.id ?? null;
  }

  getProducts(params: PaginationParams & ProductFilters): Observable<PaginatedResponse<ApiProduct>> {
    let p = new HttpParams();
    if (this.businessId !== null) p = p.set('businessId', this.businessId);
    // Cache-buster so the browser/proxy can't serve a stale response after an update.
    // NOTE: use only a query param here — adding a Cache-Control request header would
    // trigger a CORS preflight that the API doesn't allow.
    p = p.set('_t', Date.now().toString());

    return this.http.get<ApiProductsResponse>(this.BASE, { params: p }).pipe(
      map(res => {
        const items = res.products ?? [];
        return {
          data: items,
          total: items.length,
          page: 1,
          pageSize: items.length,
          totalPages: 1,
        };
      }),
      catchError(err => {
        if (err?.error?.status === 'success') {
          const items: ApiProduct[] = err.error.products ?? [];
          return of({ data: items, total: items.length, page: 1, pageSize: items.length, totalPages: 1 });
        }
        return throwError(() => err);
      }),
    );
  }

  getProduct(id: string): Observable<ApiProduct> {
    return this.http.get<ApiProduct>(`${this.BASE}/${id}`);
  }

  /** POST /api/products?businessId= — accepts an array, works for single add and bulk */
  addProducts(products: ApiProductRequest[]): Observable<ApiProductsResponse> {
    let p = new HttpParams();
    if (this.businessId !== null) p = p.set('businessId', this.businessId);
    return this.http.post<ApiProductsResponse>(this.BASE, products, { params: p });
  }

  /** PUT /api/products/?businessId= — update one or many products */
  updateProducts(products: ApiProductUpdateRequest[]): Observable<ApiProductsResponse> {
    let p = new HttpParams();
    if (this.businessId !== null) p = p.set('businessId', this.businessId);
    return this.http.put<ApiProductsResponse>(this.BASE + '/', products, { params: p }).pipe(
      catchError(err => {
        if (err?.error?.status === 'success') return of(err.error as ApiProductsResponse);
        return throwError(() => err);
      }),
    );
  }

  /** POST /api/inventory — set/update stock for one or many products (array body) */
  updateInventory(items: ApiInventoryRequest[]): Observable<ApiInventoryResponse> {
    return this.http.post<ApiInventoryResponse>(this.INVENTORY_BASE, items).pipe(
      catchError(err => {
        if (err?.error?.status === 'success') return of(err.error as ApiInventoryResponse);
        return throwError(() => err);
      }),
    );
  }

  /** DELETE /api/products/?businessId= — delete one or many products */
  deleteProducts(ids: number[]): Observable<ApiProductsResponse> {
    const body: ApiProductDeleteRequest[] = ids.map(id => ({ id }));
    let p = new HttpParams();
    if (this.businessId !== null) p = p.set('businessId', this.businessId);
    return this.http.delete<ApiProductsResponse>(this.BASE + '/', { params: p, body }).pipe(
      catchError(err => {
        if (err?.error?.status === 'success') return of(err.error as ApiProductsResponse);
        return throwError(() => err);
      }),
    );
  }

  bulkUpload(file: File): Observable<ApiResponse<BulkUploadResult>> {
    return from(this._parseFile(file)).pipe(
      switchMap(({ rows, errors }) => {
        if (rows.length === 0) {
          const result: BulkUploadResult = { total: 0, success: 0, failed: errors.length, errors };
          return of({ data: result, message: 'No valid rows found', success: false, timestamp: new Date().toISOString() });
        }
        return new Observable<ApiResponse<BulkUploadResult>>(observer => {
          this.addProducts(rows).subscribe({
            next: res => {
              const result: BulkUploadResult = {
                total: rows.length + errors.length,
                success: rows.length,
                failed: errors.length,
                errors,
              };
              observer.next({
                data: result,
                message: res.displayMessage ?? res.statusMessage ?? 'Upload complete',
                success: true,
                timestamp: new Date().toISOString(),
              });
              observer.complete();
            },
            error: err => {
              const body = err?.error;
              if (body?.status === 'success') {
                const result: BulkUploadResult = { total: rows.length + errors.length, success: rows.length, failed: errors.length, errors };
                observer.next({ data: result, message: body.displayMessage ?? 'Upload complete', success: true, timestamp: new Date().toISOString() });
                observer.complete();
              } else {
                observer.error(err);
              }
            },
          });
        });
      }),
    );
  }

  private _parseFile(file: File): Promise<{ rows: ApiProductRequest[]; errors: BulkUploadResult['errors'] }> {
    return new Promise(resolve => {
      const reader = new FileReader();
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

      reader.onload = e => {
        const rows: ApiProductRequest[] = [];
        const errors: BulkUploadResult['errors'] = [];

        try {
          let rawRows: Record<string, unknown>[];

          if (isExcel) {
            const data = new Uint8Array(e.target!.result as ArrayBuffer);
            const wb = XLSX.read(data, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
          } else {
            const text = e.target!.result as string;
            const lines = text.trim().split('\n').filter(Boolean);
            const headers = lines[0].split(',').map(h => h.trim());
            rawRows = lines.slice(1).map(line => {
              const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
              const obj: Record<string, unknown> = {};
              headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
              return obj;
            });
          }

          rawRows.forEach((obj, i) => {
            const row = i + 2;
            const norm: Record<string, string> = {};
            Object.keys(obj).forEach(k => { norm[k.toLowerCase().replace(/\s+/g, '')] = String(obj[k]); });

            const name = norm['name'] ?? '';
            const productCode = norm['productcode'] ?? norm['sku'] ?? norm['code'] ?? '';
            const price = Number(norm['price'] ?? norm['sellingprice'] ?? 0);
            const gstRate = Number(norm['gstrate'] ?? norm['taxrate'] ?? 18);
            const purchasePriceRaw = norm['purchaseprice'] ?? norm['purchase_price'] ?? '';
            const purchasePrice = purchasePriceRaw === '' ? undefined : Number(purchasePriceRaw);
            const description = norm['description'] ?? norm['desc'] ?? '';

            if (!name) { errors.push({ row, field: 'name', message: 'Name is required' }); return; }
            if (!productCode) { errors.push({ row, field: 'productCode', message: 'Product code / SKU is required' }); return; }
            if (isNaN(price) || price < 0) { errors.push({ row, field: 'price', message: 'Invalid price' }); return; }
            if (purchasePrice !== undefined && (isNaN(purchasePrice) || purchasePrice < 0)) {
              errors.push({ row, field: 'purchasePrice', message: 'Invalid purchase price' }); return;
            }

            rows.push({
              productCode,
              name,
              category: norm['category'] ?? 'Other',
              price,
              uom: norm['uom'] ?? norm['unit'] ?? 'pcs',
              gstRate: isNaN(gstRate) ? 18 : gstRate,
              ...(purchasePrice !== undefined ? { purchasePrice } : {}),
              ...(description ? { description } : {}),
            });
          });
        } catch {
          errors.push({ row: 0, field: 'file', message: 'Failed to parse file. Ensure it is a valid CSV or Excel file.' });
        }

        resolve({ rows, errors });
      };

      if (isExcel) reader.readAsArrayBuffer(file);
      else reader.readAsText(file);
    });
  }

  downloadTemplate(): void {
    const headers = ['productCode', 'name', 'category', 'price', 'uom', 'gstRate', 'purchasePrice', 'description'];
    const sample  = ['P001', 'Basmati Rice', 'Grocery', '120', 'kg', '5', '100', 'Premium long-grain rice'];
    const csv = [headers.join(','), sample.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nava_vyapar_products_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
