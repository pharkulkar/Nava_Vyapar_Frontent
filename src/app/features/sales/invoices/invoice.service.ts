import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, throwError } from 'rxjs';
import { environment } from '@env/environment';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@shared/models/api.model';
import type { Product } from '../../inventory/products/product.model';
import type {
  Invoice, CreateInvoiceRequest, UpdateInvoiceRequest,
  InvoiceFilters, InvoiceSummary, InvoicePayment, PaymentMethod, InvoiceLineItem,
} from './invoice.model';

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — remove this section when connecting a real backend
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_INVOICES: Invoice[] = [
  {
    id: '1', invoiceNumber: 'INV-2025-001', status: 'paid',
    customerName: 'Rajesh Kumar', customerPhone: '9876543210',
    customerEmail: 'rajesh@example.com', customerAddress: '12, MG Road, Pune, Maharashtra 411001',
    customerGstin: '27AAPFU0939F1ZV',
    issueDate: '2025-01-05', dueDate: '2025-02-05',
    lineItems: [
      { id: 'li1', productId: '1', productName: 'Wireless Keyboard', sku: 'EL-WK-001', unit: 'pcs', quantity: 2, unitPrice: 1299, discountPercent: 5, discountAmount: 129.9, taxRate: 18, taxAmount: 427.72, subtotal: 2598, total: 2895.82 },
      { id: 'li2', productId: '10', productName: 'HDMI Cable 2m', sku: 'EL-HC-010', unit: 'pcs', quantity: 3, unitPrice: 349, discountPercent: 0, discountAmount: 0, taxRate: 18, taxAmount: 188.46, subtotal: 1047, total: 1235.46 },
    ],
    subtotal: 3645, totalDiscount: 129.9, totalTax: 616.18, grandTotal: 4131.28,
    amountPaid: 4131.28, balanceDue: 0,
    payments: [{ id: 'p1', date: '2025-01-10', amount: 4131.28, method: 'upi', reference: 'UPI123456' }],
    notes: 'Thank you for your business!',
    termsAndConditions: 'Payment due within 30 days.',
    createdAt: '2025-01-05T10:00:00Z', updatedAt: '2025-01-10T10:00:00Z',
  },
  {
    id: '2', invoiceNumber: 'INV-2025-002', status: 'sent',
    customerName: 'Priya Sharma', customerPhone: '9123456780',
    customerEmail: 'priya@techcorp.in', customerAddress: '45, Baner Road, Pune, Maharashtra 411045',
    issueDate: '2025-01-15', dueDate: '2025-02-15',
    lineItems: [
      { id: 'li3', productId: '5', productName: 'Office Chair Ergonomic', sku: 'FN-OC-005', unit: 'pcs', quantity: 4, unitPrice: 12999, discountPercent: 10, discountAmount: 5199.6, taxRate: 18, taxAmount: 8279.35, subtotal: 51996, total: 55075.75 },
    ],
    subtotal: 51996, totalDiscount: 5199.6, totalTax: 8279.35, grandTotal: 55075.75,
    amountPaid: 0, balanceDue: 55075.75,
    payments: [],
    notes: 'Bulk order discount applied.',
    createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-01-15T10:00:00Z',
  },
  {
    id: '3', invoiceNumber: 'INV-2025-003', status: 'overdue',
    customerName: 'Amit Patel', customerPhone: '9988776655',
    customerAddress: '78, FC Road, Pune, Maharashtra 411004',
    issueDate: '2024-12-01', dueDate: '2025-01-01',
    lineItems: [
      { id: 'li4', productId: '7', productName: 'Laptop Stand Aluminium', sku: 'EL-LS-007', unit: 'pcs', quantity: 1, unitPrice: 2499, discountPercent: 0, discountAmount: 0, taxRate: 18, taxAmount: 449.82, subtotal: 2499, total: 2948.82 },
      { id: 'li5', productId: '3', productName: 'A4 Printing Paper (500 sheets)', sku: 'ST-PP-003', unit: 'pack', quantity: 10, unitPrice: 280, discountPercent: 5, discountAmount: 140, taxRate: 12, taxAmount: 316.8, subtotal: 2800, total: 2976.8 },
    ],
    subtotal: 5299, totalDiscount: 140, totalTax: 766.62, grandTotal: 5925.62,
    amountPaid: 2000, balanceDue: 3925.62,
    payments: [{ id: 'p2', date: '2024-12-15', amount: 2000, method: 'cash' }],
    createdAt: '2024-12-01T10:00:00Z', updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: '4', invoiceNumber: 'INV-2025-004', status: 'draft',
    customerName: 'Sunita Desai',
    issueDate: '2025-01-20', dueDate: '2025-02-20',
    lineItems: [
      { id: 'li6', productId: '8', productName: 'Green Tea 100 Bags', sku: 'FB-GT-008', unit: 'pack', quantity: 5, unitPrice: 199, discountPercent: 0, discountAmount: 0, taxRate: 5, taxAmount: 49.75, subtotal: 995, total: 1044.75 },
    ],
    subtotal: 995, totalDiscount: 0, totalTax: 49.75, grandTotal: 1044.75,
    amountPaid: 0, balanceDue: 1044.75,
    payments: [],
    createdAt: '2025-01-20T10:00:00Z', updatedAt: '2025-01-20T10:00:00Z',
  },
  {
    id: '5', invoiceNumber: 'INV-2025-005', status: 'partial',
    customerName: 'Vikram Singh', customerPhone: '9765432100',
    customerEmail: 'vikram@startup.io',
    issueDate: '2025-01-18', dueDate: '2025-02-18',
    lineItems: [
      { id: 'li7', productId: '2', productName: 'USB-C Hub 7-in-1', sku: 'EL-HB-002', unit: 'pcs', quantity: 6, unitPrice: 1999, discountPercent: 8, discountAmount: 959.52, taxRate: 18, taxAmount: 1869.21, subtotal: 11994, total: 12903.69 },
    ],
    subtotal: 11994, totalDiscount: 959.52, totalTax: 1869.21, grandTotal: 12903.69,
    amountPaid: 6000, balanceDue: 6903.69,
    payments: [{ id: 'p3', date: '2025-01-20', amount: 6000, method: 'bank_transfer', reference: 'NEFT20250120' }],
    createdAt: '2025-01-18T10:00:00Z', updatedAt: '2025-01-20T10:00:00Z',
  },
];

// Shared mock product list for product search (mirrors product.service mock)
const MOCK_PRODUCTS: Pick<Product, 'id' | 'name' | 'sku' | 'sellingPrice' | 'taxRate' | 'unit' | 'stockQuantity' | 'status'>[] = [
  { id: '1',  name: 'Wireless Keyboard',           sku: 'EL-WK-001', sellingPrice: 1299, taxRate: 18, unit: 'pcs',  stockQuantity: 45, status: 'active' },
  { id: '2',  name: 'USB-C Hub 7-in-1',            sku: 'EL-HB-002', sellingPrice: 1999, taxRate: 18, unit: 'pcs',  stockQuantity: 8,  status: 'active' },
  { id: '3',  name: 'A4 Printing Paper (500 sheets)', sku: 'ST-PP-003', sellingPrice: 280, taxRate: 12, unit: 'pack', stockQuantity: 120, status: 'active' },
  { id: '4',  name: 'Ball Pen Blue (Box of 10)',   sku: 'ST-BP-004', sellingPrice: 75,   taxRate: 12, unit: 'box',  stockQuantity: 200, status: 'active' },
  { id: '5',  name: 'Office Chair Ergonomic',      sku: 'FN-OC-005', sellingPrice: 12999, taxRate: 18, unit: 'pcs', stockQuantity: 5,  status: 'active' },
  { id: '6',  name: 'Hand Sanitizer 500ml',        sku: 'CM-HS-006', sellingPrice: 149,  taxRate: 12, unit: 'ml',  stockQuantity: 0,  status: 'inactive' },
  { id: '7',  name: 'Laptop Stand Aluminium',      sku: 'EL-LS-007', sellingPrice: 2499, taxRate: 18, unit: 'pcs', stockQuantity: 22, status: 'active' },
  { id: '8',  name: 'Green Tea 100 Bags',          sku: 'FB-GT-008', sellingPrice: 199,  taxRate: 5,  unit: 'pack', stockQuantity: 60, status: 'active' },
  { id: '9',  name: 'Sticky Notes 3x3 (Pack of 5)', sku: 'ST-SN-009', sellingPrice: 99, taxRate: 12, unit: 'pack', stockQuantity: 3,  status: 'draft' },
  { id: '10', name: 'HDMI Cable 2m',               sku: 'EL-HC-010', sellingPrice: 349,  taxRate: 18, unit: 'pcs', stockQuantity: 35, status: 'active' },
];

let _mockDb = [...MOCK_INVOICES];
let _nextId = 6;
let _nextInvNum = 6;

function _pad(n: number): string { return String(n).padStart(3, '0'); }
function _nextNumber(): string { return `INV-2025-${_pad(_nextInvNum++)}`; }

function _mockFilter(items: Invoice[], params: PaginationParams & InvoiceFilters) {
  let list = [...items];
  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter(i =>
      i.invoiceNumber.toLowerCase().includes(q) ||
      i.customerName.toLowerCase().includes(q) ||
      (i.customerPhone ?? '').includes(q),
    );
  }
  if (params.status) list = list.filter(i => i.status === params.status);
  if (params.dateFrom) list = list.filter(i => i.issueDate >= params.dateFrom!);
  if (params.dateTo)   list = list.filter(i => i.issueDate <= params.dateTo!);
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const total = list.length;
  const start = (params.page - 1) * params.pageSize;
  return { data: list.slice(start, start + params.pageSize), total, page: params.page, pageSize: params.pageSize, totalPages: Math.ceil(total / params.pageSize) };
}
// ─────────────────────────────────────────────────────────────────────────────
// END MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly http = inject(HttpClient);
  private readonly BASE = `${environment.apiBaseUrl}/sales/invoices`;

  getInvoices(params: PaginationParams & InvoiceFilters): Observable<PaginatedResponse<Invoice>> {
    // ── MOCK ─────────────────────────────────────────────────────────────────
    if (!environment.production) {
      return of(_mockFilter(_mockDb, params)).pipe(delay(400));
    }
    // ── REAL ─────────────────────────────────────────────────────────────────
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.search)   p = p.set('search', params.search);
    if (params.status)   p = p.set('status', params.status);
    if (params.dateFrom) p = p.set('dateFrom', params.dateFrom);
    if (params.dateTo)   p = p.set('dateTo', params.dateTo);
    return this.http.get<PaginatedResponse<Invoice>>(this.BASE, { params: p });
  }

  getInvoice(id: string): Observable<ApiResponse<Invoice>> {
    // ── MOCK ─────────────────────────────────────────────────────────────────
    if (!environment.production) {
      const inv = _mockDb.find(i => i.id === id);
      if (!inv) return throwError(() => new Error('Invoice not found'));
      return of({ data: inv, message: 'OK', success: true, timestamp: new Date().toISOString() }).pipe(delay(200));
    }
    // ── REAL ─────────────────────────────────────────────────────────────────
    return this.http.get<ApiResponse<Invoice>>(`${this.BASE}/${id}`);
  }

  createInvoice(payload: CreateInvoiceRequest): Observable<ApiResponse<Invoice>> {
    // ── MOCK ─────────────────────────────────────────────────────────────────
    if (!environment.production) {
      const now = new Date().toISOString();
      const inv: Invoice = {
        ...payload,
        id: String(_nextId++),
        invoiceNumber: _nextNumber(),
        lineItems: payload.lineItems.map((li, i) => ({ ...li, id: `li-new-${i}` })),
        subtotal: payload.lineItems.reduce((s, li) => s + li.subtotal, 0),
        totalDiscount: payload.lineItems.reduce((s, li) => s + li.discountAmount, 0),
        totalTax: payload.lineItems.reduce((s, li) => s + li.taxAmount, 0),
        grandTotal: payload.lineItems.reduce((s, li) => s + li.total, 0),
        amountPaid: 0,
        balanceDue: payload.lineItems.reduce((s, li) => s + li.total, 0),
        payments: [],
        createdAt: now,
        updatedAt: now,
      };
      _mockDb = [inv, ..._mockDb];
      return of({ data: inv, message: 'Invoice created successfully', success: true, timestamp: now }).pipe(delay(600));
    }
    // ── REAL ─────────────────────────────────────────────────────────────────
    return this.http.post<ApiResponse<Invoice>>(this.BASE, payload);
  }

  updateInvoice(payload: UpdateInvoiceRequest): Observable<ApiResponse<Invoice>> {
    // ── MOCK ─────────────────────────────────────────────────────────────────
    if (!environment.production) {
      const idx = _mockDb.findIndex(i => i.id === payload.id);
      if (idx === -1) return throwError(() => new Error('Invoice not found'));
      const updated: Invoice = {
        ..._mockDb[idx],
        ...payload,
        lineItems: (payload.lineItems ?? _mockDb[idx].lineItems).map((li, i) => ({ ...li, id: (li as Partial<InvoiceLineItem>).id ?? `li-upd-${i}` })),
        updatedAt: new Date().toISOString(),
      };
      updated.subtotal      = updated.lineItems.reduce((s, li) => s + li.subtotal, 0);
      updated.totalDiscount = updated.lineItems.reduce((s, li) => s + li.discountAmount, 0);
      updated.totalTax      = updated.lineItems.reduce((s, li) => s + li.taxAmount, 0);
      updated.grandTotal    = updated.lineItems.reduce((s, li) => s + li.total, 0);
      updated.balanceDue    = updated.grandTotal - updated.amountPaid;
      _mockDb[idx] = updated;
      return of({ data: updated, message: 'Invoice updated successfully', success: true, timestamp: new Date().toISOString() }).pipe(delay(500));
    }
    // ── REAL ─────────────────────────────────────────────────────────────────
    return this.http.put<ApiResponse<Invoice>>(`${this.BASE}/${payload.id}`, payload);
  }

  deleteInvoice(id: string): Observable<ApiResponse<null>> {
    // ── MOCK ─────────────────────────────────────────────────────────────────
    if (!environment.production) {
      _mockDb = _mockDb.filter(i => i.id !== id);
      return of({ data: null, message: 'Invoice deleted', success: true, timestamp: new Date().toISOString() }).pipe(delay(400));
    }
    // ── REAL ─────────────────────────────────────────────────────────────────
    return this.http.delete<ApiResponse<null>>(`${this.BASE}/${id}`);
  }

  recordPayment(invoiceId: string, payment: Omit<InvoicePayment, 'id'>): Observable<ApiResponse<Invoice>> {
    // ── MOCK ─────────────────────────────────────────────────────────────────
    if (!environment.production) {
      const idx = _mockDb.findIndex(i => i.id === invoiceId);
      if (idx === -1) return throwError(() => new Error('Invoice not found'));
      const inv = { ..._mockDb[idx] };
      const newPayment: InvoicePayment = { ...payment, id: `p-${Date.now()}` };
      inv.payments = [...inv.payments, newPayment];
      inv.amountPaid = inv.payments.reduce((s, p) => s + p.amount, 0);
      inv.balanceDue = inv.grandTotal - inv.amountPaid;
      inv.status = inv.balanceDue <= 0 ? 'paid' : 'partial';
      inv.updatedAt = new Date().toISOString();
      _mockDb[idx] = inv;
      return of({ data: inv, message: 'Payment recorded', success: true, timestamp: new Date().toISOString() }).pipe(delay(400));
    }
    // ── REAL ─────────────────────────────────────────────────────────────────
    return this.http.post<ApiResponse<Invoice>>(`${this.BASE}/${invoiceId}/payments`, payment);
  }

  getSummary(): Observable<ApiResponse<InvoiceSummary>> {
    // ── MOCK ─────────────────────────────────────────────────────────────────
    if (!environment.production) {
      const summary: InvoiceSummary = {
        total: _mockDb.length,
        draft:   _mockDb.filter(i => i.status === 'draft').length,
        sent:    _mockDb.filter(i => i.status === 'sent').length,
        paid:    _mockDb.filter(i => i.status === 'paid').length,
        overdue: _mockDb.filter(i => i.status === 'overdue').length,
        totalRevenue:     _mockDb.filter(i => i.status === 'paid').reduce((s, i) => s + i.grandTotal, 0),
        totalOutstanding: _mockDb.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + i.balanceDue, 0),
      };
      return of({ data: summary, message: 'OK', success: true, timestamp: new Date().toISOString() }).pipe(delay(300));
    }
    // ── REAL ─────────────────────────────────────────────────────────────────
    return this.http.get<ApiResponse<InvoiceSummary>>(`${this.BASE}/summary`);
  }

  /** Product search — used in invoice form (like a POS search) */
  searchProducts(query: string): Observable<ApiResponse<typeof MOCK_PRODUCTS>> {
    // ── MOCK ─────────────────────────────────────────────────────────────────
    if (!environment.production) {
      const q = query.toLowerCase().trim();
      const results = q
        ? MOCK_PRODUCTS.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q),
          )
        : MOCK_PRODUCTS.slice(0, 8);
      return of({ data: results, message: 'OK', success: true, timestamp: new Date().toISOString() }).pipe(delay(150));
    }
    // ── REAL ─────────────────────────────────────────────────────────────────
    return this.http.get<ApiResponse<typeof MOCK_PRODUCTS>>(
      `${environment.apiBaseUrl}/inventory/products/search`,
      { params: new HttpParams().set('q', query).set('limit', '10') },
    );
  }
}
