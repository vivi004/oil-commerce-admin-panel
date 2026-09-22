import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { LiveSyncService } from '../../../core/services/live-sync.service';
import { Product } from '../../../core/models/app.models';
import { ProductStatus } from '../../../core/enums/app.enums';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DataTableComponent,
    ConfirmDialogComponent,
    BadgeComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Cold-Pressed Oils & Commodities</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Manage 10 oil categories, multi-pack sizes (100ml to 15Kg), and retail pricing synced with storefront.</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="refreshCatalog()"
            [disabled]="liveSyncService.isSyncing()"
            class="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-60"
            title="Sync products with backend and storefront"
          >
            <span class="material-symbols-outlined text-[16px]" [ngClass]="{'animate-spin text-amber-500': liveSyncService.isSyncing()}">sync</span>
            <span>{{ liveSyncService.isSyncing() ? 'Syncing...' : 'Sync Live' }}</span>
          </button>
          <a
            routerLink="/tenant-admin/products/new"
            class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Add Oil Product</span>
          </a>
        </div>
      </div>

      <!-- Data Table with Filters -->
      <app-data-table
        [columns]="columns"
        [totalCount]="filteredProducts().length"
        [pageSize]="10"
        searchPlaceholder="Search oil name, SKU, or category..."
        (search)="onSearch($event)"
      >
        <div table-actions class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <!-- Category Filter -->
          <select
            [(ngModel)]="selectedCategory"
            class="w-full sm:w-auto text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-3 focus:outline-hidden"
          >
            <option value="ALL">All Categories ({{ productService.categories().length }})</option>
            <option *ngFor="let cat of productService.categories()" [value]="cat.name">{{ cat.name }}</option>
          </select>

          <!-- Brand Filter -->
          <select
            [(ngModel)]="selectedBrand"
            class="w-full sm:w-auto text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-3 focus:outline-hidden"
          >
            <option value="ALL">All Brands</option>
            <option *ngFor="let brand of productService.brands()" [value]="brand.name">{{ brand.name }}</option>
          </select>

          <!-- Status Filter -->
          <select
            [(ngModel)]="selectedStatus"
            class="w-full sm:w-auto text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-3 focus:outline-hidden"
          >
            <option value="ALL">All Status</option>
            <option [value]="ProductStatus.ACTIVE">Active</option>
            <option [value]="ProductStatus.DRAFT">Draft</option>
            <option [value]="ProductStatus.OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>

        <ng-container table-rows>
          <tr *ngFor="let prod of filteredProducts()" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
            <!-- Product & Thumbnail -->
            <td class="px-4 py-3 font-semibold text-slate-900 dark:text-white">
              <div class="flex items-center gap-3">
                <img
                  [src]="productService.resolveImageUrl(prod.primaryImage)"
                  [alt]="prod.name"
                  (error)="onImgError($event)"
                  class="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
                />
                <div>
                  <div class="text-xs font-bold">{{ prod.name }}</div>
                  <div class="text-[10px] text-slate-400 font-mono">{{ prod.sku }} • {{ prod.brand }}</div>
                </div>
              </div>
            </td>

            <!-- Category -->
            <td class="px-4 py-3 text-slate-700 dark:text-slate-300">
              <span class="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
                {{ prod.category }}
              </span>
            </td>

            <!-- Variants Available -->
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1 max-w-xs">
                <span
                  *ngFor="let v of prod.variants"
                  [ngClass]="v.isEnabled ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' : 'opacity-40 line-through bg-slate-50 dark:bg-slate-900 text-slate-400'"
                  class="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                >
                  {{ v.size }}
                </span>
              </div>
            </td>

            <!-- Price Range -->
            <td class="px-4 py-3 font-semibold text-slate-900 dark:text-white text-xs">
              ₹{{ prod.minPrice }} - ₹{{ prod.maxPrice }}
            </td>

            <!-- Total Stock -->
            <td class="px-4 py-3 text-right">
              <span
                [ngClass]="prod.totalStock <= 20 ? 'text-rose-600 font-bold' : 'text-slate-800 dark:text-slate-200 font-semibold'"
                class="text-xs"
              >
                {{ prod.totalStock }} units
              </span>
            </td>

            <!-- Status Badge -->
            <td class="px-4 py-3">
              <app-badge [variant]="prod.status === ProductStatus.ACTIVE ? 'emerald' : prod.status === ProductStatus.OUT_OF_STOCK ? 'rose' : 'slate'" [dot]="true">
                {{ prod.status }}
              </app-badge>
            </td>

            <!-- Actions -->
            <td class="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
              <a
                [href]="productService.getStorefrontProductUrl(prod.id)"
                target="_blank"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[11px] font-semibold transition-colors border border-emerald-200/60 dark:border-emerald-800/40"
                title="View on Customer Storefront"
              >
                <span class="material-symbols-outlined text-[15px]">open_in_new</span>
                <span class="hidden sm:inline">Store</span>
              </a>
              <a
                [routerLink]="['/tenant-admin/products/edit', prod.id]"
                class="inline-block p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Edit Product"
              >
                <span class="material-symbols-outlined text-[18px]">edit</span>
              </a>
              <button
                type="button"
                (click)="confirmDelete(prod)"
                class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Delete Product"
              >
                <span class="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </td>
          </tr>
        </ng-container>
      </app-data-table>

      <!-- Delete Confirm Dialog -->
      <app-confirm-dialog
        [isOpen]="isDeleteDialogOpen()"
        title="Delete Oil Product"
        [message]="'Are you sure you want to remove ' + (selectedProduct()?.name ?? '') + ' from the catalog? This will also remove its associated packaging sizes.'"
        variant="danger"
        confirmText="Yes, Delete Product"
        (confirm)="executeDelete()"
        (cancel)="isDeleteDialogOpen.set(false)"
      ></app-confirm-dialog>
    </div>
  `
})
export class ProductListComponent {
  productService = inject(ProductService);
  readonly liveSyncService = inject(LiveSyncService);

  readonly ProductStatus = ProductStatus;

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('ALL');
  selectedBrand = signal<string>('ALL');
  selectedStatus = signal<string>('ALL');

  isDeleteDialogOpen = signal<boolean>(false);
  selectedProduct = signal<Product | null>(null);

  columns: ColumnDef[] = [
    { key: 'name', label: 'Oil Product & SKU', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'variants', label: 'Available Sizes' },
    { key: 'price', label: 'Price Range', sortable: true },
    { key: 'totalStock', label: 'Total Stock', sortable: true, align: 'right' },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'actions', label: 'Actions', align: 'right' }
  ];

  filteredProducts = computed(() => {
    let list = this.productService.products();
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    const brand = this.selectedBrand();
    const status = this.selectedStatus();

    if (query) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query)
      );
    }

    if (cat !== 'ALL') {
      list = list.filter(p => p.category === cat);
    }

    if (brand !== 'ALL') {
      list = list.filter(p => p.brand === brand);
    }

    if (status !== 'ALL') {
      list = list.filter(p => p.status === status);
    }

    return list;
  });

  onSearch(q: string): void {
    this.searchQuery.set(q);
  }

  async refreshCatalog(): Promise<void> {
    await this.liveSyncService.syncCatalog();
  }

  onImgError(e: Event): void {
    const img = e.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80';
  }

  confirmDelete(prod: Product): void {
    this.selectedProduct.set(prod);
    this.isDeleteDialogOpen.set(true);
  }

  executeDelete(): void {
    const p = this.selectedProduct();
    if (p) {
      this.productService.deleteProduct(p.id);
    }
    this.isDeleteDialogOpen.set(false);
  }
}
