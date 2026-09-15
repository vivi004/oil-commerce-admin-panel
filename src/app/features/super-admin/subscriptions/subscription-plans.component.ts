import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantService } from '../../../core/services/tenant.service';
import { SubscriptionTier } from '../../../core/enums/app.enums';

@Component({
  selector: 'app-subscription-plans',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">SaaS Subscription Tiers</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Configure multi-tenant plan pricing, order quotas, and feature entitlements for cold-pressed oil enterprises.</p>
        </div>
        <button
          type="button"
          class="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
        >
          <span class="material-symbols-outlined text-[18px]">add</span>
          <span>New Pricing Tier</span>
        </button>
      </div>

      <!-- Plan Pricing Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div
          *ngFor="let plan of tenantService.plans()"
          class="bg-white dark:bg-slate-900 rounded-2xl border transition-all p-4 sm:p-6 relative flex flex-col justify-between"
          [ngClass]="plan.tier === SubscriptionTier.ENTERPRISE ? 'border-purple-500 shadow-xl shadow-purple-500/10 ring-2 ring-purple-500/20' : 'border-slate-200 dark:border-slate-800 shadow-xs'"
        >
          <div *ngIf="plan.tier === SubscriptionTier.ENTERPRISE" class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-purple-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm">
            Most Popular
          </div>

          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-extrabold text-base text-slate-900 dark:text-white">{{ plan.name }}</h3>
              <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {{ plan.tier }}
              </span>
            </div>

            <div class="mb-6">
              <div class="flex items-baseline gap-1">
                <span class="text-3xl font-black text-slate-900 dark:text-white">₹{{ plan.priceMonthly.toLocaleString() }}</span>
                <span class="text-xs text-slate-400">/ month</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-1">Billed annually at ₹{{ plan.priceAnnual.toLocaleString() }} / yr</p>
            </div>

            <div class="space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-4 mb-6 text-xs">
              <div class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span class="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span>
                <span>Max Products: <strong class="text-slate-900 dark:text-white">{{ plan.maxProducts }}</strong></span>
              </div>
              <div class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span class="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span>
                <span>Team Members: <strong class="text-slate-900 dark:text-white">{{ plan.maxUsers }}</strong></span>
              </div>
              <div class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span class="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span>
                <span>Orders / mo: <strong class="text-slate-900 dark:text-white">{{ plan.maxOrdersPerMonth.toLocaleString() }}</strong></span>
              </div>

              <!-- Feature List -->
              <div *ngFor="let feat of plan.features" class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <span class="material-symbols-outlined text-[16px] text-purple-500">verified</span>
                <span>{{ feat }}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="w-full py-2.5 rounded-xl font-semibold text-xs transition-colors"
            [ngClass]="plan.tier === SubscriptionTier.ENTERPRISE ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'"
          >
            Edit Tier Rules
          </button>
        </div>
      </div>
    </div>
  `
})
export class SubscriptionPlansComponent {
  tenantService = inject(TenantService);
  readonly SubscriptionTier = SubscriptionTier;
}
