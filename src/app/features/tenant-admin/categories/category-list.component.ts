import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
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
          <p class="text-xs text-slate-500 dark:text-slate-400">10 standardized cold-pressed edible oils, ritual oils, and agro by-products (Oil Cake & Burfi).</p>
        </div>
        <button
          type="button"
          (click)="openCreateModal()"
          class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition-colors flex items-center justify-center gap-2"
        >
          <span class="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Add New Category</span>
        </button>
      </div>

      <!-- Categories Grid Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        <div
          *ngFor="let cat of productService.categories()"
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

  isModalOpen = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  isDeleteDialogOpen = signal<boolean>(false);
  selectedCategory = signal<Category | null>(null);

  catForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    image: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80'],
    isActive: [true]
  });

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

  saveCategory(): void {
    if (this.catForm.invalid) {
      this.catForm.markAllAsTouched();
      return;
    }

    const val = this.catForm.value;
    if (this.isEditing() && this.selectedCategory()) {
      this.productService.updateCategory(this.selectedCategory()!.id, val);
    } else {
      this.productService.addCategory(val);
    }

    this.isModalOpen.set(false);
  }

  confirmDelete(cat: Category): void {
    this.selectedCategory.set(cat);
    this.isDeleteDialogOpen.set(true);
  }

  executeDelete(): void {
    const c = this.selectedCategory();
    if (c) {
      this.productService.deleteCategory(c.id);
    }
    this.isDeleteDialogOpen.set(false);
  }
}
