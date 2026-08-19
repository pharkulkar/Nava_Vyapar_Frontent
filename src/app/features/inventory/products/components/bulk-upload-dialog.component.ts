import {
  ChangeDetectionStrategy, Component, inject, signal,
} from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { ProductService } from '../product.service';
import { ToastService } from '@core/services/toast.service';
import type { BulkUploadResult } from '../product.model';

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

@Component({
  selector: 'nv-bulk-upload-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgFor, NgIf, NgClass,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatDividerModule,
  ],
  template: `
    <div class="bulk-dialog">
      <!-- Header -->
      <div class="bulk-header">
        <div class="flex items-center gap-3">
          <div class="header-icon">
            <mat-icon>upload_file</mat-icon>
          </div>
          <div>
            <h2 class="bulk-title">Bulk Upload Products</h2>
            <p class="bulk-subtitle">Upload a CSV file to add multiple products at once</p>
          </div>
        </div>
        <button mat-icon-button (click)="close()" [disabled]="state() === 'uploading'">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-divider />

      <div class="bulk-body">

        <!-- Step 1: Download template -->
        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <p class="step-title">Download the CSV template</p>
            <p class="step-desc">Use our template to ensure your data is formatted correctly.</p>
            <button mat-stroked-button color="primary" (click)="downloadTemplate()" class="mt-2">
              <mat-icon>download</mat-icon> Download Template
            </button>
          </div>
        </div>

        <!-- Step 2: Upload zone -->
        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content w-full">
            <p class="step-title">Upload your filled CSV file</p>

            <div
              class="drop-zone"
              [ngClass]="{
                'drag-over': isDragging(),
                'has-file': selectedFile() && state() === 'idle',
                'uploading': state() === 'uploading'
              }"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave()"
              (drop)="onDrop($event)"
              (click)="fileInput.click()"
            >
              <input #fileInput type="file" accept=".csv" class="hidden" (change)="onFileSelected($event)" />

              <ng-container *ngIf="!selectedFile(); else fileSelected">
                <mat-icon class="drop-icon">cloud_upload</mat-icon>
                <p class="drop-text">Drag & drop your CSV here</p>
                <p class="drop-hint">or click to browse — .csv files only</p>
              </ng-container>

              <ng-template #fileSelected>
                <div class="file-info">
                  <mat-icon class="text-primary-600 text-3xl">description</mat-icon>
                  <div>
                    <p class="file-name">{{ selectedFile()!.name }}</p>
                    <p class="file-size">{{ formatSize(selectedFile()!.size) }}</p>
                  </div>
                  <button mat-icon-button (click)="clearFile($event)" *ngIf="state() === 'idle'" class="text-gray-400">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              </ng-template>
            </div>

            <mat-progress-bar *ngIf="state() === 'uploading'" mode="indeterminate" class="mt-2 rounded" />
          </div>
        </div>

        <!-- CSV Format guide -->
        <div class="format-guide">
          <p class="format-title"><mat-icon>info</mat-icon> Required CSV columns</p>
          <div class="columns-grid">
            <span *ngFor="let col of requiredColumns" class="col-chip required">{{ col }}</span>
          </div>
          <div class="columns-grid mt-1">
            <span *ngFor="let col of optionalColumns" class="col-chip optional">{{ col }}</span>
          </div>
          <p class="format-hint">
            <span class="col-chip required">required</span>
            <span class="col-chip optional">optional</span>
          </p>
        </div>

        <!-- Results -->
        <div class="upload-result" *ngIf="result()">
          <div class="result-stats">
            <div class="result-stat total">
              <mat-icon>list</mat-icon>
              <span class="stat-num">{{ result()!.total }}</span>
              <span class="stat-lbl">Total Rows</span>
            </div>
            <div class="result-stat success">
              <mat-icon>check_circle</mat-icon>
              <span class="stat-num">{{ result()!.success }}</span>
              <span class="stat-lbl">Imported</span>
            </div>
            <div class="result-stat failed" *ngIf="result()!.failed > 0">
              <mat-icon>error</mat-icon>
              <span class="stat-num">{{ result()!.failed }}</span>
              <span class="stat-lbl">Failed</span>
            </div>
          </div>

          <div class="error-list" *ngIf="result()!.errors.length > 0">
            <p class="error-list-title">Errors to fix:</p>
            <div class="error-item" *ngFor="let err of result()!.errors">
              <mat-icon class="text-red-500 text-sm">error_outline</mat-icon>
              <span>Row {{ err.row }} — <strong>{{ err.field }}</strong>: {{ err.message }}</span>
            </div>
          </div>
        </div>

      </div>

      <mat-divider />

      <!-- Footer -->
      <div class="bulk-footer">
        <button mat-stroked-button (click)="close()" [disabled]="state() === 'uploading'">
          {{ state() === 'done' ? 'Close' : 'Cancel' }}
        </button>
        <button
          mat-flat-button
          color="primary"
          (click)="upload()"
          [disabled]="!selectedFile() || state() !== 'idle'"
          class="flex items-center gap-2 px-6"
        >
          <mat-icon>upload</mat-icon>
          {{ state() === 'uploading' ? 'Uploading...' : 'Upload Products' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .bulk-dialog { @apply flex flex-col; min-width: 580px; max-height: 90vh; }

    .bulk-header {
      @apply flex items-start justify-between p-6 pb-4;
      .header-icon { @apply w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0; mat-icon { @apply text-primary-600; } }
      .bulk-title { @apply text-lg font-semibold text-gray-900 dark:text-white; }
      .bulk-subtitle { @apply text-sm text-gray-500 dark:text-white/60 mt-0.5; }
    }

    .bulk-body { @apply flex flex-col gap-4 p-6 overflow-y-auto; }

    .step-card {
      @apply flex items-start gap-4;
      .step-number { @apply w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5; }
      .step-content { @apply flex flex-col gap-1; }
      .step-title { @apply text-sm font-semibold text-gray-800 dark:text-white; }
      .step-desc { @apply text-xs text-gray-500 dark:text-white/60; }
    }

    .drop-zone {
      @apply flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-white/20
             rounded-xl p-8 cursor-pointer transition-all duration-200 mt-2
             hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10;
      &.drag-over { @apply border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.01]; }
      &.has-file { @apply border-primary-400 bg-primary-50/30 dark:bg-primary-900/10; }
      &.uploading { @apply pointer-events-none opacity-70; }
      .drop-icon { @apply text-5xl text-gray-300 dark:text-white/20; font-size: 48px; }
      .drop-text { @apply text-sm font-medium text-gray-600 dark:text-white/70; }
      .drop-hint { @apply text-xs text-gray-400 dark:text-white/40; }
    }

    .file-info { @apply flex items-center gap-3 w-full; .file-name { @apply text-sm font-medium text-gray-800 dark:text-white; } .file-size { @apply text-xs text-gray-400; } }

    .format-guide {
      @apply p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10;
      .format-title { @apply flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-white/70 mb-2; mat-icon { font-size: 14px; } }
      .columns-grid { @apply flex flex-wrap gap-1.5; }
      .format-hint { @apply flex items-center gap-2 mt-2 text-xs text-gray-400; }
    }

    .col-chip {
      @apply px-2 py-0.5 rounded text-xs font-medium;
      &.required { @apply bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300; }
      &.optional { @apply bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60; }
    }

    .upload-result {
      @apply rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden;
      .result-stats { @apply flex gap-0 divide-x divide-gray-100 dark:divide-white/10; }
      .result-stat {
        @apply flex flex-col items-center gap-1 p-4 flex-1;
        mat-icon { @apply text-2xl; font-size: 24px; }
        .stat-num { @apply text-2xl font-bold; }
        .stat-lbl { @apply text-xs text-gray-500 dark:text-white/60; }
        &.total { mat-icon, .stat-num { @apply text-gray-600 dark:text-white/80; } }
        &.success { mat-icon, .stat-num { @apply text-green-600; } }
        &.failed { mat-icon, .stat-num { @apply text-red-500; } }
      }
    }

    .error-list {
      @apply p-4 border-t border-gray-100 dark:border-white/10 flex flex-col gap-2 max-h-32 overflow-y-auto;
      .error-list-title { @apply text-xs font-semibold text-red-600 mb-1; }
      .error-item { @apply flex items-start gap-2 text-xs text-gray-600 dark:text-white/70; }
    }

    .bulk-footer { @apply flex items-center justify-end gap-3 p-6 pt-4; }
  `],
})
export class BulkUploadDialogComponent {
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(MatDialogRef<BulkUploadDialogComponent>);

  protected readonly state = signal<UploadState>('idle');
  protected readonly isDragging = signal(false);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly result = signal<BulkUploadResult | null>(null);

  protected readonly requiredColumns = ['name', 'sku', 'sellingPrice'];
  protected readonly optionalColumns = ['category', 'unit', 'purchasePrice', 'taxRate', 'stockQuantity', 'lowStockThreshold', 'status', 'description', 'barcode'];

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void { this.isDragging.set(false); }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(false);
    const file = e.dataTransfer?.files[0];
    if (file && file.name.endsWith('.csv')) this.selectedFile.set(file);
    else this.toast.error('Please upload a .csv file only');
  }

  onFileSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.selectedFile.set(file);
  }

  clearFile(e: Event): void {
    e.stopPropagation();
    this.selectedFile.set(null);
    this.result.set(null);
  }

  downloadTemplate(): void { this.productService.downloadTemplate(); }

  upload(): void {
    const file = this.selectedFile();
    if (!file) return;
    this.state.set('uploading');
    this.result.set(null);

    this.productService.bulkUpload(file).subscribe({
      next: res => {
        this.result.set(res.data);
        this.state.set('done');
        if (res.data.success > 0) {
          this.toast.success(`${res.data.success} products imported successfully`);
          this.dialogRef.close(true);
        } else {
          this.toast.warning('No products were imported. Check the errors below.');
          this.state.set('idle');
        }
      },
      error: () => {
        this.state.set('error');
        this.toast.error('Upload failed. Please try again.');
        this.state.set('idle');
      },
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  close(): void { this.dialogRef.close(); }
}
