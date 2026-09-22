import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Customer, Order } from '../../../core/models/app.models';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CustomerService } from '../../../core/services/customer.service';
import { ExportService } from '../../../core/services/export.service';
import { OrderService } from '../../../core/services/order.service';
import { LiveSyncService } from '../../../core/services/live-sync.service';

type CustomerFilterType = 'ALL' | 'LIVE' | 'B2B' | 'REPEAT';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    StatCardComponent,
    ModalComponent,
    ConfirmDialogComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Top Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Customers & Wholesale Accounts</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Retail households and B2B restaurants buying cold-pressed wood-churned oils.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <!-- Refresh / Sync Button -->
          <button
            type="button"
            (click)="refresh()"
            [disabled]="isSyncing()"
            class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <span class="material-symbols-outlined text-[16px]" [ngClass]="{'animate-spin': isSyncing()}">sync</span>
            <span>{{ isSyncing() ? 'Syncing...' : 'Sync Live' }}</span>
          </button>

          <!-- Export CSV -->
          <button
            type="button"
            (click)="exportCustomers()"
            class="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <span class="material-symbols-outlined text-[16px]">download</span>
            <span>Export CSV</span>
          </button>

          <!-- Add Customer -->
          <button
            type="button"
            (click)="openAddModal()"
            class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            <span class="material-symbols-outlined text-[16px]">person_add</span>
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <app-stat-card
          title="Total Customers"
          [value]="customerService.totalCustomers()"
          unit="accounts"
          icon="group"
          iconBgClass="bg-blue-50 dark:bg-blue-950/40"
          iconTextClass="text-blue-600 dark:text-blue-400"
          subtitle="Direct retail & wholesale"
        ></app-stat-card>

        <app-stat-card
          title="B2B & Wholesale"
          [value]="customerService.b2bCount()"
          unit="clients"
          icon="storefront"
          iconBgClass="bg-amber-50 dark:bg-amber-950/40"
          iconTextClass="text-amber-600 dark:text-amber-400"
          subtitle="Bulk commercial orders"
        ></app-stat-card>

        <app-stat-card
          title="Total Lifetime Value"
          [value]="'₹' + customerService.totalLifetimeRevenue().toLocaleString('en-IN')"
          icon="payments"
          iconBgClass="bg-emerald-50 dark:bg-emerald-950/40"
          iconTextClass="text-emerald-600 dark:text-emerald-400"
          subtitle="Gross customer sales"
        ></app-stat-card>

        <app-stat-card
          title="Average Order Value"
          [value]="'₹' + customerService.avgOrderValue().toLocaleString('en-IN')"
          icon="trending_up"
          iconBgClass="bg-purple-50 dark:bg-purple-950/40"
          iconTextClass="text-purple-600 dark:text-purple-400"
          subtitle="Spend per purchase"
        ></app-stat-card>
      </div>

      <!-- Filter Pills -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          (click)="filterType.set('ALL')"
          [ngClass]="filterType() === 'ALL' ? 'bg-amber-500 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
          class="px-3 py-1.5 rounded-lg text-xs transition-colors"
        >
          All Customers ({{ customerService.totalCustomers() }})
        </button>
        <button
          type="button"
          (click)="filterType.set('LIVE')"
          [ngClass]="filterType() === 'LIVE' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
          class="px-3 py-1.5 rounded-lg text-xs transition-colors"
        >
          Live Online Accounts ({{ liveCount() }})
        </button>
        <button
          type="button"
          (click)="filterType.set('B2B')"
          [ngClass]="filterType() === 'B2B' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
          class="px-3 py-1.5 rounded-lg text-xs transition-colors"
        >
          Wholesale / B2B ({{ customerService.b2bCount() }})
        </button>
        <button
          type="button"
          (click)="filterType.set('REPEAT')"
          [ngClass]="filterType() === 'REPEAT' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
          class="px-3 py-1.5 rounded-lg text-xs transition-colors"
        >
          Repeat Buyers ({{ repeatCount() }})
        </button>
      </div>

      <!-- Main Customers Table -->
      <app-data-table
        [columns]="columns"
        [totalCount]="filteredCustomers().length"
        [pageSize]="10"
        searchPlaceholder="Search by name, email, phone, city..."
        (search)="onSearch($event)"
      >
        <ng-container table-rows>
          <tr *ngFor="let c of filteredCustomers()" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
            <!-- Customer Name & Contact -->
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div 
                  class="w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0"
                  [ngClass]="isB2B(c) ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'"
                >
                  {{ c.fullName.charAt(0).toUpperCase() }}
                </div>
                <div class="min-w-0">
                  <div class="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                    <span class="truncate">{{ c.fullName }}</span>
                    <span *ngIf="c.supportNotes === 'LIVE_REGISTERED'" class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                      Live
                    </span>
                    <span *ngIf="isB2B(c)" class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
                      B2B / Wholesale
                    </span>
                    <span *ngIf="c.totalOrders >= 5" class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                      VIP
                    </span>
                  </div>
                  <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                    <a [href]="'mailto:' + c.email" class="hover:text-amber-600 hover:underline flex items-center gap-0.5">
                      <span class="material-symbols-outlined text-[13px]">mail</span>
                      <span>{{ c.email }}</span>
                    </a>
                    <span>•</span>
                    <a [href]="'tel:' + c.phone" class="hover:text-amber-600 hover:underline flex items-center gap-0.5">
                      <span class="material-symbols-outlined text-[13px]">phone</span>
                      <span>{{ c.phone }}</span>
                    </a>
                  </div>
                </div>
              </div>
            </td>

            <!-- Location -->
            <td class="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
              <div class="font-medium">{{ c.city }}, {{ c.state }}</div>
              <div class="text-[10px] text-slate-400">PIN: {{ c.pincode }}</div>
            </td>

            <!-- Total Orders -->
            <td class="px-4 py-3 text-xs">
              <div class="font-bold text-slate-800 dark:text-slate-200">
                {{ c.totalOrders }} {{ c.totalOrders === 1 ? 'order' : 'orders' }}
              </div>
              <div *ngIf="c.totalOrders >= 3" class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Repeat Buyer
              </div>
            </td>

            <!-- Lifetime Spend -->
            <td class="px-4 py-3 text-right font-black text-slate-900 dark:text-white text-xs">
              ₹{{ (c.lifetimeSpend || 0).toLocaleString('en-IN') }}
            </td>

            <!-- Last Order Date -->
            <td class="px-4 py-3 text-right text-[11px] text-slate-400">
              {{ c.lastOrderDate || 'Recent' }}
            </td>

            <!-- Actions -->
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-1">
                <button
                  type="button"
                  (click)="viewCustomerDetails(c)"
                  class="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="View Profile & Orders"
                >
                  <span class="material-symbols-outlined text-[18px]">visibility</span>
                </button>
                <button
                  type="button"
                  (click)="openEditModal(c)"
                  class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Edit Customer Details"
                >
                  <span class="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button
                  type="button"
                  (click)="openDeleteModal(c)"
                  class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Delete Customer"
                >
                  <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </td>
          </tr>
        </ng-container>
      </app-data-table>

      <!-- Customer Detail & Order History Modal -->
      <app-modal
        [isOpen]="isDetailModalOpen()"
        title="Customer Profile & Order History"
        [subtitle]="selectedCustomer()?.fullName || ''"
        icon="account_circle"
        size="lg"
        [showFooter]="true"
        (close)="isDetailModalOpen.set(false)"
      >
        <div *ngIf="selectedCustomer()" class="space-y-5">
          <!-- Profile Card -->
          <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-amber-500 text-white font-black text-base flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
                {{ selectedCustomer()!.fullName.charAt(0).toUpperCase() }}
              </div>
              <div>
                <h3 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  {{ selectedCustomer()!.fullName }}
                  <span *ngIf="isB2B(selectedCustomer()!)" class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
                    B2B Wholesale
                  </span>
                </h3>
                <div class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-1 flex-wrap">
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">mail</span>
                    {{ selectedCustomer()!.email }}
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">call</span>
                    {{ selectedCustomer()!.phone }}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-700">
              <span class="text-xs text-slate-400">Lifetime Spend</span>
              <span class="text-base font-black text-amber-600 dark:text-amber-400">
                ₹{{ (selectedCustomer()!.lifetimeSpend || 0).toLocaleString('en-IN') }}
              </span>
            </div>
          </div>

          <!-- Address & Notes -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div class="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400">
                <span class="material-symbols-outlined text-[15px]">location_on</span>
                Shipping Address
              </div>
              <div class="text-slate-700 dark:text-slate-300 leading-relaxed">
                {{ selectedCustomer()!.address || 'No street address on file' }}
              </div>
              <div class="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {{ selectedCustomer()!.city }}, {{ selectedCustomer()!.state }} - {{ selectedCustomer()!.pincode }}
              </div>
            </div>

            <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div class="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400">
                <span class="material-symbols-outlined text-[15px]">sticky_note_2</span>
                Order Preferences & Notes
              </div>
              <div class="text-slate-700 dark:text-slate-300 italic">
                {{ selectedCustomer()!.supportNotes || 'No special notes recorded.' }}
              </div>
              <div class="text-[10px] text-slate-400 mt-2">
                Customer since: {{ selectedCustomer()!.createdAt }}
              </div>
            </div>
          </div>

          <!-- Customer Orders History -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Order History ({{ customerOrders().length }})
              </h4>
            </div>

            <div *ngIf="customerOrders().length === 0" class="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
              No orders found for this customer record yet.
            </div>

            <div *ngIf="customerOrders().length > 0" class="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              <div
                *ngFor="let ord of customerOrders()"
                class="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 flex items-center justify-between text-xs gap-3"
              >
                <div>
                  <div class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>#{{ ord.orderNumber }}</span>
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                      {{ ord.status }}
                    </span>
                  </div>
                  <div class="text-[11px] text-slate-400 mt-0.5">
                    {{ ord.createdAt?.split('T')[0] || ord.createdAt }} • {{ ord.paymentMethod || 'Online Payment' }}
                  </div>
                  <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {{ ord.items.length }} items: 
                    <span *ngFor="let item of ord.items; let last = last">
                      {{ item.quantity }}x {{ item.productName }} ({{ item.variantSize }}){{ !last ? ', ' : '' }}
                    </span>
                  </div>
                </div>

                <div class="text-right shrink-0">
                  <div class="font-black text-slate-900 dark:text-white text-xs">
                    ₹{{ ord.grandTotal.toLocaleString('en-IN') }}
                  </div>
                  <span class="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {{ ord.paymentStatus }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div modal-footer class="flex items-center justify-end gap-2">
          <button
            type="button"
            (click)="isDetailModalOpen.set(false)"
            class="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </app-modal>

      <!-- Add / Edit Customer Modal -->
      <app-modal
        [isOpen]="isAddEditModalOpen()"
        [title]="isEditing() ? 'Edit Customer Details' : 'Add New Customer Account'"
        [subtitle]="isEditing() ? 'Update contact info and delivery coordinates' : 'Create direct retail or B2B restaurant account'"
        icon="person_add"
        size="md"
        [showFooter]="true"
        (close)="isAddEditModalOpen.set(false)"
      >
        <form (ngSubmit)="saveCustomer()" class="space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              [(ngModel)]="formData.fullName"
              name="fullName"
              required
              placeholder="e.g. Karthikeyan Subramanian"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
              <input
                type="email"
                [(ngModel)]="formData.email"
                name="email"
                required
                placeholder="customer@email.com"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
              <input
                type="text"
                [(ngModel)]="formData.phone"
                name="phone"
                required
                placeholder="+91 98421 00000"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Account Category</label>
            <select
              [(ngModel)]="formData.accountType"
              name="accountType"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            >
              <option value="RETAIL">Retail Household (Standard Consumer)</option>
              <option value="B2B">B2B Wholesale / Restaurant Buyer</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Street Address</label>
            <input
              type="text"
              [(ngModel)]="formData.address"
              name="address"
              placeholder="Door No, Street Name, Landmark"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">City</label>
              <input
                type="text"
                [(ngModel)]="formData.city"
                name="city"
                placeholder="Coimbatore"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">State</label>
              <input
                type="text"
                [(ngModel)]="formData.state"
                name="state"
                placeholder="Tamil Nadu"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">PIN Code</label>
              <input
                type="text"
                [(ngModel)]="formData.pincode"
                name="pincode"
                placeholder="641012"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Preferences & Support Notes</label>
            <textarea
              [(ngModel)]="formData.supportNotes"
              name="supportNotes"
              rows="2"
              placeholder="e.g. Prefers 5L tin packaging, regular Groundnut oil buyer..."
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            ></textarea>
          </div>
        </form>

        <div modal-footer class="flex items-center justify-end gap-2">
          <button
            type="button"
            (click)="isAddEditModalOpen.set(false)"
            class="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="saveCustomer()"
            class="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/20 transition-all"
          >
            {{ isEditing() ? 'Save Changes' : 'Create Customer' }}
          </button>
        </div>
      </app-modal>

      <!-- Delete Confirmation Dialog -->
      <app-confirm-dialog
        [isOpen]="isDeleteModalOpen()"
        title="Delete Customer Account"
        [message]="'Are you sure you want to remove ' + (customerToDelete()?.fullName || 'this customer') + '? This will remove them from the active list.'"
        variant="danger"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        (confirm)="confirmDelete()"
        (cancel)="isDeleteModalOpen.set(false)"
      ></app-confirm-dialog>
    </div>
  `
})
export class CustomerListComponent implements OnInit {
  customerService = inject(CustomerService);
  private exportService = inject(ExportService);
  private orderService = inject(OrderService);
  readonly liveSyncService = inject(LiveSyncService);

  searchQuery = signal<string>('');
  filterType = signal<CustomerFilterType>('ALL');
  isSyncing = this.liveSyncService.isSyncing;

  // Modals state
  isDetailModalOpen = signal<boolean>(false);
  isAddEditModalOpen = signal<boolean>(false);
  isDeleteModalOpen = signal<boolean>(false);
  isEditing = signal<boolean>(false);

  selectedCustomer = signal<Customer | null>(null);
  customerToDelete = signal<Customer | null>(null);
  customerOrders = signal<Order[]>([]);

  // Form State
  formData = {
    id: '',
    fullName: '',
    email: '',
    phone: '',
    accountType: 'RETAIL',
    address: '',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641012',
    supportNotes: ''
  };

  columns: ColumnDef[] = [
    { key: 'fullName', label: 'Customer Name & Contact', sortable: true },
    { key: 'city', label: 'Location', sortable: true },
    { key: 'totalOrders', label: 'Total Orders', sortable: true },
    { key: 'lifetimeSpend', label: 'Lifetime Spend', sortable: true, align: 'right' },
    { key: 'lastOrderDate', label: 'Last Order', align: 'right' },
    { key: 'actions', label: 'Actions', align: 'right' }
  ];

  liveCount = computed(() => 
    this.customerService.customers().filter(c => c.supportNotes === 'LIVE_REGISTERED').length
  );

  repeatCount = computed(() => 
    this.customerService.customers().filter(c => (c.totalOrders || 0) >= 3).length
  );

  filteredCustomers = computed(() => {
    let list = this.customerService.customers();
    const filter = this.filterType();

    if (filter === 'LIVE') {
      list = list.filter(c => c.supportNotes === 'LIVE_REGISTERED');
    } else if (filter === 'B2B') {
      list = list.filter(c => this.isB2B(c));
    } else if (filter === 'REPEAT') {
      list = list.filter(c => (c.totalOrders || 0) >= 3);
    }

    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return list;

    return list.filter(c =>
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q) ||
      c.pincode.includes(q)
    );
  });

  ngOnInit(): void {
    this.refresh();
  }

  async refresh(): Promise<void> {
    await this.liveSyncService.syncCustomers();
  }

  isB2B(c: Customer): boolean {
    return (
      c.supportNotes?.toLowerCase().includes('wholesale') ||
      c.supportNotes?.toLowerCase().includes('b2b') ||
      (c.totalOrders || 0) > 8 ||
      (c.lifetimeSpend || 0) > 30000
    );
  }

  onSearch(q: string): void {
    this.searchQuery.set(q);
  }

  viewCustomerDetails(customer: Customer): void {
    this.selectedCustomer.set(customer);
    const orders = this.customerService.getCustomerOrders(customer.email, customer.phone);
    this.customerOrders.set(orders);
    this.isDetailModalOpen.set(true);
  }

  openAddModal(): void {
    this.isEditing.set(false);
    this.formData = {
      id: '',
      fullName: '',
      email: '',
      phone: '+91 ',
      accountType: 'RETAIL',
      address: '',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641012',
      supportNotes: ''
    };
    this.isAddEditModalOpen.set(true);
  }

  openEditModal(customer: Customer): void {
    this.isEditing.set(true);
    this.formData = {
      id: customer.id,
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      accountType: this.isB2B(customer) ? 'B2B' : 'RETAIL',
      address: customer.address || '',
      city: customer.city || 'Coimbatore',
      state: customer.state || 'Tamil Nadu',
      pincode: customer.pincode || '641012',
      supportNotes: customer.supportNotes || ''
    };
    this.isAddEditModalOpen.set(true);
  }

  saveCustomer(): void {
    if (!this.formData.fullName || !this.formData.email) {
      alert('Please provide customer name and email.');
      return;
    }

    const note = this.formData.accountType === 'B2B' && !this.formData.supportNotes.toLowerCase().includes('wholesale')
      ? `${this.formData.supportNotes} (Wholesale B2B Account)`.trim()
      : this.formData.supportNotes;

    if (this.isEditing()) {
      this.customerService.updateCustomer(this.formData.id, {
        fullName: this.formData.fullName,
        email: this.formData.email,
        phone: this.formData.phone,
        address: this.formData.address,
        city: this.formData.city,
        state: this.formData.state,
        pincode: this.formData.pincode,
        supportNotes: note
      });
    } else {
      this.customerService.addCustomer({
        fullName: this.formData.fullName,
        email: this.formData.email,
        phone: this.formData.phone,
        address: this.formData.address,
        city: this.formData.city,
        state: this.formData.state,
        pincode: this.formData.pincode,
        totalOrders: 0,
        lifetimeSpend: 0,
        lastOrderDate: 'New Customer',
        supportNotes: note
      });
    }

    this.isAddEditModalOpen.set(false);
  }

  openDeleteModal(customer: Customer): void {
    this.customerToDelete.set(customer);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete(): void {
    const c = this.customerToDelete();
    if (c) {
      this.customerService.deleteCustomer(c.id);
      this.customerToDelete.set(null);
    }
    this.isDeleteModalOpen.set(false);
  }

  exportCustomers(): void {
    const data = this.filteredCustomers().map(c => ({
      'Customer ID': c.id,
      'Full Name': c.fullName,
      'Email': c.email,
      'Phone': c.phone,
      'City': c.city,
      'State': c.state,
      'PIN Code': c.pincode,
      'Total Orders': c.totalOrders,
      'Lifetime Spend (INR)': c.lifetimeSpend,
      'Last Order Date': c.lastOrderDate,
      'Notes / Classification': c.supportNotes || ''
    }));
    this.exportService.exportToCsv('oil-commerce-customers', data);
  }
}
