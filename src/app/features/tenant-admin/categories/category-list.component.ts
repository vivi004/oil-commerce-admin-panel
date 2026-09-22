import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { LiveSyncService } from '../../../core/services/live-sync.service';
import { Category } from '../../../core/models/app.models';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DataTableComponent,
    ModalComponent,
    ConfirmDialogComponent,
    BadgeComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Oil Categories & By-Products</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">10 standardized cold-pressed edible oils, ritual oils, and agro by-products synced with storefront navigation.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <!-- View Switcher -->
          <div class="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              (click)="viewMode.set('table')"
              [ngClass]="viewMode() === 'table' ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
              class="px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all"
              title="Table View"
            >
              <span class="material-symbols-outlined text-[16px]">table_rows</span>
              <span>Table</span>
            </button>
            <button
              type="button"
              (click)="viewMode.set('grid')"
              [ngClass]="viewMode() === 'grid' ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
              class="px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all"
              title="Card Grid View"
            >
              <span class="material-symbols-outlined text-[16px]">grid_view</span>
              <span>Grid</span>
            </button>
          </div>

          <!-- Live Sync -->
          <button
            type="button"
            (click)="syncLive()"
            [disabled]="liveSyncService.isSyncing()"
            class="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-60"
            title="Sync categories with live backend"
          >
            <span class="material-symbols-outlined text-[16px]" [ngClass]="{'animate-spin text-amber-500': liveSyncService.isSyncing()}">sync</span>
            <span>{{ liveSyncService.isSyncing() ? 'Syncing...' : 'Sync Live' }}</span>
          </button>

          <!-- Add Category -->
          <button
            type="button"
            (click)="openCreateModal()"
            class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      <!-- TABLE VIEW -->
      <div *ngIf="viewMode() === 'table'">
        <app-data-table
          [columns]="columns"
          [totalCount]="filteredCategories().length"
          [pageSize]="10"
          searchPlaceholder="Search category name, slug or description..."
          (search)="onSearch($event)"
        >
          <ng-container table-rows>
            <tr *ngFor="let cat of filteredCategories()" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
              <!-- Category Info -->
              <td class="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                <div class="flex items-center gap-3">
                  <img [src]="cat.image" [alt]="cat.name" class="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs" />
                  <div>
                    <div class="text-xs font-bold">{{ cat.name }}</div>
                    <div class="text-[10px] text-amber-600 dark:text-amber-400 font-mono">/categories/{{ cat.slug }}</div>
                  </div>
                </div>
              </td>

              <!-- Description -->
              <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-sm truncate">
                {{ cat.description }}
              </td>

              <!-- SKU Count -->
              <td class="px-4 py-3">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60">
                  {{ cat.productCount || 0 }} SKUs
                </span>
              </td>

              <!-- Status -->
              <td class="px-4 py-3">
                <app-badge [variant]="cat.isActive ? 'emerald' : 'slate'" [dot]="true">
                  {{ cat.isActive ? 'Active' : 'Inactive' }}
                </app-badge>
              </td>

              <!-- Actions -->
              <td class="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                <a
                  [href]="productService.getStorefrontCategoryUrl(cat.slug)"
                  target="_blank"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[11px] font-semibold transition-colors border border-emerald-200/60 dark:border-emerald-800/40"
                  title="View Category on Storefront"
                >
                  <span class="material-symbols-outlined text-[15px]">open_in_new</span>
                  <span class="hidden sm:inline">Store</span>
                </a>
                <button
                  type="button"
                  (click)="openEditModal(cat)"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Edit Category"
                >
                  <span class="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button
                  type="button"
                  (click)="confirmDelete(cat)"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Delete Category"
                >
                  <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </td>
            </tr>
          </ng-container>
        </app-data-table>
      </div>

      <!-- GRID CARDS VIEW -->
      <div *ngIf="viewMode() === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        <div
          *ngFor="let cat of filteredCategories()"
          class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div class="relative h-32 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
            <img [src]="cat.image" [alt]="cat.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div class="absolute top-2 right-2">
              <app-badge [variant]="cat.isActive ? 'emerald' : 'slate'" [dot]="true">
                {{ cat.isActive ? 'Active' : 'Inactive' }}
              </app-badge>
            </div>
          </div>

          <div class="p-4 flex-1 flex flex-col justify-between">
            <div>
              <h3 class="font-bold text-sm text-slate-900 dark:text-white">{{ cat.name }}</h3>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{{ cat.description }}</p>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span class="font-semibold text-slate-500">{{ cat.productCount || 0 }} SKUs</span>
              <div class="flex items-center gap-1">
                <a
                  [href]="productService.getStorefrontCategoryUrl(cat.slug)"
                  target="_blank"
                  class="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  title="View on Storefront"
                >
                  <span class="material-symbols-outlined text-[18px]">open_in_new</span>
                </a>
                <button
                  type="button"
                  (click)="openEditModal(cat)"
                  class="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span class="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button
                  type="button"
                  (click)="confirmDelete(cat)"
                  class="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <app-modal
        [isOpen]="isModalOpen()"
        [title]="isEditing() ? 'Edit Category' : 'Add Oil Category'"
        icon="category"
        size="md"
        (close)="isModalOpen.set(false)"
      >
        <form [formGroup]="catForm" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category Name *</label>
            <input
              type="text"
              formControlName="name"
              placeholder="e.g. Mustard Oil (Sarson)"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              formControlName="description"
              rows="3"
              placeholder="Wood-pressed extraction details & culinary applications..."
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            ></textarea>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Image URL</label>
            <input
              type="text"
              formControlName="image"
              placeholder="https://..."
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div class="flex items-center gap-2 pt-1">
            <input type="checkbox" id="catActive" formControlName="isActive" class="rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500" />
            <label for="catActive" class="font-semibold text-slate-700 dark:text-slate-300">Category Active on Storefront</label>
          </div>
        </form>

        <div modal-footer class="flex items-center gap-2">
          <button
            type="button"
            (click)="isModalOpen.set(false)"
            class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="saveCategory()"
            class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-xs"
          >
            Save Category
          </button>
        </div>
      </app-modal>

      <!-- Delete Confirm -->
      <app-confirm-dialog
        [isOpen]="isDeleteDialogOpen()"
        title="Delete Category"
        [message]="'Are you sure you want to remove category ' + (selectedCategory()?.name ?? '') + '?'"
        variant="danger"
        (confirm)="executeDelete()"
        (cancel)="isDeleteDialogOpen.set(false)"
      ></app-confirm-dialog>
    </div>
  `
})
export class CategoryListComponent {
  productService = inject(ProductService);
  private fb = inject(FormBuilder);

  viewMode = signal<'table' | 'grid'>('table');
  searchQuery = signal<string>('');

  isModalOpen = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  isDeleteDialogOpen = signal<boolean>(false);
  selectedCategory = signal<Category | null>(null);

  columns: ColumnDef[] = [
    { key: 'name', label: 'Category & URL Slug', sortable: true },
    { key: 'description', label: 'Culinary & Extraction Description' },
    { key: 'productCount', label: 'Assigned SKUs', sortable: true },
    { key: 'isActive', label: 'Status', sortable: true },
    { key: 'actions', label: 'Actions', align: 'right' }
  ];

  filteredCategories = computed(() => {
    const list = this.productService.categories();
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return list;
    return list.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.slug.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query)
    );
  });

  catForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    image: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80'],
    isActive: [true]
  });

  readonly liveSyncService = inject(LiveSyncService);

  onSearch(q: string): void {
    this.searchQuery.set(q);
  }

  async syncLive(): Promise<void> {
    await this.liveSyncService.syncCatalog();
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.catForm.reset({
      name: '',
      description: '',
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
      isActive: true
    });
    this.isModalOpen.set(true);
  }

  openEditModal(cat: Category): void {
    this.selectedCategory.set(cat);
    this.isEditing.set(true);
    this.catForm.patchValue({
      name: cat.name,
      description: cat.description,
      image: cat.image,
      isActive: cat.isActive
    });
    this.isModalOpen.set(true);
  }

  async saveCategory(): Promise<void> {
    if (this.catForm.invalid) {
      this.catForm.markAllAsTouched();
      return;
    }

    const val = this.catForm.value;
    if (this.isEditing() && this.selectedCategory()) {
      await this.productService.updateCategory(this.selectedCategory()!.id, val);
    } else {
      await this.productService.addCategory(val);
    }

    this.isModalOpen.set(false);
  }

  confirmDelete(cat: Category): void {
    this.selectedCategory.set(cat);
    this.isDeleteDialogOpen.set(true);
  }

  async executeDelete(): Promise<void> {
    const c = this.selectedCategory();
    if (c) {
      await this.productService.deleteCategory(c.id);
    }
    this.isDeleteDialogOpen.set(false);
  }
}
