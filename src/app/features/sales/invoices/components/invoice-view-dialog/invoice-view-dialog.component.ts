import type { AfterViewInit, OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgIf, NgFor, DatePipe, DecimalPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InvoiceService } from '../../invoice.service';
import type { ApiInvoice, ApiInvoiceDetail, ApiInvoiceItem } from '../../invoice.model';

@Component({
  selector: 'nv-invoice-view-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgFor, DatePipe, DecimalPipe, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './invoice-view-dialog.component.html',
  styleUrls: ['./invoice-view-dialog.component.scss'],
})
export class InvoiceViewDialogComponent implements OnInit, AfterViewInit {
  private readonly data = inject<{ invoice: ApiInvoice; autoPrint?: boolean }>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<InvoiceViewDialogComponent>);
  private readonly invoiceService = inject(InvoiceService);

  protected readonly loading = signal(true);
  protected readonly detail = signal<ApiInvoiceDetail | null>(null);

  // Fall back to list-level data while detail loads
  protected readonly invoice = this.data.invoice;

  protected get items(): ApiInvoiceItem[] { return this.detail()?.items ?? []; }
  protected get totalPrice(): number  { return Number((this.detail() ?? this.invoice).totalPrice) || 0; }
  protected get discount(): number    { return Number((this.detail() ?? this.invoice).discount)   || 0; }
  protected get received(): number    { return Number((this.detail() ?? this.invoice).received)   || 0; }
  protected get balance(): number     { return Number((this.detail() ?? this.invoice).balance)    || 0; }

  ngOnInit(): void {
    this.invoiceService.getInvoiceDetail(this.invoice.id).subscribe({
      next: detail => {
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  ngAfterViewInit(): void {
    if (this.data.autoPrint) {
      // Wait for detail to load before printing
      const interval = setInterval(() => {
        if (!this.loading()) { clearInterval(interval); this.print(); }
      }, 150);
    }
  }

  print(): void {
    const el = document.getElementById('invoice-print-area');
    if (!el) { window.print(); return; }

    const styles = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #fff; font-family: Arial, Helvetica, sans-serif; color: #555; }
      .invoice-wrap { width: 450px; margin: 0 auto; background: #fff; }
      .amount-header { background: #2563eb; color: #fff; text-align: center; padding: 28px 16px 24px; }
      .amount-label { font-size: 15px; font-weight: 400; margin-bottom: 4px; opacity: 0.9; }
      .amount { font-size: 28px; font-weight: 700; letter-spacing: 0.5px; }
      .seller-section { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; border-bottom: 1px solid #d1d5db; }
      .seller-name { font-size: 20px; font-weight: 700; color: #374151; margin-bottom: 4px; }
      .seller-phone { color: #2563eb; font-size: 14px; }
      .ph-icon { margin-right: 3px; }
      .seller-avatar { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg,#1d4ed8,#2563eb); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; flex-shrink: 0; }
      .info-section { display: flex; justify-content: space-between; padding: 14px 20px 16px; background: #f9fafb; border-bottom: 1px solid #9ca3af; gap: 12px; }
      .section-accent { color: #2563eb; font-size: 14px; font-weight: 600; margin-bottom: 4px; }
      .customer-name { font-size: 15px; color: #374151; font-weight: 500; margin-bottom: 5px; }
      .customer-phone { color: #2563eb; font-size: 13px; margin-bottom: 3px; }
      .customer-addr { font-size: 12px; color: #6b7280; max-width: 180px; line-height: 1.4; }
      .invoice-info { text-align: right; flex-shrink: 0; }
      .ref-number { font-size: 13px; color: #374151; margin-bottom: 10px; margin-top: 2px; font-weight: 500; word-break: break-all; }
      .inv-date { font-size: 13px; color: #374151; margin-top: 2px; margin-bottom: 8px; }
      .status-chip { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
      .status-paid { background: #dcfce7; color: #15803d; }
      .status-unpaid { background: #fee2e2; color: #b91c1c; }
      .status-partially-paid { background: #fef3c7; color: #b45309; }
      .status-pending { background: #dbeafe; color: #1d4ed8; }
      .status-cancelled { background: #f1f5f9; color: #64748b; }
      .items-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 2px; }
      .items-table thead { background: #e5e7eb; }
      .items-table th { height: 34px; font-size: 13px; font-weight: 700; color: #4b5563; text-align: left; padding: 0 8px; }
      .items-table td { font-size: 14px; color: #555; padding: 8px 8px 4px; vertical-align: top; }
      .items-table tbody tr:nth-child(even) { background: #f9fafb; }
      .col-sr { width: 32px; text-align: center !important; }
      .col-qty { width: 44px; text-align: center !important; }
      .col-price { width: 72px; text-align: right !important; }
      .col-gst { width: 52px; text-align: right !important; }
      .col-amount { width: 90px; text-align: right !important; }
      .calc-row { display: grid; grid-template-columns: 1fr 100px; padding: 5px 8px; font-size: 14px; color: #555; }
      .calc-label { text-align: right; padding-right: 8px; }
      .calc-value { text-align: right; }
      .calc-divider { border-top: 1px solid #9ca3af; margin: 6px 8px; }
      .grand-row { font-weight: 700; font-size: 15px; color: #1f2937; padding: 8px 8px 6px; }
      .balance-row { font-weight: 700; color: #dc2626; font-size: 15px; padding: 6px 8px 10px; }
      .receipt-footer { padding: 16px 20px 20px; text-align: center; }
      .footer-line { border-top: 2px dashed #d1d5db; margin-bottom: 14px; }
      .footer-thanks { font-size: 14px; color: #374151; font-weight: 500; margin: 0 0 4px; }
      .footer-brand { font-size: 12px; color: #9ca3af; margin: 0; }
      @media print { body { margin: 0; } }
    `;

    const win = window.open('', '_blank', 'width=520,height=900');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Invoice ${this.invoice.billNo}</title><style>${styles}</style></head>
<body>${el.outerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 350);
  }

  close(): void { this.dialogRef.close(); }
}
