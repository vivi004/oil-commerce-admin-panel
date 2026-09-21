import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { Brand } from '../../../core/models/app.models';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-brand-list',
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
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Oil Brands & Labels</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Manage cold-pressed oil house brands (Nisha Pure Oils, Varshini Gold) and catalog SKUs.</p>
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

          <!-- Sync Live -->
          <button
            type="button"
            (click)="syncLive()"
            class="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Sync brands with live backend"
          >
            <span class="material-symbols-outlined text-[16px]">sync</span>
            <span>Sync Live</span>
          </button>

          <!-- Add Brand -->
          <button
            type="button"
            (click)="openCreateModal()"
            class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Add New Brand</span>
          </button>
        </div>
      </div>

      <!-- TABLE VIEW -->
      <div *ngIf="viewMode() === 'table'">
        <app-data-table
          [columns]="columns"
          [totalCount]="filteredBrands().length"
          [pageSize]="10"
          searchPlaceholder="Search brand by name or description..."
          (search)="onSearch($event)"
        >
          <ng-container table-rows>
            <tr *ngFor="let brand of filteredBrands()" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
              <!-- Brand Info -->
              <td class="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-base border border-amber-200/60 dark:border-amber-900/60 shrink-0">
                    {{ brand.name.charAt(0) }}
                  </div>
                  <div>
                    <div class="text-xs font-bold">{{ brand.name }}</div>
                    <div class="text-[10px] text-slate-400">Cold-Pressed House Label</div>
                  </div>
                </div>
              </td>

              <!-- Description -->
              <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-sm truncate">
                {{ brand.description }}
              </td>

              <!-- Catalog SKU Count -->
              <td class="px-4 py-3">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60">
                  {{ brand.productCount || 0 }} SKUs
                </span>
              </td>

              <!-- Status -->
              <td class="px-4 py-3">
                <app-badge [variant]="brand.isActive ? 'emerald' : 'slate'" [dot]="true">
                  {{ brand.isActive ? 'Active' : 'Inactive' }}
                </app-badge>
              </td>

              <!-- Actions -->
              <td class="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                <a
                  [href]="storefrontBrandsUrl"
                  target="_blank"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[11px] font-semibold transition-colors border border-emerald-200/60 dark:border-emerald-800/40"
                  title="View Brands on Storefront"
                >
                  <span class="material-symbols-outlined text-[15px]">open_in_new</span>
                  <span class="hidden sm:inline">Store</span>
                </a>
                <button
                  type="button"
                  (click)="openEditModal(brand)"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Edit Brand"
                >
                  <span class="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button
                  type="button"
                  (click)="confirmDelete(brand)"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Delete Brand"
                >
                  <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </td>
            </tr>
          </ng-container>
        </app-data-table>
      </div>

      <!-- GRID VIEW -->
      <div *ngIf="viewMode() === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div
          *ngFor="let brand of filteredBrands()"
          class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div class="flex items-start justify-between mb-4">
              <div class="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-lg border border-amber-200/60 dark:border-amber-900/60">
                {{ brand.name.charAt(0) }}
              </div>
              <app-badge [variant]="brand.isActive ? 'emerald' : 'slate'" [dot]="true">
                {{ brand.isActive ? 'Active' : 'Inactive' }}
              </app-badge>
            </div>

            <h3 class="font-bold text-base text-slate-900 dark:text-white">{{ brand.name }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{{ brand.description }}</p>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span class="font-semibold text-slate-500">{{ brand.productCount || 0 }} Catalog SKUs</span>
            <div class="flex items-center gap-1">
              <a
                [href]="storefrontBrandsUrl"
                target="_blank"
                class="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                title="View on Storefront"
              >
                <span class="material-symbols-outlined text-[18px]">open_in_new</span>
              </a>
              <button
                type="button"
                (click)="openEditModal(brand)"
                class="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span class="material-symbols-outlined text-[18px]">edit</span>
              </button>
              <button
                type="button"
                (click)="confirmDelete(brand)"
                class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <span class="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <app-modal
        [isOpen]="isModalOpen()"
        [title]="isEditing() ? 'Edit Brand' : 'Add Brand Label'"
        icon="sell"
        size="md"
        (close)="isModalOpen.set(false)"
      >
        <form [formGroup]="brandForm" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Brand Name *</label>
            <input
              type="text"
              formControlName="name"
              placeholder="e.g. Varshini Gold"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Brand Description</label>
            <textarea
              formControlName="description"
              rows="3"
              placeholder="Brand provenance, mill location, seed sourcing..."
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            ></textarea>
          </div>
          <div class="flex items-center gap-2 pt-1">
            <input type="checkbox" id="brandActive" formControlName="isActive" class="rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500" />
            <label for="brandActive" class="font-semibold text-slate-700 dark:text-slate-300">Brand Active across Catalogs</label>
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
            (click)="saveBrand()"
            class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-xs"
          >
            Save Brand
          </button>
        </div>
      </app-modal>

      <!-- Delete Confirm Dialog -->
      <app-confirm-dialog
        [isOpen]="isDeleteDialogOpen()"
        title="Delete Brand"
        [message]="'Are you sure you want to remove brand ' + (selectedBrand()?.name ?? '') + '?'"
        variant="danger"
        (confirm)="executeDelete()"
        (cancel)="isDeleteDialogOpen.set(false)"
      ></app-confirm-dialog>
    </div>
  `
})
export class BrandListComponent {
  productService = inject(ProductService);
  private fb = inject(FormBuilder);

  viewMode = signal<'table' | 'grid'>('table');
  searchQuery = signal<string>('');

  isModalOpen = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  isDeleteDialogOpen = signal<boolean>(false);
  selectedBrand = signal<Brand | null>(null);

  readonly storefrontBrandsUrl = `${this.productService.storefrontUrl}/brands`;

  columns: ColumnDef[] = [
    { key: 'name', label: 'Brand Name & Label', sortable: true },
    { key: 'description', label: 'Provenance & Description' },
    { key: 'productCount', label: 'Assigned Catalog SKUs', sortable: true },
    { key: 'isActive', label: 'Status', sortable: true },
    { key: 'actions', label: 'Actions', align: 'right' }
  ];

  filteredBrands = computed(() => {
    const list = this.productService.brands();
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return list;
    return list.filter(b =>
      b.name.toLowerCase().includes(query) ||
      b.description.toLowerCase().includes(query)
    );
  });

  brandForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    isActive: [true]
  });

  onSearch(q: string): void {
    this.searchQuery.set(q);
  }

  syncLive(): void {
    this.productService.syncFromBackend();
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.brandForm.reset({
      name: '',
      description: '',
      isActive: true
    });
    this.isModalOpen.set(true);
  }

  openEditModal(brand: Brand): void {
    this.selectedBrand.set(brand);
    this.isEditing.set(true);
    this.brandForm.patchValue({
      name: brand.name,
      description: brand.description,
      isActive: brand.isActive
    });
    this.isModalOpen.set(true);
  }

  async saveBrand(): Promise<void> {
    if (this.brandForm.invalid) {
      this.brandForm.markAllAsTouched();
      return;
    }

    const val = this.brandForm.value;
    if (this.isEditing() && this.selectedBrand()) {
      await this.productService.updateBrand(this.selectedBrand()!.id, val);
    } else {
      await this.productService.addBrand(val);
    }

    this.isModalOpen.set(false);
  }

  confirmDelete(brand: Brand): void {
    this.selectedBrand.set(brand);
    this.isDeleteDialogOpen.set(true);
  }

  async executeDelete(): Promise<void> {
    const b = this.selectedBrand();
    if (b) {
      await this.productService.deleteBrand(b.id);
    }
    this.isDeleteDialogOpen.set(false);
  }
}
