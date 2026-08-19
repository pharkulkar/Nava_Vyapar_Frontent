import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal, computed,
} from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InvoiceService } from '../../invoice.service';
import { ToastService } from '@core/services/toast.service';
import type { InvoiceLineItem, CreateInvoiceRequest } from '../../invoice.model';

interface ProductSearchResult {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  taxRate: number;
  unit: string;
  stockQuantity: number;
  status: string;
}

interface InvoiceForm {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerGstin: string;
  issueDate: string;
  dueDate: string;
  notes: string;
  termsAndConditions: string;
}

@Component({
  selector: 'nv-invoice-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgFor, NgIf, FormsModule, CurrencyPipe,
    MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTooltipModule, MatProgressSpinnerModule, MatDividerModule,
  ],
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.scss'],
})
export class InvoiceFormComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly invoiceService = inject(InvoiceService);
  private readonly toast = inject(ToastService);
  private readonly productSearch$ = new Subject<string>();

  protected isEdit = false;
  protected editId = '';
  protected invoiceNumber = '';
  protected selectedTerms = '30';

  protected readonly saving = signal(false);
  protected readonly productSearchLoading = signal(false);
  protected readonly productResults = signal<ProductSearchResult[]>([]);
  protected readonly lineItems = signal<InvoiceLineItem[]>([]);

  protected productSearchQuery = '';
  protected showDropdown = false;
  protected highlightedIndex = -1;

  protected form: InvoiceForm = {
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    customerGstin: '',
    issueDate: this._today(),
    dueDate: this._addDays(30),
    notes: 'Thank you for your business!',
    termsAndConditions: 'Payment due within 30 days.',
  };

  protected readonly totals = computed(() => {
    const items = this.lineItems();
    const subtotal      = items.reduce((s, i) => s + i.subtotal, 0);
    const totalDiscount = items.reduce((s, i) => s + i.discountAmount, 0);
    const taxableAmount = subtotal - totalDiscount;
    const totalTax      = items.reduce((s, i) => s + i.taxAmount, 0);
    const grandTotal    = taxableAmount + totalTax;
    return { subtotal, totalDiscount, taxableAmount, totalTax, grandTotal };
  });

  protected readonly taxBreakdown = computed(() => {
    const map = new Map<number, number>();
    for (const item of this.lineItems()) {
      map.set(item.taxRate, (map.get(item.taxRate) ?? 0) + item.taxAmount);
    }
    return [...map.entries()].map(([rate, amount]) => ({ rate, amount })).sort((a, b) => a.rate - b.rate);
  });

  protected readonly totalQty = computed(() =>
    this.lineItems().reduce((s, i) => s + i.quantity, 0),
  );

  constructor() {
    this.productSearch$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ).subscribe(q => this._fetchProducts(q));
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.editId = id;
      this._loadInvoice(id);
    }
    // Preload product list on mount
    this._fetchProducts('');
  }

  private _loadInvoice(id: string): void {
    this.invoiceService.getInvoice(id).subscribe({
      next: res => {
        const inv = res.data;
        this.invoiceNumber = inv.invoiceNumber;
        this.form = {
          customerName: inv.customerName,
          customerPhone: inv.customerPhone ?? '',
          customerEmail: inv.customerEmail ?? '',
          customerAddress: inv.customerAddress ?? '',
          customerGstin: inv.customerGstin ?? '',
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          notes: inv.notes ?? '',
          termsAndConditions: inv.termsAndConditions ?? '',
        };
        this.lineItems.set([...inv.lineItems]);
      },
      error: () => { this.toast.error('Failed to load invoice'); this.goBack(); },
    });
  }

  private _fetchProducts(q: string): void {
    this.productSearchLoading.set(true);
    this.invoiceService.searchProducts(q).subscribe({
      next: res => { this.productResults.set(res.data as ProductSearchResult[]); this.productSearchLoading.set(false); },
      error: () => this.productSearchLoading.set(false),
    });
  }

  onProductSearch(q: string): void {
    this.showDropdown = true;
    this.highlightedIndex = -1;
    this.productSearch$.next(q);
  }

  clearProductSearch(): void {
    this.productSearchQuery = '';
    this.productResults.set([]);
    this.showDropdown = false;
  }

  closeDropdown(): void { this.showDropdown = false; }

  navigateDropdown(dir: 1 | -1): void {
    const max = this.productResults().length - 1;
    this.highlightedIndex = Math.max(0, Math.min(max, this.highlightedIndex + dir));
  }

  selectHighlighted(): void {
    const p = this.productResults()[this.highlightedIndex];
    if (p) this.addProductToInvoice(p);
  }

  addProductToInvoice(p: ProductSearchResult): void {
    this.showDropdown = false;
    this.productSearchQuery = '';

    // If already in list, just bump qty
    const existing = this.lineItems().findIndex(li => li.productId === p.id);
    if (existing !== -1) {
      this.changeQty(existing, 1);
      return;
    }

    const subtotal = p.sellingPrice;
    const taxAmount = +(subtotal * p.taxRate / 100).toFixed(2);
    const newItem: InvoiceLineItem = {
      id: `li-${Date.now()}`,
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      unit: p.unit,
      quantity: 1,
      unitPrice: p.sellingPrice,
      discountPercent: 0,
      discountAmount: 0,
      taxRate: p.taxRate,
      taxAmount,
      subtotal,
      total: +(subtotal + taxAmount).toFixed(2),
    };
    this.lineItems.update(items => [...items, newItem]);
  }

  changeQty(index: number, delta: number): void {
    this.lineItems.update(items => {
      const updated = [...items];
      const item = { ...updated[index] };
      item.quantity = Math.max(1, item.quantity + delta);
      updated[index] = this._recalcItem(item);
      return updated;
    });
  }

  onQtyChange(index: number, event: Event): void {
    const val = +(event.target as HTMLInputElement).value;
    if (isNaN(val) || val < 1) return;
    this.lineItems.update(items => {
      const updated = [...items];
      updated[index] = this._recalcItem({ ...updated[index], quantity: val });
      return updated;
    });
  }

  onPriceChange(index: number, event: Event): void {
    const val = +(event.target as HTMLInputElement).value;
    if (isNaN(val) || val < 0) return;
    this.lineItems.update(items => {
      const updated = [...items];
      updated[index] = this._recalcItem({ ...updated[index], unitPrice: val });
      return updated;
    });
  }

  onDiscountChange(index: number, event: Event): void {
    const val = Math.min(100, Math.max(0, +(event.target as HTMLInputElement).value));
    if (isNaN(val)) return;
    this.lineItems.update(items => {
      const updated = [...items];
      updated[index] = this._recalcItem({ ...updated[index], discountPercent: val });
      return updated;
    });
  }

  removeLineItem(index: number): void {
    this.lineItems.update(items => items.filter((_, i) => i !== index));
  }

  clearAllItems(): void {
    if (!confirm('Remove all line items?')) return;
    this.lineItems.set([]);
  }

  applyTerms(days: string): void {
    this.form.dueDate = this._addDays(+days, this.form.issueDate);
  }

  applyGlobalDiscount(): void {
    const input = prompt('Enter global discount % (0-100):');
    if (input === null) return;
    const pct = Math.min(100, Math.max(0, +input));
    if (isNaN(pct)) return;
    this.lineItems.update(items =>
      items.map(item => this._recalcItem({ ...item, discountPercent: pct })),
    );
  }

  private _recalcItem(item: InvoiceLineItem): InvoiceLineItem {
    const subtotal       = +(item.quantity * item.unitPrice).toFixed(2);
    const discountAmount = +(subtotal * item.discountPercent / 100).toFixed(2);
    const taxableAmt     = subtotal - discountAmount;
    const taxAmount      = +(taxableAmt * item.taxRate / 100).toFixed(2);
    const total          = +(taxableAmt + taxAmount).toFixed(2);
    return { ...item, subtotal, discountAmount, taxAmount, total };
  }

  private _validate(): string | null {
    if (!this.form.customerName.trim()) return 'Customer name is required';
    if (!this.form.issueDate) return 'Issue date is required';
    if (!this.form.dueDate) return 'Due date is required';
    if (this.lineItems().length === 0) return 'Add at least one product';
    return null;
  }

  saveDraft(): void { this._save('draft'); }
  saveAndSend(): void { this._save('sent'); }

  private _save(status: 'draft' | 'sent'): void {
    const err = this._validate();
    if (err) { this.toast.error(err); return; }

    this.saving.set(true);
    const payload: CreateInvoiceRequest = {
      ...this.form,
      status,
      lineItems: this.lineItems().map(({ id: _id, ...rest }) => rest),
    };

    const obs = this.isEdit
      ? this.invoiceService.updateInvoice({ id: this.editId, ...payload })
      : this.invoiceService.createInvoice(payload);

    obs.subscribe({
      next: res => {
        this.toast.success(res.message);
        this.saving.set(false);
        this.goBack();
      },
      error: () => { this.toast.error('Failed to save invoice'); this.saving.set(false); },
    });
  }

  goBack(): void { this.router.navigate(['../../'], { relativeTo: this.route }); }

  private _today(): string { return new Date().toISOString().split('T')[0]; }
  private _addDays(days: number, from?: string): string {
    const d = from ? new Date(from) : new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }
}
