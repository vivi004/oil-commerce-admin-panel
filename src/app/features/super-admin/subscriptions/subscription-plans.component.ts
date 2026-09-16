import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService } from '../../../core/services/tenant.service';
import { SubscriptionTier } from '../../../core/enums/app.enums';
import { SubscriptionPlan } from '../../../core/models/app.models';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-subscription-plans',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, BadgeComponent, ModalComponent],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">SaaS Subscription Tiers</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Configure multi-tenant plan pricing, order quotas, and feature entitlements for cold-pressed oil enterprises.</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- View Switcher -->
          <div class="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              (click)="viewMode.set('table')"
              [ngClass]="viewMode() === 'table' ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
              class="px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all"
              title="Table View"
            >
              <span class="material-symbols-outlined text-[16px]">table_rows</span>
              <span>Table</span>
            </button>
            <button
              type="button"
              (click)="viewMode.set('cards')"
              [ngClass]="viewMode() === 'cards' ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
              class="px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all"
              title="Pricing Cards View"
            >
              <span class="material-symbols-outlined text-[16px]">view_agenda</span>
              <span>Cards</span>
            </button>
          </div>

          <button
            type="button"
            (click)="openEditModal(null)"
            class="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/20 transition-colors flex items-center justify-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">add</span>
            <span>New Pricing Tier</span>
          </button>
        </div>
      </div>

      <!-- TABLE VIEW -->
      <div *ngIf="viewMode() === 'table'" class="space-y-4">
        <app-data-table
          [columns]="columns"
          [totalCount]="filteredPlans().length"
          [pageSize]="10"
          searchPlaceholder="Search tier name or features..."
          (search)="onSearch($event)"
        >
          <ng-container table-rows>
            <tr *ngFor="let plan of filteredPlans()" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
              <!-- Tier & Name -->
              <td class="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                <div class="flex items-center gap-2.5">
                  <span class="px-2.5 py-1 rounded-md text-xs font-bold" [ngClass]="plan.tier === SubscriptionTier.ENTERPRISE ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'">
                    {{ plan.tier }}
                  </span>
                  <div>
                    <div class="text-xs font-bold">{{ plan.name }}</div>
                    <div class="text-[10px] text-slate-400">{{ plan.features.slice(0, 2).join(' • ') }}</div>
                  </div>
                </div>
              </td>

              <!-- Monthly Fee -->
              <td class="px-4 py-3 font-bold text-slate-900 dark:text-white text-xs">
                ₹{{ plan.priceMonthly.toLocaleString() }}
                <span class="text-[10px] text-slate-400 font-normal">/mo</span>
              </td>

              <!-- Annual Fee -->
              <td class="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs">
                ₹{{ plan.priceAnnual.toLocaleString() }}
                <span class="text-[10px] text-slate-400 font-normal">/yr</span>
              </td>

              <!-- Max Products -->
              <td class="px-4 py-3 text-right font-medium text-xs text-slate-800 dark:text-slate-200">
                {{ plan.maxProducts }} SKUs
              </td>

              <!-- Max Users -->
              <td class="px-4 py-3 text-right font-medium text-xs text-slate-800 dark:text-slate-200">
                {{ plan.maxUsers }} Seats
              </td>

              <!-- Max Orders -->
              <td class="px-4 py-3 text-right font-medium text-xs text-slate-800 dark:text-slate-200">
                {{ plan.maxOrdersPerMonth.toLocaleString() }} /mo
              </td>

              <!-- Status -->
              <td class="px-4 py-3">
                <app-badge variant="emerald" [dot]="true">
                  Active
                </app-badge>
              </td>

              <!-- Actions -->
              <td class="px-4 py-3 text-right">
                <button
                  type="button"
                  (click)="openEditModal(plan)"
                  class="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200/60 dark:border-purple-800/40 transition-colors inline-flex items-center gap-1"
                >
                  <span class="material-symbols-outlined text-[15px]">edit</span>
                  <span>Edit Tier</span>
                </button>
              </td>
            </tr>
          </ng-container>
        </app-data-table>
      </div>

      <!-- CARDS VIEW -->
      <div *ngIf="viewMode() === 'cards'" class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div
          *ngFor="let plan of filteredPlans()"
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
            (click)="openEditModal(plan)"
            class="w-full py-2.5 rounded-xl font-semibold text-xs transition-colors"
            [ngClass]="plan.tier === SubscriptionTier.ENTERPRISE ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'"
          >
            Edit Tier Rules
          </button>
        </div>
      </div>

      <!-- Edit Modal -->
      <app-modal
        [isOpen]="isModalOpen()"
        [title]="editingPlan() ? 'Configure ' + editingPlan()?.name : 'Create Subscription Tier'"
        subtitle="Set quotas and pricing for oil mill enterprises"
        icon="loyalty"
        size="md"
        (close)="isModalOpen.set(false)"
      >
        <div class="space-y-4 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Monthly Price (₹) *</label>
              <input type="number" [(ngModel)]="tempMonthly" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Annual Price (₹) *</label>
              <input type="number" [(ngModel)]="tempAnnual" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Max SKUs</label>
              <input type="number" [(ngModel)]="tempProducts" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Team Seats</label>
              <input type="number" [(ngModel)]="tempUsers" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Orders / mo</label>
              <input type="number" [(ngModel)]="tempOrders" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
            </div>
          </div>
        </div>

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
            (click)="savePlan()"
            class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-xs"
          >
            Save Tier Configuration
          </button>
        </div>
      </app-modal>
    </div>
  `
})
export class SubscriptionPlansComponent {
  tenantService = inject(TenantService);
  readonly SubscriptionTier = SubscriptionTier;

  viewMode = signal<'cards' | 'table'>('table');
  searchQuery = signal<string>('');

  isModalOpen = signal<boolean>(false);
  editingPlan = signal<SubscriptionPlan | null>(null);

  tempMonthly = 0;
  tempAnnual = 0;
  tempProducts = 0;
  tempUsers = 0;
  tempOrders = 0;

  columns: ColumnDef[] = [
    { key: 'name', label: 'Subscription Tier & Name', sortable: true },
    { key: 'priceMonthly', label: 'Monthly Fee', sortable: true },
    { key: 'priceAnnual', label: 'Annual Fee', sortable: true },
    { key: 'maxProducts', label: 'Catalog Quota', sortable: true, align: 'right' },
    { key: 'maxUsers', label: 'Team Seats', sortable: true, align: 'right' },
    { key: 'maxOrdersPerMonth', label: 'Order Velocity', sortable: true, align: 'right' },
    { key: 'status', label: 'Tier Status' },
    { key: 'actions', label: 'Actions', align: 'right' }
  ];

  filteredPlans = computed(() => {
    let list = this.tenantService.plans();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.tier.toLowerCase().includes(q) ||
        p.features.some(f => f.toLowerCase().includes(q))
      );
    }
    return list;
  });

  onSearch(q: string): void {
    this.searchQuery.set(q);
  }

  openEditModal(plan: SubscriptionPlan | null): void {
    this.editingPlan.set(plan);
    if (plan) {
      this.tempMonthly = plan.priceMonthly;
      this.tempAnnual = plan.priceAnnual;
      this.tempProducts = plan.maxProducts;
      this.tempUsers = plan.maxUsers;
      this.tempOrders = plan.maxOrdersPerMonth;
    }
    this.isModalOpen.set(true);
  }

  savePlan(): void {
    const plan = this.editingPlan();
    if (plan) {
      this.tenantService.updatePlan(plan.id, {
        priceMonthly: this.tempMonthly,
        priceAnnual: this.tempAnnual,
        maxProducts: this.tempProducts,
        maxUsers: this.tempUsers,
        maxOrdersPerMonth: this.tempOrders
      });
    }
    this.isModalOpen.set(false);
  }
}
