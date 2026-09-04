import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { of, map, tap } from 'rxjs';
import { AppStore } from '../store/app.store';
import { ProductService } from '../../features/inventory/products/product.service';
import type { ApiProduct } from '../../features/inventory/products/product.model';

@Injectable({ providedIn: 'root' })
export class ProductCacheService {
  private readonly productService = inject(ProductService);
  private readonly store = inject(AppStore);

  private _cache: ApiProduct[] | null = null;
  private _cacheForBusinessId: number | null = null;

  /**
   * Returns cached products for the current business without a network call.
   * Fetches from the API only on first call or when force=true or business changes.
   *
   * @param force  Pass `true` to bust cache and re-fetch (e.g. after refresh button).
   */
  getProducts(force = false): Observable<ApiProduct[]> {
    const businessId = this.store.selectedBusiness()?.id ?? null;

    // Invalidate when business context changes or force refresh is requested
    if (force || this._cacheForBusinessId !== businessId) {
      this._cache = null;
      this._cacheForBusinessId = businessId;
    }

    if (this._cache !== null) {
      return of(this._cache);
    }

    return this.productService.getProducts({ page: 1, pageSize: 9999 }).pipe(
      map(res => res.data),
      tap(products => { this._cache = products; }),
    );
  }

  /** Explicitly invalidate the cache (call after adding / deleting products). */
  invalidate(): void {
    this._cache = null;
  }
}
