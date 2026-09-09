import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf, NgClass, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import type { PageEvent } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { InvoiceService } from './invoice.service';
import { ToastService } from '@core/services/toast.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { InvoiceViewDialogComponent } from './components/invoice-view-dialog/invoice-view-dialog.component';
import { INVOICE_STATUS_CONFIG } from './invoice.model';
import type { ApiInvoice, InvoiceStatus, InvoiceSummary } from './invoice.model';

// The API returns these exact title-case strings for status
const API_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'Paid',           label: 'Paid' },
  { value: 'Partially Paid', label: 'Partially Paid' },
  { value: 'Pending',        label: 'Pending' },
  { value: 'Cancelled',      label: 'Cancelled' },
];

@Component({
  selector: 'nv-invoices',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgFor,
    NgIf,
    NgClass,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    PageHeaderComponent,
  ],
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss'],
})
export class InvoicesComponent implements OnInit {
  protected readonly router = inject(Router);
  protected readonly route = inject(ActivatedRoute);
  private readonly invoiceService = inject(InvoiceService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  protected readonly statusConfig = INVOICE_STATUS_CONFIG as Record<
    string,
    { label: string; color: string; icon: string }
  >;
  protected readonly displayedColumns = [
    'billNo',
    'customerName',
    'date',
    'totalPrice',
    'status',
    'actions',
  ];

  // Status options use the real API strings so filtering matches exactly
  protected readonly statusOptions = API_STATUS_OPTIONS;

  // ── State ──────────────────────────────────────────────────────────────────
  protected readonly loading = signal(false);
  /** Full list from the API — never touched except on refresh */
  protected readonly allInvoices = signal<ApiInvoice[]>([]);
  protected readonly currentPage = signal(1);
  protected readonly summary = signal<InvoiceSummary | null>(null);
  protected readonly emptyMessage = signal<string>('No invoices yet');

  protected readonly pageSizeSignal = signal(10);
  get pageSize(): number { return this.pageSizeSignal(); }
  set pageSize(v: number) { this.pageSizeSignal.set(v); }

  // Filter state — all signals so computed() tracks them
  protected readonly searchQuerySignal = signal('');
  protected readonly selectedStatusSignal = signal('');
  protected readonly dateFromSignal = signal('');
  protected readonly dateToSignal = signal('');

  // ngModel shims — getters read the signal, setters write it
  get searchQuery(): string { return this.searchQuerySignal(); }
  set searchQuery(v: string) { this.searchQuerySignal.set(v); }

  get selectedStatus(): string { return this.selectedStatusSignal(); }
  set selectedStatus(v: string) { this.selectedStatusSignal.set(v); }

  get dateFrom(): string { return this.dateFromSignal(); }
  set dateFrom(v: string) { this.dateFromSignal.set(v); }

  get dateTo(): string { return this.dateToSignal(); }
  set dateTo(v: string) { this.dateToSignal.set(v); }

  // ── Client-side derived data ───────────────────────────────────────────────
  protected readonly filteredInvoices = computed(() => {
    const q      = this.searchQuerySignal().toLowerCase().trim();
    const status = this.selectedStatusSignal();
    const from   = this.dateFromSignal();
    const to     = this.dateToSignal();

    let result = this.allInvoices();

    // Search: invoice number, customer name, phone
    if (q) {
      result = result.filter(inv =>
        inv.billNo.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.customerMobile ?? '').toLowerCase().includes(q),
      );
    }

    // Status: exact match against API string ("Paid", "Partially Paid", etc.)
    if (status) {
      result = result.filter(inv => inv.status === status);
    }

    // Date range — compare ISO date strings (yyyy-mm-dd prefix comparison works)
    if (from) {
      result = result.filter(inv => inv.date >= from);
    }
    if (to) {
      result = result.filter(inv => inv.date <= to);
    }

    return result;
  });

  protected readonly filteredCount = computed(() => this.filteredInvoices().length);

  protected readonly pagedInvoices = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSizeSignal();
    return this.filteredInvoices().slice(start, start + this.pageSizeSignal());
  });

  protected readonly hasActiveFilters = computed(() =>
    !!this.searchQuerySignal() ||
    !!this.selectedStatusSignal() ||
    !!this.dateFromSignal() ||
    !!this.dateToSignal(),
  );

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadInvoices();
    this.loadSummary();
  }

  private loadInvoices(force = false): void {
    // Skip if data already loaded and not forced
    if (!force && this.allInvoices().length > 0) return;

    this.loading.set(true);
    this.invoiceService.getInvoices({ page: 1, pageSize: 9999 }).subscribe({
      next: res => {
        this.allInvoices.set(res.data);
        if (res.displayMessage) this.emptyMessage.set(res.displayMessage);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load invoices');
        this.loading.set(false);
      },
    });
  }

  private loadSummary(): void {
    this.invoiceService.getSummary().subscribe({
      next: res => this.summary.set(res.data),
    });
  }

  // ── Filter handlers — just reset page; computed does the filtering ─────────
  onSearch(_val: string): void {
    this.currentPage.set(1);
  }

  clearSearch(): void {
    this.searchQuerySignal.set('');
    this.currentPage.set(1);
  }

  onFilterChange(): void {
    this.currentPage.set(1);
  }

  refresh(): void {
    this.loadInvoices(true);
    this.loadSummary();
  }

  clearFilters(): void {
    this.searchQuerySignal.set('');
    this.selectedStatusSignal.set('');
    this.dateFromSignal.set('');
    this.dateToSignal.set('');
    this.currentPage.set(1);
  }

  onPageChange(e: PageEvent): void {
    this.pageSize = e.pageSize;
    this.currentPage.set(e.pageIndex + 1);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  isOverdue(invoice: ApiInvoice): boolean {
    return (
      invoice.status !== 'Paid' &&
      invoice.status !== 'Cancelled' &&
      new Date(invoice.date) < new Date()
    );
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  viewInvoice(invoice: ApiInvoice): void {
    this.dialog
      .open(InvoiceViewDialogComponent, {
        data: { invoice },
        width: '500px',
        maxWidth: '95vw',
        maxHeight: '92vh',
        panelClass: 'nv-dialog',
      })
      .afterClosed()
      .subscribe(result => {
        if (result === 'refresh') {
          this.loadInvoices(true);
          this.loadSummary();
        }
      });
  }

  editInvoice(invoice: ApiInvoice): void {
    this.router.navigate([invoice.id, 'edit'], { relativeTo: this.route });
  }

  printInvoice(invoice: ApiInvoice): void {
    this.dialog.open(InvoiceViewDialogComponent, {
      data: { invoice, autoPrint: true },
      width: '500px',
      maxWidth: '95vw',
      maxHeight: '92vh',
      panelClass: 'nv-dialog',
    });
  }

  deleteInvoice(invoice: ApiInvoice): void {
    if (!confirm(`Delete invoice ${invoice.billNo}? This cannot be undone.`)) return;
    this.invoiceService.deleteInvoice(String(invoice.id)).subscribe({
      next: res => {
        this.toast.success(res.message);
        this.loadInvoices(true);
        this.loadSummary();
      },
      error: () => this.toast.error('Failed to delete invoice'),
    });
  }

  exportCsv(): void {
    // Export respects active filters — exports what the user currently sees
    const rows = [
      ['Invoice #', 'Customer', 'Mobile', 'Date', 'Total', 'Status'],
      ...this.filteredInvoices().map(i => [
        i.billNo,
        i.customerName,
        i.customerMobile,
        i.date,
        i.totalPrice,
        i.status,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoices.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
