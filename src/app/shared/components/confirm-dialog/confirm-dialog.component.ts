import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" (click)="cancel.emit()"></div>

      <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div class="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-slate-200 dark:border-slate-800 p-6">
          <div class="flex items-start gap-4">
            <div 
              class="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              [ngClass]="{
                'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400': variant === 'danger',
                'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400': variant === 'warning',
                'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400': variant === 'info'
              }"
            >
              <span class="material-symbols-outlined text-[24px]">
                {{ variant === 'danger' ? 'delete_forever' : variant === 'warning' ? 'warning' : 'info' }}
              </span>
            </div>

            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ title }}</h3>
              <p class="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{{ message }}</p>
            </div>
          </div>

          <div class="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              (click)="cancel.emit()"
              class="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              (click)="confirm.emit()"
              class="px-4 py-2 text-sm font-semibold rounded-lg text-white shadow-xs transition-colors"
              [ngClass]="{
                'bg-rose-600 hover:bg-rose-700': variant === 'danger',
                'bg-amber-600 hover:bg-amber-700': variant === 'warning',
                'bg-blue-600 hover:bg-blue-700': variant === 'info'
              }"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = 'Confirm Action';
  @Input() message: string = 'Are you sure you want to continue? This action cannot be undone.';
  @Input() confirmText: string = 'Confirm';
  @Input() cancelText: string = 'Cancel';
  @Input() variant: 'danger' | 'warning' | 'info' = 'danger';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
