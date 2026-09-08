import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { throwError, map, catchError, of } from 'rxjs';
import { environment } from '@env/environment';
import { AppStore } from '../../../core/store/app.store';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@shared/models/api.model';
import type {
  Invoice, ApiInvoice, ApiInvoiceDetail, CreateInvoiceRequest, UpdateInvoiceRequest,
  InvoiceFilters, InvoiceSummary, InvoicePayment, ApiCreateInvoiceRequest,
} from './invoice.model';

interface InvoicesApiResponse {
  status: string;
  statusMessage: string;
  displayMessage: string;
  invoices: ApiInvoice[];
}

interface CreateInvoiceApiResponse {
  status: string;
  statusMessage: string;
  displayMessage: string;
  invoice: unknown;
}

interface PatchReceivedResponse {
  status: string;
  statusMessage: string;
  displayMessage: string;
  invoice?: unknown;
}

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(AppStore);
  private readonly BASE = `${environment.apiBaseUrl}/invoices`;

  private get businessId(): number | null {
    return this.store.selectedBusiness()?.id ?? null;
  }

  getInvoices(params: PaginationParams & InvoiceFilters): Observable<PaginatedResponse<ApiInvoice>> {
    let p = new HttpParams();
    if (this.businessId !== null) p = p.set('businessId', this.businessId);
    if (params.status)   p = p.set('status', params.status);
    if (params.search)   p = p.set('search', params.search);
    if (params.dateFrom) p = p.set('dateFrom', params.dateFrom);
    if (params.dateTo)   p = p.set('dateTo', params.dateTo);

    return this.http.get<InvoicesApiResponse>(this.BASE, { params: p }).pipe(
      map(res => ({
        data: res.invoices ?? [],
        total: res.invoices?.length ?? 0,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: Math.ceil((res.invoices?.length ?? 0) / params.pageSize),
        displayMessage: res.displayMessage,
      })),
      catchError(err => {
        if (err?.error?.status === 'success') {
          const invoices: ApiInvoice[] = err.error.invoices ?? [];
          return of({
            data: invoices,
            total: invoices.length,
            page: params.page,
            pageSize: params.pageSize,
            totalPages: Math.ceil(invoices.length / params.pageSize),
            displayMessage: err.error.displayMessage as string | undefined,
          });
        }
        return throwError(() => err);
      }),
    );
  }

  getInvoice(id: string): Observable<ApiResponse<Invoice>> {
    return this.http.get<ApiResponse<Invoice>>(`${this.BASE}/${id}?businessId=${this.businessId}`);
  }

  getInvoiceDetail(id: number): Observable<ApiInvoiceDetail> {
    let p = new HttpParams();
    if (this.businessId !== null) p = p.set('businessId', this.businessId);
    return this.http.get<{ invoice: ApiInvoiceDetail }>(`${this.BASE}/${id}`, { params: p }).pipe(
      map(res => res.invoice),
      catchError(err => {
        if (err?.error?.status === 'success') return of(err.error.invoice as ApiInvoiceDetail);
        return throwError(() => err);
      }),
    );
  }

  createInvoice(payload: ApiCreateInvoiceRequest): Observable<CreateInvoiceApiResponse> {
    return this.http.post<CreateInvoiceApiResponse>(this.BASE, payload).pipe(
      catchError(err => {
        if (err?.error?.status === 'success') {
          return of(err.error as CreateInvoiceApiResponse);
        }
        return throwError(() => err);
      }),
    );
  }

  updateInvoice(payload: UpdateInvoiceRequest): Observable<ApiResponse<Invoice>> {
    return this.http.put<ApiResponse<Invoice>>(`${this.BASE}/${payload.id}`, payload);
  }

  /** PATCH /api/invoices/:id?businessId= */
  patchInvoiceReceived(invoiceId: number, received: number): Observable<PatchReceivedResponse> {
    let p = new HttpParams();
    if (this.businessId !== null) p = p.set('businessId', this.businessId);
    return this.http.put<PatchReceivedResponse>(
      `${this.BASE}/${invoiceId}`,
      { received },
      { params: p },
    ).pipe(
      catchError(err => {
        if (err?.error?.status === 'success') return of(err.error as PatchReceivedResponse);
        return throwError(() => err);
      }),
    );
  }

  deleteInvoice(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.BASE}/${id}`);
  }

  recordPayment(invoiceId: string, payment: Omit<InvoicePayment, 'id'>): Observable<ApiResponse<Invoice>> {
    return this.http.post<ApiResponse<Invoice>>(`${this.BASE}/${invoiceId}/payments`, payment);
  }

  getSummary(): Observable<ApiResponse<InvoiceSummary>> {
    let p = new HttpParams();
    if (this.businessId !== null) p = p.set('businessId', this.businessId);
    return this.http.get<ApiResponse<InvoiceSummary>>(`${this.BASE}/summary`, { params: p });
  }
}
