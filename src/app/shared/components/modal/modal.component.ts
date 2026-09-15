import { Component, Input, Output, EventEmitter, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        (click)="onBackdropClick()"
      ></div>

      <div class="flex min-h-full items-center justify-center p-2.5 sm:p-4 text-center">
        <!-- Dialog Panel -->
        <div 
          class="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 text-left shadow-2xl transition-all my-3 sm:my-8 w-full border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200"
          [ngClass]="sizeClasses[size] || sizeClasses['lg']"
        >
          <!-- Header -->
          <div *ngIf="title" class="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
              <div *ngIf="icon" class="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[18px] sm:text-[20px]">{{ icon }}</span>
              </div>
              <div class="min-w-0">
                <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate" id="modal-title">{{ title }}</h3>
                <p *ngIf="subtitle" class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{{ subtitle }}</p>
              </div>
            </div>

            <button 
              type="button" 
              (click)="close.emit()" 
              class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors shrink-0"
              aria-label="Close dialog"
            >
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <!-- Body -->
          <div class="px-4 sm:px-6 py-4 sm:py-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <ng-content></ng-content>
          </div>

          <!-- Footer slot -->
          <div *ngIf="showFooter" class="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50/70 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <ng-content select="[modal-footer]"></ng-content>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ModalComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' = 'lg';
  @Input() closeOnBackdrop: boolean = true;
  @Input() showFooter: boolean = true;

  @Output() close = new EventEmitter<void>();

  readonly sizeClasses: Record<string, string> = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '4xl': 'sm:max-w-4xl'
  };

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.close.emit();
    }
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop) {
      this.close.emit();
    }
  }
}
