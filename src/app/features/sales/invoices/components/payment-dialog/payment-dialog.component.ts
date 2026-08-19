import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InvoiceService } from '../../invoice.service';
import { ToastService } from '@core/services/toast.service';
import { PAYMENT_METHODS } from '../../invoice.model';
import type { Invoice, PaymentMethod } from '../../invoice.model';

@Component({
  selector: 'nv-payment-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgFor, NgIf, FormsModule, CurrencyPipe,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTooltipModule, MatProgressSpinnerModule,
  ],
  templateUrl: './payment-dialog.component.html',
  styleUrls: ['./payment-dialog.component.scss'],
})
export class PaymentDialogComponent {
  private readonly data = inject<{ invoice: Invoice }>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PaymentDialogComponent>);
  private readonly invoiceService = inject(InvoiceService);
  private readonly toast = inject(ToastService);

  protected readonly invoice = this.data.invoice;
  protected readonly paymentMethods = PAYMENT_METHODS;
  protected readonly saving = signal(false);

  protected form = {
    amount: this.invoice.balanceDue,
    method: 'cash' as PaymentMethod,
    date: new Date().toISOString().split('T')[0],
    reference: '',
    note: '',
  };

  save(): void {
    if (!this.form.amount || this.form.amount <= 0) { this.toast.error('Enter a valid amount'); return; }
    if (this.form.amount > this.invoice.balanceDue) { this.toast.error('Amount exceeds balance due'); return; }

    this.saving.set(true);
    this.invoiceService.recordPayment(this.invoice.id, {
      date: this.form.date,
      amount: this.form.amount,
      method: this.form.method,
      reference: this.form.reference || undefined,
      note: this.form.note || undefined,
    }).subscribe({
      next: res => {
        this.toast.success(res.message);
        this.saving.set(false);
        this.dialogRef.close(true);
      },
      error: () => { this.toast.error('Failed to record payment'); this.saving.set(false); },
    });
  }
}
