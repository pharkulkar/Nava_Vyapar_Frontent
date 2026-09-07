export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'card' | 'credit';

// Shape returned by GET /invoices from the real API
export interface ApiInvoice {
  id: number;
  billNo: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  totalPrice: string;
  discount: string;
  received: string;
  balance: string;
  status: string;
  date: string;
}

// Item inside a detailed invoice (GET /invoices/:id)
export interface ApiInvoiceItem {
  id: number;
  productId: number;
  productName: string;
  price: string;
  qty: number;
  discount: string;
  gstRate: string;
  total: string;
}

// Full invoice returned by GET /invoices/:id
export interface ApiInvoiceDetail extends ApiInvoice {
  businessId: number;
  items: ApiInvoiceItem[];
}

export interface InvoiceLineItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;   // qty * unitPrice
  total: number;      // subtotal - discount + tax
}

export interface InvoicePayment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  note?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerGstin?: string;
  billingAddress?: string;
  shippingAddress?: string;
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  payments: InvoicePayment[];
  notes?: string;
  termsAndConditions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceRequest {
  businessId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerGstin?: string;
  billingAddress?: string;
  shippingAddress?: string;
  issueDate: string;
  dueDate: string;
  lineItems: Omit<InvoiceLineItem, 'id'>[];
  notes?: string;
  termsAndConditions?: string;
  status: InvoiceStatus;
}

export interface UpdateInvoiceRequest extends Partial<CreateInvoiceRequest> {
  id: string;
}

// ── Real API create/update request shape ─────────────────────────────────────
export interface ApiCreateInvoiceItem {
  productId: number;
  productName: string;
  qty: number;
  price: number;
  discount: number;   // per-item discount %
  gstRate: number;
}

export interface ApiCreateInvoiceRequest {
  businessId: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  discount: number;   // invoice-level discount (flat amount or %)
  received: number;   // amount received upfront
  items: ApiCreateInvoiceItem[];
}

export interface InvoiceFilters {
  search?: string;
  status?: InvoiceStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface InvoiceSummary {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  totalRevenue: number;
  totalOutstanding: number;
}

export const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: 'Cash', value: 'cash' },
  { label: 'UPI', value: 'upi' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Cheque', value: 'cheque' },
  { label: 'Card', value: 'card' },
  { label: 'Credit', value: 'credit' },
];

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; icon: string }> = {
  draft:     { label: 'Draft',     color: 'gray',   icon: 'edit_note' },
  sent:      { label: 'Sent',      color: 'blue',   icon: 'send' },
  paid:      { label: 'Paid',      color: 'green',  icon: 'check_circle' },
  partial:   { label: 'Partial',   color: 'amber',  icon: 'pending' },
  overdue:   { label: 'Overdue',   color: 'red',    icon: 'schedule' },
  cancelled: { label: 'Cancelled', color: 'slate',  icon: 'cancel' },
};
