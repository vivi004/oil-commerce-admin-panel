import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';
import { OrderService } from '../../../core/services/order.service';
import { ExportService } from '../../../core/services/export.service';

@Component({
  selector: 'app-tenant-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Sales & Oil Extraction Analytics</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Volume extracted in Liters & Kg, revenue share per seed category, and fulfillment rates.</p>
        </div>
        <button
          type="button"
          (click)="exportSummary()"
          class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition-colors flex items-center justify-center gap-2"
        >
          <span class="material-symbols-outlined text-[18px]">download</span>
          <span>Export Sales CSV</span>
        </button>
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

      <!-- Category Sales Contribution Table -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs">
        <h2 class="text-sm font-bold text-slate-900 dark:text-white mb-4">Revenue Contribution by Oil Category</h2>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                <th class="py-2.5 pr-4">Category</th>
                <th class="py-2.5 px-3">Primary Use</th>
                <th class="py-2.5 px-3">Available Variants</th>
                <th class="py-2.5 px-3 text-right">Liters Extracted</th>
                <th class="py-2.5 pl-3 text-right">Revenue Contribution</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
              <tr *ngFor="let cat of reportCategories" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td class="py-3 pr-4 font-bold text-slate-900 dark:text-white">{{ cat.name }}</td>
                <td class="py-3 px-3 text-slate-600 dark:text-slate-400">{{ cat.use }}</td>
                <td class="py-3 px-3 text-slate-600 dark:text-slate-400">{{ cat.sizes }}</td>
                <td class="py-3 px-3 text-right font-semibold text-slate-800 dark:text-slate-200">{{ cat.liters }}</td>
                <td class="py-3 pl-3 text-right font-black text-slate-900 dark:text-white">{{ cat.revenue }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class TenantReportsComponent {
  productService = inject(ProductService);
  orderService = inject(OrderService);
  exportService = inject(ExportService);
  Math = Math;

  reportCategories = [
    { name: 'Groundnut Oil', use: 'Daily Cooking & Deep Frying', sizes: '500ml, 1L, 2L, 5L, 15L', liters: '1,850 L', revenue: '₹4,62,500' },
    { name: 'Sesame Oil (Gingelly)', use: 'Traditional Chekku & Idli Podi', sizes: '200ml, 500ml, 1L, 5L', liters: '1,240 L', revenue: '₹4,46,400' },
    { name: 'Coconut Oil', use: 'Cooking & Hair Care', sizes: '100ml, 500ml, 1L, 2L, 5L', liters: '820 L', revenue: '₹2,62,400' },
    { name: 'Lamp Oil (Puja Oil)', use: 'Pooja Deepam blend (5 Oils)', sizes: '500ml, 1L, 5L', liters: '540 L', revenue: '₹1,02,600' },
    { name: 'Castor Oil', use: 'Ayurvedic Cooling & Medicinal', sizes: '100ml, 200ml, 500ml', liters: '210 L', revenue: '₹75,600' },
    { name: 'Oil Cake & Burfi', use: 'Cattle Feed & Sweets', sizes: '5Kg, 15Kg bags', liters: '8,400 Kg', revenue: '₹1,68,000' }
  ];

  exportSummary(): void {
    this.exportService.exportToCsv('NishaPureOils-Category-Sales', this.reportCategories);
  }
}
