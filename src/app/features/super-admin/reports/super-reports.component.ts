import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantService } from '../../../core/services/tenant.service';
import { ExportService } from '../../../core/services/export.service';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-super-reports',
  standalone: true,
  imports: [CommonModule, DataTableComponent, BadgeComponent],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Platform Analytics & SaaS Reports</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Financial summaries, revenue per tenant, and cold-pressed commodity commerce velocity.</p>
        </div>
        <button
          type="button"
          (click)="exportData()"
          class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/20 transition-colors flex items-center justify-center gap-2"
        >
          <span class="material-symbols-outlined text-[18px]">download</span>
          <span>Export Platform CSV</span>
        </button>
      </div>

      <!-- Financial Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
          <div class="text-xs font-semibold text-slate-400 uppercase">Annualized Run Rate (ARR)</div>
          <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">₹{{ (tenantService.totalPlatformMRR() * 12).toLocaleString() }}</div>
          <div class="text-[11px] text-emerald-600 mt-2 flex items-center gap-1 font-medium">
            <span class="material-symbols-outlined text-[14px]">trending_up</span> +22.8% projected
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div class="text-xs font-semibold text-slate-400 uppercase">Average MRR per Brand</div>
          <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ₹{{ Math.round(tenantService.totalPlatformMRR() / Math.max(1, tenantService.activeTenantsCount())).toLocaleString() }}
          </div>
          <div class="text-[11px] text-slate-500 mt-2">Across 4 active oil manufacturers</div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div class="text-xs font-semibold text-slate-400 uppercase">Total Liters Dispatched Platform-wide</div>
          <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">14,820 L</div>
          <div class="text-[11px] text-emerald-600 mt-2 flex items-center gap-1 font-medium">
            <span class="material-symbols-outlined text-[14px]">oil_barrel</span> Peak extraction season
          </div>
        </div>
      </div>

      <!-- TENANT PERFORMANCE & REVENUE TABLE -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold text-slate-900 dark:text-white">Tenant Performance & SaaS Revenue Ledger</h2>
          <span class="text-xs text-slate-400">Showing all multi-tenant mill enterprise metrics</span>
        </div>

        <app-data-table
          [columns]="columns"
          [totalCount]="filteredTenants().length"
          [pageSize]="10"
          searchPlaceholder="Search tenant brand, owner or plan..."
          (search)="onSearch($event)"
        >
          <ng-container table-rows>
            <tr *ngFor="let t of filteredTenants()" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
              <td class="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center">
                    {{ t.name.charAt(0) }}
                  </div>
                  <div>
                    <div class="text-xs font-bold">{{ t.name }}</div>
                    <div class="text-[10px] text-slate-400">{{ t.businessName }}</div>
                  </div>
                </div>
              </td>

              <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                <div>{{ t.ownerName }}</div>
                <div class="text-[10px] text-slate-400">{{ t.email }}</div>
              </td>

              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-md text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                  {{ t.planTier }}
                </span>
              </td>

              <td class="px-4 py-3 text-right font-black text-slate-900 dark:text-white text-xs">
                ₹{{ t.mrr.toLocaleString() }}
              </td>

              <td class="px-4 py-3 text-right font-bold text-xs text-slate-800 dark:text-slate-200">
                {{ t.totalOrders.toLocaleString() }}
              </td>

              <td class="px-4 py-3 text-right font-bold text-xs text-emerald-600 dark:text-emerald-400">
                ₹{{ (t.totalOrders * 850).toLocaleString() }}
              </td>

              <td class="px-4 py-3">
                <app-badge [variant]="t.status === 'ACTIVE' ? 'emerald' : 'rose'" [dot]="true">
                  {{ t.status }}
                </app-badge>
              </td>

              <td class="px-4 py-3 text-xs text-slate-400 text-right">
                {{ t.createdAt }}
              </td>
            </tr>
          </ng-container>
        </app-data-table>
      </div>
    </div>
  `
})
export class SuperReportsComponent {
  tenantService = inject(TenantService);
  exportService = inject(ExportService);
  Math = Math;

  searchQuery = signal<string>('');

  columns: ColumnDef[] = [
    { key: 'name', label: 'Tenant / Oil Brand', sortable: true },
    { key: 'ownerName', label: 'Owner & Contact', sortable: true },
    { key: 'planTier', label: 'Subscription Plan', sortable: true },
    { key: 'mrr', label: 'Monthly SaaS MRR', sortable: true, align: 'right' },
    { key: 'totalOrders', label: 'Store Orders', sortable: true, align: 'right' },
    { key: 'gmv', label: 'Estimated GMV', align: 'right' },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'createdAt', label: 'Joined On', align: 'right' }
  ];

  filteredTenants = computed(() => {
    let list = this.tenantService.tenants();
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return list;
    return list.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.businessName.toLowerCase().includes(q) ||
      t.ownerName.toLowerCase().includes(q) ||
      t.planTier.toLowerCase().includes(q)
    );
  });

  onSearch(q: string): void {
    this.searchQuery.set(q);
  }

  exportData(): void {
    const data = this.tenantService.tenants().map(t => ({
      TenantName: t.name,
      Entity: t.businessName,
      Owner: t.ownerName,
      Email: t.email,
      Plan: t.planTier,
      MRR: t.mrr,
      TotalOrders: t.totalOrders,
      EstimatedGMV: t.totalOrders * 850,
      Status: t.status,
      JoinedDate: t.createdAt
    }));
    this.exportService.exportToCsv('SuperAdmin-Platform-Report', data);
  }
}
