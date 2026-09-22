import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';
import { OrderService } from '../../../core/services/order.service';
import { LiveSyncService } from '../../../core/services/live-sync.service';
import { ExportService } from '../../../core/services/export.service';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-tenant-reports',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Sales & Oil Extraction Analytics</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Volume extracted in Liters & Kg, revenue share per seed category, and best-selling SKU velocity.</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="syncLive()"
            [disabled]="liveSyncService.isSyncing()"
            class="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-60"
            title="Sync analytics and sales metrics live"
          >
            <span class="material-symbols-outlined text-[16px]" [ngClass]="{'animate-spin text-amber-500': liveSyncService.isSyncing()}">sync</span>
            <span>{{ liveSyncService.isSyncing() ? 'Syncing...' : 'Sync Live' }}</span>
          </button>

          <button
            type="button"
            (click)="exportActiveReport()"
            class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <!-- Volume Breakdown Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Volume Sold (Liquid Liters)</div>
          <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">4,280 L</div>
          <div class="text-[11px] text-emerald-600 mt-2 flex items-center gap-1 font-medium">
            <span class="material-symbols-outlined text-[14px]">trending_up</span> Top: Groundnut (1,850L), Sesame (1,240L)
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Agro Solid By-Products (Kg)</div>
          <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">8,400 Kg</div>
          <div class="text-[11px] text-amber-600 mt-2 flex items-center gap-1 font-medium">
            <span class="material-symbols-outlined text-[14px]">eco</span> Groundnut Oil Cake & Sesame Burfi
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Cart Size</div>
          <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ₹{{ Math.round(orderService.totalRevenue() / Math.max(1, orderService.totalOrdersCount())).toLocaleString() }}
          </div>
          <div class="text-[11px] text-slate-500 mt-2">Driven by 5L & 15L family tin combo packs</div>
        </div>
      </div>

      <!-- Report Tabs -->
      <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          (click)="activeTab.set('skus')"
          [ngClass]="activeTab() === 'skus' ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold bg-amber-50/50 dark:bg-amber-950/30' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'"
          class="px-4 py-2 rounded-xl border text-xs flex items-center gap-2 transition-all"
        >
          <span class="material-symbols-outlined text-[18px]">leaderboard</span>
          <span>Best-Selling SKUs & Margins</span>
        </button>
        <button
          type="button"
          (click)="activeTab.set('categories')"
          [ngClass]="activeTab() === 'categories' ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold bg-amber-50/50 dark:bg-amber-950/30' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'"
          class="px-4 py-2 rounded-xl border text-xs flex items-center gap-2 transition-all"
        >
          <span class="material-symbols-outlined text-[18px]">pie_chart</span>
          <span>Category Revenue & Extraction Volume</span>
        </button>
      </div>

      <!-- TAB 1: TOP SELLING SKUS TABLE -->
      <div *ngIf="activeTab() === 'skus'" class="space-y-4">
        <app-data-table
          [columns]="skuColumns"
          [totalCount]="filteredSkus().length"
          [pageSize]="10"
          searchPlaceholder="Search product SKU or name..."
          (search)="onSkuSearch($event)"
        >
          <ng-container table-rows>
            <tr *ngFor="let sku of filteredSkus()" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
              <td class="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                <div class="text-xs font-bold">{{ sku.name }}</div>
                <div class="text-[10px] text-slate-400 font-mono">{{ sku.sku }} • {{ sku.size }}</div>
              </td>
              <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                {{ sku.category }}
              </td>
              <td class="px-4 py-3 text-right font-bold text-xs text-slate-900 dark:text-white">
                {{ sku.unitsSold.toLocaleString() }} units
              </td>
              <td class="px-4 py-3 text-right font-semibold text-xs text-slate-700 dark:text-slate-300">
                ₹{{ sku.unitPrice }}
              </td>
              <td class="px-4 py-3 text-right font-black text-xs text-slate-900 dark:text-white">
                ₹{{ sku.grossRevenue.toLocaleString() }}
              </td>
              <td class="px-4 py-3 text-right">
                <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {{ sku.marginPercent }}%
                </span>
              </td>
            </tr>
          </ng-container>
        </app-data-table>
      </div>

      <!-- TAB 2: CATEGORY SALES TABLE -->
      <div *ngIf="activeTab() === 'categories'" class="space-y-4">
        <app-data-table
          [columns]="categoryColumns"
          [totalCount]="filteredCategories().length"
          [pageSize]="10"
          searchPlaceholder="Search category name or use..."
          (search)="onCatSearch($event)"
        >
          <ng-container table-rows>
            <tr *ngFor="let cat of filteredCategories()" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
              <td class="px-4 py-3 font-bold text-slate-900 dark:text-white text-xs">
                {{ cat.name }}
              </td>
              <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                {{ cat.use }}
              </td>
              <td class="px-4 py-3 text-xs text-slate-500 font-mono">
                {{ cat.sizes }}
              </td>
              <td class="px-4 py-3 text-right font-semibold text-slate-800 dark:text-slate-200 text-xs">
                {{ cat.liters }}
              </td>
              <td class="px-4 py-3 text-right font-black text-slate-900 dark:text-white text-xs">
                {{ cat.revenue }}
              </td>
              <td class="px-4 py-3 text-right">
                <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  {{ cat.share }}
                </span>
              </td>
            </tr>
          </ng-container>
        </app-data-table>
      </div>
    </div>
  `
})
export class TenantReportsComponent {
  productService = inject(ProductService);
  orderService = inject(OrderService);
  exportService = inject(ExportService);
  readonly liveSyncService = inject(LiveSyncService);
  Math = Math;

  async syncLive(): Promise<void> {
    await this.liveSyncService.syncAll();
  }

  activeTab = signal<'skus' | 'categories'>('skus');
  skuSearch = signal<string>('');
  catSearch = signal<string>('');

  skuColumns: ColumnDef[] = [
    { key: 'name', label: 'Oil SKU & Size', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'unitsSold', label: 'Units Dispatched', sortable: true, align: 'right' },
    { key: 'unitPrice', label: 'Unit Retail Price', sortable: true, align: 'right' },
    { key: 'grossRevenue', label: 'Gross Sales', sortable: true, align: 'right' },
    { key: 'marginPercent', label: 'Margin %', sortable: true, align: 'right' }
  ];

  categoryColumns: ColumnDef[] = [
    { key: 'name', label: 'Oil Category', sortable: true },
    { key: 'use', label: 'Primary Culinary / Pooja Use' },
    { key: 'sizes', label: 'Available Pack Sizes' },
    { key: 'liters', label: 'Liters / Kg Extracted', sortable: true, align: 'right' },
    { key: 'revenue', label: 'Revenue Contribution', sortable: true, align: 'right' },
    { key: 'share', label: 'Catalog Share', align: 'right' }
  ];

  topSkus = [
    { sku: 'NPO-GND-5L', name: 'Cold Pressed Groundnut Oil (Mara Chekku)', size: '5 Litre Tin', category: 'Groundnut Oil', unitsSold: 580, unitPrice: 1250, grossRevenue: 725000, marginPercent: 28 },
    { sku: 'NPO-SES-1L', name: 'Pure Wood-Churned Sesame Oil (Gingelly)', size: '1 Litre Bottle', category: 'Sesame Oil', unitsSold: 920, unitPrice: 420, grossRevenue: 386400, marginPercent: 32 },
    { sku: 'NPO-COC-1L', name: 'Virgin Copra Coconut Oil', size: '1 Litre Bottle', category: 'Coconut Oil', unitsSold: 640, unitPrice: 340, grossRevenue: 217600, marginPercent: 30 },
    { sku: 'NPO-GND-1L', name: 'Cold Pressed Groundnut Oil', size: '1 Litre Bottle', category: 'Groundnut Oil', unitsSold: 710, unitPrice: 260, grossRevenue: 184600, marginPercent: 26 },
    { sku: 'NPO-LMP-5L', name: 'Pancha Deepa Pooja Oil Blend', size: '5 Litre Can', category: 'Lamp Oil', unitsSold: 220, unitPrice: 780, grossRevenue: 171600, marginPercent: 35 },
    { sku: 'NPO-CAKE-15KG', name: 'Organic Mara Chekku Groundnut Oil Cake', size: '15 Kg Gunny Bag', category: 'Agro By-Products', unitsSold: 410, unitPrice: 650, grossRevenue: 266500, marginPercent: 22 }
  ];

  reportCategories = [
    { name: 'Groundnut Oil', use: 'Daily Cooking & Deep Frying', sizes: '500ml, 1L, 2L, 5L, 15L', liters: '1,850 L', revenue: '₹4,62,500', share: '32.5%' },
    { name: 'Sesame Oil (Gingelly)', use: 'Traditional Chekku & Idli Podi', sizes: '200ml, 500ml, 1L, 5L', liters: '1,240 L', revenue: '₹4,46,400', share: '31.4%' },
    { name: 'Coconut Oil', use: 'Cooking & Hair Care', sizes: '100ml, 500ml, 1L, 2L, 5L', liters: '820 L', revenue: '₹2,62,400', share: '18.5%' },
    { name: 'Lamp Oil (Puja Oil)', use: 'Pooja Deepam blend (5 Oils)', sizes: '500ml, 1L, 5L', liters: '540 L', revenue: '₹1,02,600', share: '7.2%' },
    { name: 'Castor Oil', use: 'Ayurvedic Cooling & Medicinal', sizes: '100ml, 200ml, 500ml', liters: '210 L', revenue: '₹75,600', share: '5.3%' },
    { name: 'Oil Cake & Burfi', use: 'Cattle Feed & Sweets', sizes: '5Kg, 15Kg bags', liters: '8,400 Kg', revenue: '₹1,68,000', share: '5.1%' }
  ];

  filteredSkus = computed(() => {
    const q = this.skuSearch().toLowerCase().trim();
    if (!q) return this.topSkus;
    return this.topSkus.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.sku.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  });

  filteredCategories = computed(() => {
    const q = this.catSearch().toLowerCase().trim();
    if (!q) return this.reportCategories;
    return this.reportCategories.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.use.toLowerCase().includes(q)
    );
  });

  onSkuSearch(q: string): void {
    this.skuSearch.set(q);
  }

  onCatSearch(q: string): void {
    this.catSearch.set(q);
  }

  exportActiveReport(): void {
    if (this.activeTab() === 'skus') {
      this.exportService.exportToCsv('NishaPureOils-TopSKUs', this.topSkus);
    } else {
      this.exportService.exportToCsv('NishaPureOils-Category-Sales', this.reportCategories);
    }
  }
}
