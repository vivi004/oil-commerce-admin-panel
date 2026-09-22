import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { LiveSyncService } from '../../../core/services/live-sync.service';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { OrderStatus } from '../../../core/enums/app.enums';

@Component({
  selector: 'app-tenant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatCardComponent, BadgeComponent],
  template: `
    <div class="space-y-6">
      <!-- Welcome Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Nisha Pure Oils • Operations Center</h1>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              Cold-Pressed Store
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time orders, wood-pressed inventory levels, and automated daily seed price sync.</p>
        </div>

        <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <!-- Sync Live Button -->
          <button
            type="button"
            (click)="syncLive()"
            [disabled]="liveSyncService.isSyncing()"
            class="flex-1 sm:flex-initial justify-center px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-60"
            title="Sync all metrics, orders & catalog live"
          >
            <span class="material-symbols-outlined text-[16px]" [ngClass]="{'animate-spin text-amber-500': liveSyncService.isSyncing()}">sync</span>
            <span>{{ liveSyncService.isSyncing() ? 'Syncing...' : 'Sync Live' }}</span>
          </button>

          <a
            routerLink="/tenant-admin/google-sheet-pricing"
            class="flex-1 sm:flex-initial justify-center px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold text-xs hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[18px]">table_view</span>
            <span>Sync Mandi Sheet</span>
          </a>

          <a
            routerLink="/tenant-admin/products/new"
            class="flex-1 sm:flex-initial justify-center px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition-colors flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[18px]">add_box</span>
            <span>Add Oil Product</span>
          </a>
        </div>
      </div>

      <!-- KPI Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <app-stat-card
          title="Total Store Revenue"
          [value]="'₹' + orderService.totalRevenue().toLocaleString()"
          icon="payments"
          iconBgClass="bg-amber-50 dark:bg-amber-950/50"
          iconTextClass="text-amber-600 dark:text-amber-400"
          trendText="+14.2% this month"
          [isPositive]="true"
          subtitle="From cold-pressed oil sales"
        ></app-stat-card>

        <app-stat-card
          title="Active Orders"
          [value]="orderService.totalOrdersCount()"
          icon="receipt_long"
          iconBgClass="bg-blue-50 dark:bg-blue-950/50"
          iconTextClass="text-blue-600 dark:text-blue-400"
          trendText="4 Pending Fulfillment"
          [isPositive]="true"
          subtitle="Groundnut, Sesame, Lamp"
        ></app-stat-card>

        <app-stat-card
          title="Oil Products in Catalog"
          [value]="productService.totalProductsCount()"
          unit="SKUs"
          icon="oil_barrel"
          iconBgClass="bg-purple-50 dark:bg-purple-950/50"
          iconTextClass="text-purple-600 dark:text-purple-400"
          trendText="10 Categories Active"
          [isPositive]="true"
          subtitle="9 Variant Sizes Supported"
        ></app-stat-card>

        <app-stat-card
          title="Low-Stock Alerts"
          [value]="inventoryService.lowStockVariants().length"
          icon="warning"
          iconBgClass="bg-rose-50 dark:bg-rose-950/50"
          iconTextClass="text-rose-600 dark:text-rose-400"
          trendText="Reorder needed"
          [isPositive]="false"
          subtitle="Variants below threshold"
        ></app-stat-card>
      </div>

      <!-- Main Two-Column Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Recent Orders Pipeline -->
        <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-base font-bold text-slate-900 dark:text-white">Recent Customer Orders</h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">Retail & bulk cold-pressed oil dispatches</p>
            </div>
            <a routerLink="/tenant-admin/orders" class="text-xs font-semibold text-amber-600 hover:text-amber-500">
              Manage Orders ({{ orderService.totalOrdersCount() }}) →
            </a>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th class="py-2.5 pr-4">Order #</th>
                  <th class="py-2.5 px-3">Customer</th>
                  <th class="py-2.5 px-3">Status</th>
                  <th class="py-2.5 px-3">Payment</th>
                  <th class="py-2.5 pl-3 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                <tr *ngFor="let order of orderService.orders().slice(0, 5)" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td class="py-3 pr-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                    {{ order.orderNumber }}
                  </td>
                  <td class="py-3 px-3">
                    <div class="font-semibold text-slate-900 dark:text-white">{{ order.customerName }}</div>
                    <div class="text-[10px] text-slate-400">{{ order.items.length }} oil item(s)</div>
                  </td>
                  <td class="py-3 px-3">
                    <app-badge [variant]="getOrderStatusVariant(order.status)" [dot]="true">
                      {{ order.status }}
                    </app-badge>
                  </td>
                  <td class="py-3 px-3">
                    <app-badge [variant]="order.paymentStatus === 'PAID' ? 'emerald' : 'amber'">
                      {{ order.paymentStatus }}
                    </app-badge>
                  </td>
                  <td class="py-3 pl-3 text-right font-black text-slate-900 dark:text-white">
                    ₹{{ order.grandTotal.toLocaleString() }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Low Stock Items & Quick Actions -->
        <div class="space-y-6">
          <!-- Low Stock Alert Box -->
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <span class="material-symbols-outlined text-[20px]">warning</span>
                <span>Low-Stock Warnings</span>
              </div>
              <a routerLink="/tenant-admin/inventory" class="text-xs text-amber-600 hover:underline">Adjust</a>
            </div>

            <div class="space-y-2.5">
              <div
                *ngFor="let item of inventoryService.lowStockVariants().slice(0, 4)"
                class="p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between text-xs"
              >
                <div>
                  <div class="font-bold text-slate-800 dark:text-slate-200">{{ item.productName }}</div>
                  <div class="text-[10px] text-slate-500 font-mono">Size: {{ item.variantSize }} • SKU: {{ item.sku }}</div>
                </div>
                <div class="text-right">
                  <span class="px-2 py-0.5 rounded-md font-bold text-rose-700 bg-rose-100 dark:bg-rose-900/60 dark:text-rose-300">
                    {{ item.stockQuantity }} left
                  </span>
                  <div class="text-[9px] text-slate-400 mt-0.5">Min: {{ item.reorderLevel }}</div>
                </div>
              </div>

              <div *ngIf="inventoryService.lowStockVariants().length === 0" class="text-center py-4 text-xs text-slate-400">
                All cold-pressed oil inventories are healthy!
              </div>
            </div>
          </div>

          <!-- Quick Navigation Shortcuts -->
          <div class="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-5 shadow-md shadow-amber-500/20">
            <h3 class="font-extrabold text-sm mb-1">Mandi Daily Seed Price Sync</h3>
            <p class="text-xs text-amber-100 mb-3">
              Groundnut & Sesame mandi market rates fluctuated today. Review differences before catalog publishing.
            </p>
            <a
              routerLink="/tenant-admin/google-sheet-pricing"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-amber-800 font-bold text-xs shadow-xs hover:bg-amber-50 transition-colors"
            >
              <span>Review Price Diff</span>
              <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TenantDashboardComponent {
  orderService = inject(OrderService);
  productService = inject(ProductService);
  inventoryService = inject(InventoryService);
  readonly liveSyncService = inject(LiveSyncService);

  readonly OrderStatus = OrderStatus;

  async syncLive(): Promise<void> {
    await this.liveSyncService.syncAll();
  }

  getOrderStatusVariant(status: OrderStatus): 'emerald' | 'amber' | 'blue' | 'rose' | 'slate' {
    switch (status) {
      case OrderStatus.DELIVERED: return 'emerald';
      case OrderStatus.SHIPPED: return 'blue';
      case OrderStatus.PROCESSING: return 'amber';
      case OrderStatus.CANCELLED: return 'rose';
      default: return 'slate';
    }
  }
}
