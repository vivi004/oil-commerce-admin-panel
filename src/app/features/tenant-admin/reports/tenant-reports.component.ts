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

      <!-- KPI Summary Cards (live from services) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Orders Revenue</div>
          <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ₹{{ orderService.totalRevenue().toLocaleString() }}
          </div>
          <div class="text-[11px] text-emerald-600 mt-2 flex items-center gap-1 font-medium">
            <span class="material-symbols-outlined text-[14px]">trending_up</span>
            {{ orderService.totalOrdersCount() }} paid order(s) total
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Products in Catalog</div>
          <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {{ productService.totalProductsCount() }} SKUs
          </div>
          <div class="text-[11px] text-amber-600 mt-2 flex items-center gap-1 font-medium">
            <span class="material-symbols-outlined text-[14px]">eco</span>
            {{ productService.categories().length }} active oil categories
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Cart Size</div>
          <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ₹{{ Math.round(orderService.totalRevenue() / Math.max(1, orderService.totalOrdersCount())).toLocaleString() }}
          </div>
          <div class="text-[11px] text-slate-500 mt-2">Avg. revenue per paid order</div>
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
        <div *ngIf="topSkus().length === 0" class="text-center py-16 text-slate-400 dark:text-slate-500">
          <span class="material-symbols-outlined text-[48px] block mb-2 opacity-40">leaderboard</span>
          <div class="text-sm font-semibold">No SKU sales data yet</div>
          <div class="text-xs mt-1">All catalog SKUs will appear here sorted by revenue. Orders from the storefront contribute unit counts automatically.</div>
        </div>
        <app-data-table
          *ngIf="topSkus().length > 0"
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
        <div *ngIf="reportCategories().length === 0" class="text-center py-16 text-slate-400 dark:text-slate-500">
          <span class="material-symbols-outlined text-[48px] block mb-2 opacity-40">pie_chart</span>
          <div class="text-sm font-semibold">No category data yet</div>
          <div class="text-xs mt-1">Add products under categories to see revenue contribution per oil type.</div>
        </div>
        <app-data-table
          *ngIf="reportCategories().length > 0"
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
                {{ cat.productCount }} SKU(s)
              </td>
              <td class="px-4 py-3 text-right font-black text-slate-900 dark:text-white text-xs">
                ₹{{ cat.revenue.toLocaleString() }}
              </td>
              <td class="px-4 py-3 text-right">
                <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  {{ cat.share }}%
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
    { key: 'productCount', label: 'Products', sortable: true, align: 'right' },
    { key: 'revenue', label: 'Revenue Contribution', sortable: true, align: 'right' },
    { key: 'share', label: 'Catalog Share', align: 'right' }
  ];

  /**
   * Derives SKU-level report rows from real product catalog + order line items.
   * Each enabled product variant becomes one row.
   * Units sold are aggregated from all order items matching the variant SKU.
   * Margin % = (MRP - Selling Price) / MRP * 100.
   * Sorted by gross revenue descending, then by units sold.
   */
  topSkus = computed(() => {
    const products = this.productService.products();
    const orders = this.orderService.orders();

    const skuSalesMap = new Map<string, number>();
    for (const order of orders) {
      for (const item of order.items || []) {
        if (!item.sku) continue;
        skuSalesMap.set(item.sku, (skuSalesMap.get(item.sku) ?? 0) + (item.quantity || 0));
      }
    }

    const rows: {
      sku: string; name: string; size: string; category: string;
      unitsSold: number; unitPrice: number; grossRevenue: number; marginPercent: number;
    }[] = [];

    for (const prod of products) {
      for (const variant of prod.variants) {
        if (!variant.isEnabled) continue;
        const unitsSold = skuSalesMap.get(variant.sku) ?? 0;
        const grossRevenue = unitsSold * (variant.sellingPrice || 0);
        const marginPercent = variant.mrp && variant.sellingPrice && variant.mrp > 0
          ? Math.round(((variant.mrp - variant.sellingPrice) / variant.mrp) * 100)
          : 0;
        rows.push({
          sku: variant.sku, name: prod.name, size: variant.size, category: prod.category,
          unitsSold, unitPrice: variant.sellingPrice || 0, grossRevenue, marginPercent
        });
      }
    }

    return rows.sort((a, b) => b.grossRevenue - a.grossRevenue || b.unitsSold - a.unitsSold);
  });

  /**
   * Derives category-level revenue rows from real categories + products + orders.
   * Only categories with at least one product are shown.
   * Revenue = sum of order item revenue for products in that category.
   * Share = category revenue / total order revenue.
   * Sorted by revenue descending.
   */
  reportCategories = computed(() => {
    const products = this.productService.products();
    const categories = this.productService.categories();
    const orders = this.orderService.orders();

    const productRevenueMap = new Map<string, number>();
    for (const order of orders) {
      for (const item of order.items || []) {
        if (!item.productId) continue;
        productRevenueMap.set(item.productId, (productRevenueMap.get(item.productId) ?? 0) + (item.totalPrice || 0));
      }
    }

    const totalRevenue = Array.from(productRevenueMap.values()).reduce((a, b) => a + b, 0);

    return categories
      .filter(cat => cat.isActive)
      .map(cat => {
        const catProducts = products.filter(p => p.category === cat.name || p.categoryId === cat.id);
        const revenue = catProducts.reduce((sum, p) => sum + (productRevenueMap.get(p.id) ?? 0), 0);
        const productCount = catProducts.length;
        const enabledVariants = catProducts.flatMap(p => p.variants.filter(v => v.isEnabled));
        const sizes = [...new Set(enabledVariants.map(v => v.size))].join(', ') || '—';
        const share = totalRevenue > 0 ? ((revenue / totalRevenue) * 100).toFixed(1) : '0.0';
        return { name: cat.name, use: cat.description || '—', sizes, productCount, revenue, share };
      })
      .filter(cat => cat.productCount > 0)
      .sort((a, b) => b.revenue - a.revenue);
  });

  filteredSkus = computed(() => {
    const q = this.skuSearch().toLowerCase().trim();
    if (!q) return this.topSkus();
    return this.topSkus().filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.sku.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  });

  filteredCategories = computed(() => {
    const q = this.catSearch().toLowerCase().trim();
    if (!q) return this.reportCategories();
    return this.reportCategories().filter(c =>
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
      this.exportService.exportToCsv('NishaPureOils-TopSKUs', this.topSkus());
    } else {
      this.exportService.exportToCsv('NishaPureOils-Category-Sales', this.reportCategories());
    }
  }
}
