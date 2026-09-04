import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InvoiceService } from './invoice.service';
import { ToastService } from '@core/services/toast.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { InvoiceViewDialogComponent } from './components/invoice-view-dialog/invoice-view-dialog.component';
import { INVOICE_STATUS_CONFIG } from './invoice.model';
import type { ApiInvoice, Invoice, InvoiceStatus, InvoiceSummary } from './invoice.model';
import type { PaginationParams } from '@shared/models/api.model';
import type { InvoiceFilters } from './invoice.model';

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
  private readonly search$ = new Subject<string>();

  protected readonly statusConfig = INVOICE_STATUS_CONFIG as Record<
    string,
    { label: string; color: string; icon: string }
  >;
  protected readonly displayedColumns = [
    'billNo',
    'customerName',
    'date',
    'totalPrice',
    // 'balance',
    'status',
    'actions',
  ];
  protected readonly statusOptions = Object.entries(INVOICE_STATUS_CONFIG).map(([value, cfg]) => ({
    value: value as InvoiceStatus,
    label: cfg.label,
  }));

  protected readonly loading = signal(false);
  protected readonly invoices = signal<ApiInvoice[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly currentPage = signal(1);
  protected readonly summary = signal<InvoiceSummary | null>(null);
  protected readonly emptyMessage = signal<string>('No invoices yet');

  protected searchQuery = '';
  protected selectedStatus = '';
  protected dateFrom = '';
  protected dateTo = '';
  protected pageSize = 10;

  protected hasActiveFilters = () =>
    !!this.searchQuery || !!this.selectedStatus || !!this.dateFrom || !!this.dateTo;

  constructor() {
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadInvoices();
      });
  }

  ngOnInit(): void {
    this.loadInvoices();
    this.loadSummary();
  }

  private loadInvoices(): void {
    this.loading.set(true);
    const params: PaginationParams & InvoiceFilters = {
      page: this.currentPage(),
      pageSize: this.pageSize,
      search: this.searchQuery || undefined,
      status: (this.selectedStatus as InvoiceStatus) || undefined,
      dateFrom: this.dateFrom || undefined,
      dateTo: this.dateTo || undefined,
    };
    this.invoiceService.getInvoices(params).subscribe({
      next: res => {
        this.invoices.set(res.data);
        this.totalCount.set(res.total);
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

  onSearch(val: string): void {
    this.search$.next(val);
  }
  clearSearch(): void {
    this.searchQuery = '';
    this.search$.next('');
  }
  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadInvoices();
  }

  refresh(): void {
    this.loadInvoices();
    this.loadSummary();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.currentPage.set(1);
    this.loadInvoices();
  }

  onPageChange(e: PageEvent): void {
    this.pageSize = e.pageSize;
    this.currentPage.set(e.pageIndex + 1);
    this.loadInvoices();
  }

  isOverdue(invoice: ApiInvoice): boolean {
    return (
      invoice.status !== 'Paid' &&
      invoice.status !== 'Cancelled' &&
      new Date(invoice.date) < new Date()
    );
  }

  viewInvoice(invoice: ApiInvoice): void {
    this.dialog
      .open(InvoiceViewDialogComponent, {
        data: { invoice },
        width: '780px',
        maxHeight: '92vh',
        panelClass: 'nv-dialog',
      })
      .afterClosed()
      .subscribe(result => {
        if (result === 'refresh') {
          this.loadInvoices();
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
      width: '780px',
      maxHeight: '92vh',
      panelClass: 'nv-dialog',
    });
  }

  deleteInvoice(invoice: ApiInvoice): void {
    if (!confirm(`Delete invoice ${invoice.billNo}? This cannot be undone.`)) return;
    this.invoiceService.deleteInvoice(String(invoice.id)).subscribe({
      next: res => {
        this.toast.success(res.message);
        this.loadInvoices();
        this.loadSummary();
      },
      error: () => this.toast.error('Failed to delete invoice'),
    });
  }

  exportCsv(): void {
    const rows = [
      ['Invoice #', 'Customer', 'Mobile', 'Date', 'Total', 'Status'],
      ...this.invoices().map(i => [
        i.billNo,
        i.customerName,
        i.customerMobile,
        i.date,
        i.totalPrice,
        i.balance,
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
