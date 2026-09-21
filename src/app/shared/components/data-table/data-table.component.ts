import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <!-- Toolbar: Search & Action Buttons -->
      <div *ngIf="showToolbar" class="p-3 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <!-- Search Input -->
        <div class="relative w-full sm:w-80 md:w-96">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
            search
          </span>
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearchChange($event)"
            [placeholder]="searchPlaceholder"
            class="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-900 dark:text-white"
          />
          <button
            *ngIf="searchQuery()"
            type="button"
            (click)="clearSearch()"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <span class="material-symbols-outlined text-[16px]">cancel</span>
          </button>
        </div>

        <!-- Custom Action Slot (Buttons, Filters, Export) -->
        <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <ng-content select="[table-actions]"></ng-content>
        </div>
      </div>

      <!-- Table Body -->
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full min-w-[620px] text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th *ngIf="selectable" class="w-12 px-4 py-3.5 text-center">
                <input
                  type="checkbox"
                  [checked]="isAllSelected"
                  (change)="toggleSelectAll()"
                  class="rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800"
                />
              </th>
              <th
                *ngFor="let col of columns"
                [style.width]="col.width"
                [ngClass]="{
                  'text-left': !col.align || col.align === 'left',
                  'text-center': col.align === 'center',
                  'text-right': col.align === 'right',
                  'cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 select-none': col.sortable
                }"
                (click)="onSort(col)"
                class="px-4 py-3.5"
              >
                <div class="inline-flex items-center gap-1.5" [ngClass]="{ 'justify-end': col.align === 'right', 'justify-center': col.align === 'center' }">
                  <span>{{ col.label }}</span>
                  <span *ngIf="col.sortable && sortColumn() === col.key" class="material-symbols-outlined text-[14px]">
                    {{ sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                  </span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
            <!-- Projectable custom rows or standard rows -->
            <ng-content select="[table-rows]"></ng-content>

            <!-- Empty State -->
            <tr *ngIf="totalCount === 0">
              <td [attr.colspan]="columns.length + (selectable ? 1 : 0)" class="px-6 py-12 text-center">
                <div class="flex flex-col items-center justify-center space-y-2">
                  <span class="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">inbox</span>
                  <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">{{ emptyMessage }}</p>
                  <p class="text-xs text-slate-400 dark:text-slate-500">No records found matching current query or filters.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div *ngIf="showPagination && totalCount > 0" class="px-4 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div>
          Showing <span class="font-bold text-slate-800 dark:text-slate-200">{{ startItemIndex() }}</span> to
          <span class="font-bold text-slate-800 dark:text-slate-200">{{ endItemIndex() }}</span> of
          <span class="font-bold text-slate-800 dark:text-slate-200">{{ totalCount }}</span> entries
        </div>

        <div class="flex items-center gap-2">
          <!-- Prev Button -->
          <button
            type="button"
            [disabled]="currentPage() === 1"
            (click)="goToPage(currentPage() - 1)"
            class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors"
          >
            Prev
          </button>

          <!-- Current / Total -->
          <span class="px-2 font-semibold text-slate-700 dark:text-slate-300">
            Page {{ currentPage() }} of {{ totalPages() }}
          </span>

          <!-- Next Button -->
          <button
            type="button"
            [disabled]="currentPage() >= totalPages()"
            (click)="goToPage(currentPage() + 1)"
            class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  `
})
export class DataTableComponent {
  @Input() columns: ColumnDef[] = [];
  @Input() totalCount: number = 0;
  @Input() pageSize: number = 10;
  @Input() showToolbar: boolean = true;
  @Input() showPagination: boolean = true;
  @Input() selectable: boolean = false;
  @Input() isAllSelected: boolean = false;
  @Input() searchPlaceholder: string = 'Search items...';
  @Input() emptyMessage: string = 'No entries found';

  @Output() search = new EventEmitter<string>();
  @Output() sort = new EventEmitter<{ column: string; direction: 'asc' | 'desc' }>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() selectAll = new EventEmitter<boolean>();

  searchQuery = signal<string>('');
  currentPage = signal<number>(1);
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount / this.pageSize)));
  startItemIndex = computed(() => this.totalCount === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1);
  endItemIndex = computed(() => Math.min(this.totalCount, this.currentPage() * this.pageSize));

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.search.emit(query);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.search.emit('');
  }

  onSort(col: ColumnDef): void {
    if (!col.sortable) return;
    if (this.sortColumn() === col.key) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(col.key);
      this.sortDirection.set('asc');
    }
    this.sort.emit({ column: this.sortColumn(), direction: this.sortDirection() });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.pageChange.emit(page);
    }
  }

  toggleSelectAll(): void {
    this.selectAll.emit(!this.isAllSelected);
  }
}
