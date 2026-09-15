import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TenantService } from '../../../core/services/tenant.service';
import { Tenant } from '../../../core/models/app.models';
import { TenantStatus, SubscriptionTier } from '../../../core/enums/app.enums';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DataTableComponent,
    ModalComponent,
    ConfirmDialogComponent,
    BadgeComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Tenants & Brands</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Manage all registered oil manufacturing brands, licenses, and subscription plans.</p>
        </div>
        <button
          type="button"
          (click)="openCreateModal()"
          class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/20 transition-colors flex items-center justify-center gap-2"
        >
          <span class="material-symbols-outlined text-[18px]">add_business</span>
          <span>Provision New Tenant</span>
        </button>
      </div>

      <!-- Data Table -->
      <app-data-table
        [columns]="columns"
        [totalCount]="filteredTenants().length"
        [pageSize]="10"
        searchPlaceholder="Search by brand, owner, email..."
        (search)="onSearch($event)"
      >
        <div table-actions class="flex items-center gap-2 w-full sm:w-auto">
          <!-- Status Filter -->
          <select
            [value]="statusFilter()"
            (change)="onStatusFilterChange($event)"
            class="w-full sm:w-auto text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-3 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option [value]="TenantStatus.ACTIVE">Active</option>
            <option [value]="TenantStatus.SUSPENDED">Suspended</option>
            <option [value]="TenantStatus.PROVISIONING">Provisioning</option>
          </select>
        </div>

        <ng-container table-rows>
          <tr *ngFor="let tenant of filteredTenants()" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
            <!-- Brand / Name -->
            <td class="px-4 py-3 font-semibold text-slate-900 dark:text-white">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                  {{ tenant.name.charAt(0) }}
                </div>
                <div>
                  <div class="text-xs font-bold">{{ tenant.name }}</div>
                  <div class="text-[10px] text-slate-400">{{ tenant.businessName }}</div>
                </div>
              </div>
            </td>

            <!-- Owner & Contact -->
            <td class="px-4 py-3 text-slate-700 dark:text-slate-300">
              <div class="text-xs font-medium">{{ tenant.ownerName }}</div>
              <div class="text-[10px] text-slate-400">{{ tenant.email }} • {{ tenant.phone }}</div>
            </td>

            <!-- Tier -->
            <td class="px-4 py-3">
              <span class="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {{ tenant.planTier }}
              </span>
            </td>

            <!-- Status -->
            <td class="px-4 py-3">
              <app-badge [variant]="tenant.status === TenantStatus.ACTIVE ? 'emerald' : 'rose'" [dot]="true">
                {{ tenant.status }}
              </app-badge>
            </td>

            <!-- MRR -->
            <td class="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
              ₹{{ tenant.mrr.toLocaleString() }}
            </td>

            <!-- Total Orders -->
            <td class="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
              {{ tenant.totalOrders.toLocaleString() }}
            </td>

            <!-- Actions -->
            <td class="px-4 py-3 text-right space-x-1">
              <button
                type="button"
                (click)="toggleStatus(tenant)"
                class="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                [title]="tenant.status === TenantStatus.ACTIVE ? 'Suspend Tenant' : 'Activate Tenant'"
              >
                <span class="material-symbols-outlined text-[18px]">
                  {{ tenant.status === TenantStatus.ACTIVE ? 'pause_circle' : 'play_circle' }}
                </span>
              </button>
              <button
                type="button"
                (click)="confirmDelete(tenant)"
                class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Delete Tenant"
              >
                <span class="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </td>
          </tr>
        </ng-container>
      </app-data-table>

      <!-- Provision Tenant Modal -->
      <app-modal
        [isOpen]="isModalOpen()"
        title="Provision New Oil Brand / Tenant"
        subtitle="Set up a new isolated workspace for an edible oil manufacturer"
        icon="add_business"
        size="lg"
        (close)="isModalOpen.set(false)"
      >
        <form [formGroup]="tenantForm" class="space-y-4 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Brand / Display Name *</label>
              <input
                type="text"
                formControlName="name"
                placeholder="e.g. Varshini Gold Agro"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Registered Entity Name *</label>
              <input
                type="text"
                formControlName="businessName"
                placeholder="e.g. Varshini Oil Mills Pvt Ltd"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Owner / Primary Contact *</label>
              <input
                type="text"
                formControlName="ownerName"
                placeholder="e.g. Muruganathan S."
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Admin Email *</label>
              <input
                type="email"
                formControlName="email"
                placeholder="admin@brand.com"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone *</label>
              <input
                type="text"
                formControlName="phone"
                placeholder="+91 98765 43210"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Plan Tier *</label>
              <select
                formControlName="planTier"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option [value]="SubscriptionTier.STARTER">Starter</option>
                <option [value]="SubscriptionTier.PROFESSIONAL">Professional</option>
                <option [value]="SubscriptionTier.ENTERPRISE">Enterprise</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Initial MRR (₹)</label>
              <input
                type="number"
                formControlName="mrr"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
        </form>

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
            (click)="saveTenant()"
            class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-xs"
          >
            Create Tenant
          </button>
        </div>
      </app-modal>

      <!-- Delete Confirmation Dialog -->
      <app-confirm-dialog
        [isOpen]="isDeleteDialogOpen()"
        title="Delete Tenant"
        [message]="'Are you sure you want to permanently terminate tenant: ' + (selectedTenant()?.name ?? '') + '? All catalog and order data will be revoked.'"
        variant="danger"
        confirmText="Yes, Delete Tenant"
        (confirm)="executeDelete()"
        (cancel)="isDeleteDialogOpen.set(false)"
      ></app-confirm-dialog>
    </div>
  `
})
export class TenantListComponent {
  private tenantService = inject(TenantService);
  private fb = inject(FormBuilder);

  readonly TenantStatus = TenantStatus;
  readonly SubscriptionTier = SubscriptionTier;

  isModalOpen = signal<boolean>(false);
  isDeleteDialogOpen = signal<boolean>(false);
  selectedTenant = signal<Tenant | null>(null);

  searchQuery = signal<string>('');
  statusFilter = signal<string>('ALL');

  columns: ColumnDef[] = [
    { key: 'name', label: 'Tenant / Brand', sortable: true },
    { key: 'ownerName', label: 'Owner & Contact', sortable: true },
    { key: 'planTier', label: 'Subscription Plan', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'mrr', label: 'Monthly MRR', sortable: true, align: 'right' },
    { key: 'totalOrders', label: 'Total Orders', sortable: true, align: 'right' },
    { key: 'actions', label: 'Actions', align: 'right' }
  ];

  tenantForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    businessName: ['', Validators.required],
    ownerName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    planTier: [SubscriptionTier.PROFESSIONAL, Validators.required],
    mrr: [2499, Validators.required]
  });

  filteredTenants = computed(() => {
    let list = this.tenantService.tenants();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();

    if (query) {
      list = list.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.businessName.toLowerCase().includes(query) ||
        t.ownerName.toLowerCase().includes(query) ||
        t.email.toLowerCase().includes(query)
      );
    }

    if (status !== 'ALL') {
      list = list.filter(t => t.status === status);
    }

    return list;
  });

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  onStatusFilterChange(e: Event): void {
    const val = (e.target as HTMLSelectElement).value;
    this.statusFilter.set(val);
  }

  openCreateModal(): void {
    this.tenantForm.reset({
      name: '',
      businessName: '',
      ownerName: '',
      email: '',
      phone: '',
      planTier: SubscriptionTier.PROFESSIONAL,
      mrr: 2499
    });
    this.isModalOpen.set(true);
  }

  saveTenant(): void {
    if (this.tenantForm.invalid) {
      this.tenantForm.markAllAsTouched();
      return;
    }

    const val = this.tenantForm.value;
    this.tenantService.createTenant({
      name: val.name,
      businessName: val.businessName,
      ownerName: val.ownerName,
      email: val.email,
      phone: val.phone,
      status: TenantStatus.ACTIVE,
      subscriptionPlanId: 'plan-pro',
      subscriptionPlanName: 'Professional Agro',
      planTier: val.planTier,
      mrr: Number(val.mrr)
    });

    this.isModalOpen.set(false);
  }

  toggleStatus(tenant: Tenant): void {
    const newStatus = tenant.status === TenantStatus.ACTIVE ? TenantStatus.SUSPENDED : TenantStatus.ACTIVE;
    this.tenantService.updateTenantStatus(tenant.id, newStatus);
  }

  confirmDelete(tenant: Tenant): void {
    this.selectedTenant.set(tenant);
    this.isDeleteDialogOpen.set(true);
  }

  executeDelete(): void {
    const t = this.selectedTenant();
    if (t) {
      this.tenantService.deleteTenant(t.id);
    }
    this.isDeleteDialogOpen.set(false);
  }
}
