export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'card' | 'credit';

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
