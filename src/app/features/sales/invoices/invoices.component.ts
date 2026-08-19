import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal,
} from '@angular/core';
import { NgFor, NgIf, NgClass, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
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
import { PaymentDialogComponent } from './components/payment-dialog/payment-dialog.component';
import { INVOICE_STATUS_CONFIG } from './invoice.model';
import type { Invoice, InvoiceStatus, InvoiceSummary } from './invoice.model';
import type { PaginationParams } from '@shared/models/api.model';
import type { InvoiceFilters } from './invoice.model';

@Component({
  selector: 'nv-invoices',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgFor, NgIf, NgClass, FormsModule, CurrencyPipe, DatePipe,
    RouterLink,
    MatTableModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatMenuModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTooltipModule, MatProgressSpinnerModule, MatDividerModule,
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

  protected readonly statusConfig = INVOICE_STATUS_CONFIG as Record<string, { label: string; color: string; icon: string }>;
  protected readonly displayedColumns = ['invoiceNumber', 'customerName', 'issueDate', 'grandTotal', 'status', 'actions'];
  protected readonly statusOptions = Object.entries(INVOICE_STATUS_CONFIG).map(([value, cfg]) => ({ value: value as InvoiceStatus, label: cfg.label }));

  protected readonly loading = signal(false);
  protected readonly invoices = signal<Invoice[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly currentPage = signal(1);
  protected readonly summary = signal<InvoiceSummary | null>(null);

  protected searchQuery = '';
  protected selectedStatus = '';
  protected dateFrom = '';
  protected dateTo = '';
  protected pageSize = 10;

  protected hasActiveFilters = () =>
    !!this.searchQuery || !!this.selectedStatus || !!this.dateFrom || !!this.dateTo;

  constructor() {
    this.search$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ).subscribe(() => { this.currentPage.set(1); this.loadInvoices(); });
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
      next: res => { this.invoices.set(res.data); this.totalCount.set(res.total); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load invoices'); this.loading.set(false); },
    });
  }

  private loadSummary(): void {
    this.invoiceService.getSummary().subscribe({
      next: res => this.summary.set(res.data),
    });
  }

  onSearch(val: string): void { this.search$.next(val); }
  clearSearch(): void { this.searchQuery = ''; this.search$.next(''); }
  onFilterChange(): void { this.currentPage.set(1); this.loadInvoices(); }

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

  isOverdue(invoice: Invoice): boolean {
    return invoice.status !== 'paid' && invoice.status !== 'cancelled' && new Date(invoice.dueDate) < new Date();
  }

  viewInvoice(invoice: Invoice): void {
    this.dialog.open(InvoiceViewDialogComponent, {
      data: { invoice },
      width: '780px',
      maxHeight: '92vh',
      panelClass: 'nv-dialog',
    }).afterClosed().subscribe(result => {
      if (result === 'refresh') { this.loadInvoices(); this.loadSummary(); }
    });
  }

  editInvoice(invoice: Invoice): void {
    this.router.navigate([invoice.id, 'edit'], { relativeTo: this.route });
  }

  recordPayment(invoice: Invoice): void {
    this.dialog.open(PaymentDialogComponent, {
      data: { invoice },
      width: '480px',
      panelClass: 'nv-dialog',
    }).afterClosed().subscribe(result => {
      if (result) { this.loadInvoices(); this.loadSummary(); }
    });
  }

  printInvoice(invoice: Invoice): void {
    this.dialog.open(InvoiceViewDialogComponent, {
      data: { invoice, autoPrint: true },
      width: '780px',
      maxHeight: '92vh',
      panelClass: 'nv-dialog',
    });
  }

  deleteInvoice(invoice: Invoice): void {
    if (!confirm(`Delete invoice ${invoice.invoiceNumber}? This cannot be undone.`)) return;
    this.invoiceService.deleteInvoice(invoice.id).subscribe({
      next: res => { this.toast.success(res.message); this.loadInvoices(); this.loadSummary(); },
      error: () => this.toast.error('Failed to delete invoice'),
    });
  }

  exportCsv(): void {
    const rows = [
      ['Invoice #', 'Customer', 'Issue Date', 'Due Date', 'Amount', 'Balance', 'Status'],
      ...this.invoices().map(i => [
        i.invoiceNumber, i.customerName, i.issueDate, i.dueDate,
        i.grandTotal, i.balanceDue, i.status,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'invoices.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}
