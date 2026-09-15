import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TenantService } from '../../../core/services/tenant.service';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { TenantStatus } from '../../../core/enums/app.enums';

@Component({
  selector: 'app-super-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatCardComponent, BadgeComponent],
  template: `
    <div class="space-y-6">
      <!-- Welcome / Header Banner -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-2xl p-5 sm:p-8 shadow-xl relative overflow-hidden">
        <div class="relative z-10">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
            <span class="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            Super Admin Control Center
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">Platform Governance & Multi-Tenant Fleet</h1>
          <p class="mt-1 text-xs sm:text-sm text-slate-300 max-w-xl">
            Oversee oil manufacturing tenants, cold-pressed commodity brands, monthly recurring revenue, and platform API health.
          </p>
        </div>

        <div class="relative z-10 flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <a
            routerLink="/super-admin/tenants"
            class="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-md shadow-purple-600/30"
          >
            <span class="material-symbols-outlined text-[18px]">add_business</span>
            <span>Provision Tenant</span>
          </a>
          <a
            routerLink="/tenant-admin/dashboard"
            class="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors backdrop-blur-xs flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">storefront</span>
            <span>Storefront View</span>
          </a>
        </div>

        <!-- Decorative background glow -->
        <div class="absolute -right-12 -top-12 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      <!-- KPI Stat Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <app-stat-card
          title="Platform MRR"
          [value]="'₹' + tenantService.totalPlatformMRR().toLocaleString()"
          icon="currency_rupee"
          iconBgClass="bg-purple-50 dark:bg-purple-950/50"
          iconTextClass="text-purple-600 dark:text-purple-400"
          trendText="+18.4% vs last month"
          [isPositive]="true"
          subtitle="4 active enterprise brands"
        ></app-stat-card>

        <app-stat-card
          title="Active Tenants"
          [value]="tenantService.activeTenantsCount()"
          unit="Enterprises"
          icon="domain"
          iconBgClass="bg-blue-50 dark:bg-blue-950/50"
          iconTextClass="text-blue-600 dark:text-blue-400"
          trendText="100% operational"
          [isPositive]="true"
          subtitle="Nisha, Varshini, Kavi, Royal"
        ></app-stat-card>

        <app-stat-card
          title="Total Platform Orders"
          [value]="tenantService.totalPlatformOrders().toLocaleString()"
          icon="local_shipping"
          iconBgClass="bg-emerald-50 dark:bg-emerald-950/50"
          iconTextClass="text-emerald-600 dark:text-emerald-400"
          trendText="+12.5% this week"
          [isPositive]="true"
          subtitle="Cold-pressed oil dispatches"
        ></app-stat-card>

        <app-stat-card
          title="Cold-Pressed SKUs"
          [value]="productService.totalProductsCount()"
          unit="Products"
          icon="oil_barrel"
          iconBgClass="bg-amber-50 dark:bg-amber-950/50"
          iconTextClass="text-amber-600 dark:text-amber-400"
          trendText="10 Oil Categories"
          [isPositive]="true"
          subtitle="Groundnut, Sesame, Coconut & more"
        ></app-stat-card>
      </div>

      <!-- Tenant Performance & Multi-Tenant Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Tenants Table -->
        <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-base font-bold text-slate-900 dark:text-white">Active Oil Enterprises & Tenants</h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">Stores licensed under cold-pressed commerce license</p>
            </div>
            <a routerLink="/super-admin/tenants" class="text-xs font-semibold text-purple-600 hover:text-purple-500">
              View All ({{ tenantService.totalTenantsCount() }}) →
            </a>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full min-w-[560px] text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th class="py-2.5 pr-4">Tenant / Brand</th>
                  <th class="py-2.5 px-3">Owner</th>
                  <th class="py-2.5 px-3">Tier</th>
                  <th class="py-2.5 px-3">Status</th>
                  <th class="py-2.5 px-3 text-right">MRR</th>
                  <th class="py-2.5 pl-3 text-right">Orders</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                <tr *ngFor="let tenant of tenantService.tenants()" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td class="py-3.5 pr-4 font-semibold text-slate-900 dark:text-white">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                        {{ tenant.name.charAt(0) }}
                      </div>
                      <div>
                        <div>{{ tenant.name }}</div>
                        <div class="text-[10px] text-slate-400">{{ tenant.businessName }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3.5 px-3 text-slate-600 dark:text-slate-400">{{ tenant.ownerName }}</td>
                  <td class="py-3.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{{ tenant.planTier }}</td>
                  <td class="py-3.5 px-3">
                    <app-badge [variant]="tenant.status === TenantStatus.ACTIVE ? 'emerald' : 'amber'" [dot]="true">
                      {{ tenant.status }}
                    </app-badge>
                  </td>
                  <td class="py-3.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                    ₹{{ tenant.mrr.toLocaleString() }}
                  </td>
                  <td class="py-3.5 pl-3 text-right font-medium text-slate-600 dark:text-slate-400">
                    {{ tenant.totalOrders.toLocaleString() }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Platform System Health & Multi-Tenant Oil Stats -->
        <div class="space-y-6">
          <!-- Infrastructure Status -->
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <h2 class="text-base font-bold text-slate-900 dark:text-white mb-3">Platform System Health</h2>
            <div class="space-y-3 text-xs">
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span class="font-medium text-slate-700 dark:text-slate-300">Google Sheet Pricing API</span>
                </div>
                <span class="text-[11px] font-bold text-emerald-600">Optimal (42ms)</span>
              </div>

              <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span class="font-medium text-slate-700 dark:text-slate-300">Payment Gateways (Razorpay/UPI)</span>
                </div>
                <span class="text-[11px] font-bold text-emerald-600">99.98% Up</span>
              </div>

              <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span class="font-medium text-slate-700 dark:text-slate-300">Multi-Warehouse Redis Cache</span>
                </div>
                <span class="text-[11px] font-bold text-emerald-600">Healthy</span>
              </div>
            </div>
          </div>

          <!-- Oil Commodity Overview -->
          <div class="bg-gradient-to-br from-amber-50 to-amber-100/40 dark:from-slate-900 dark:to-amber-950/20 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 p-5 shadow-xs">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">science</span>
              </div>
              <h3 class="font-bold text-sm text-slate-900 dark:text-white">Cold-Pressed Commodities</h3>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Currently indexing 10 cold-pressed oil categories including Groundnut, Coconut, Sesame, Neem, Mahua & Lamp oils.
            </p>
            <div class="flex flex-wrap gap-1.5">
              <span class="px-2 py-1 rounded-md bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Groundnut Oil</span>
              <span class="px-2 py-1 rounded-md bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Coconut Oil</span>
              <span class="px-2 py-1 rounded-md bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Sesame Oil</span>
              <span class="px-2 py-1 rounded-md bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Castor Oil</span>
              <span class="px-2 py-1 rounded-md bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">+6 more</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SuperDashboardComponent {
  tenantService = inject(TenantService);
  orderService = inject(OrderService);
  productService = inject(ProductService);

  readonly TenantStatus = TenantStatus;
}
