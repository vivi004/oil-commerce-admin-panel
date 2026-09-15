import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantService } from '../../../core/services/tenant.service';
import { ExportService } from '../../../core/services/export.service';

@Component({
  selector: 'app-super-reports',
  standalone: true,
  imports: [CommonModule],
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
    </div>
  `
})
export class SuperReportsComponent {
  tenantService = inject(TenantService);
  exportService = inject(ExportService);
  Math = Math;

  exportData(): void {
    const data = this.tenantService.tenants().map(t => ({
      TenantName: t.name,
      Entity: t.businessName,
      Owner: t.ownerName,
      Email: t.email,
      Plan: t.planTier,
      MRR: t.mrr,
      TotalOrders: t.totalOrders,
      Status: t.status,
      JoinedDate: t.createdAt
    }));
    this.exportService.exportToCsv('SuperAdmin-Platform-Report', data);
  }
}
