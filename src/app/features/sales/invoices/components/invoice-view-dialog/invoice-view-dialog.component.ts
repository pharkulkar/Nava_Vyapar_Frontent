import type { AfterViewInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe, DatePipe, TitleCasePipe, NgClass } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { INVOICE_STATUS_CONFIG } from '../../invoice.model';
import type { Invoice } from '../../invoice.model';

@Component({
  selector: 'nv-invoice-view-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgFor,
    NgIf,
    NgClass,
    CurrencyPipe,
    DatePipe,
    TitleCasePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './invoice-view-dialog.component.html',
  styleUrls: ['./invoice-view-dialog.component.scss'],
})
export class InvoiceViewDialogComponent implements AfterViewInit {
  private readonly data = inject<{ invoice: Invoice; autoPrint?: boolean }>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<InvoiceViewDialogComponent>);
  private readonly dialog = inject(MatDialog);

  protected readonly invoice = this.data.invoice;
  protected readonly statusConfig = INVOICE_STATUS_CONFIG as Record<
    string,
    { label: string; color: string; icon: string }
  >;
  protected readonly isOverdue =
    this.invoice.status !== 'paid' &&
    this.invoice.status !== 'cancelled' &&
    new Date(this.invoice.dueDate) < new Date();

  ngAfterViewInit(): void {
    if (this.data.autoPrint) {
      setTimeout(() => this.print(), 300);
    }
  }

  print(): void {
    window.print();
  }
}
