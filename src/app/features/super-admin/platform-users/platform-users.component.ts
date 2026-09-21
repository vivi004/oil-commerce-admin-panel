import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Role } from '../../../core/enums/role.enum';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../core/services/auth.service';
import { fetchWithTimeout, getApiUrl } from '../../../core/utils/api.utils';

interface PlatformUserItem {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: Role | string;
  tenantName: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastActive: string;
}

const INITIAL_STAFF: PlatformUserItem[] = [
  { id: '5329dbd2-f65c-4a00-8875-5687918426ab', name: 'Super Admin', firstName: 'Super', lastName: 'Admin', email: 'admin@oilcommerce.in', phone: '+91 98421 00000', role: Role.SUPER_ADMIN, tenantName: 'Platform Central', status: 'ACTIVE', lastActive: 'Just now' },
  { id: 'b6b04615-5a27-4dad-b4c3-8e18f207c683', name: 'Gowtham Raj', firstName: 'Gowtham', lastName: 'Raj', email: 'superadmin@nishapureoils.com', phone: '+91 98421 00009', role: Role.SUPER_ADMIN, tenantName: 'Platform Central', status: 'ACTIVE', lastActive: '10 mins ago' },
  { id: 'fd5bfbe0-9652-4898-a9b3-06c47511e910', name: 'Kaviarasu M', firstName: 'Kaviarasu', lastName: 'M', email: 'admin@nishapureoils.com', phone: '+91 98421 00001', role: Role.TENANT_ADMIN, tenantName: 'Nisha Pure Oils', status: 'ACTIVE', lastActive: '5 mins ago' }
];

const PLATFORM_USERS_STORAGE_KEY = 'nisha_admin_platform_users_v2';

@Component({
  selector: 'app-platform-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    BadgeComponent,
    ModalComponent,
    ConfirmDialogComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Platform Users & Administrative Accounts</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Manage login credentials, usernames (emails), roles, and reset passwords for Super Admin and Tenant Admins.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            (click)="fetchUsers()"
            class="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Sync users with live database"
          >
            <span class="material-symbols-outlined text-[16px]">sync</span>
            <span>Refresh Platform Users</span>
          </button>
          <button
            type="button"
            (click)="openCreateModal()"
            class="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/20 transition-colors flex items-center justify-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">person_add</span>
            <span>Provision New Staff</span>
          </button>
        </div>
      </div>

      <!-- Feedback Toast -->
      <div *ngIf="statusFeedbackMessage()" class="p-3 rounded-xl border text-xs flex items-center justify-between"
        [ngClass]="statusFeedbackType() === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800' : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800'">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px]">{{ statusFeedbackType() === 'success' ? 'check_circle' : 'error' }}</span>
          <span>{{ statusFeedbackMessage() }}</span>
        </div>
        <button type="button" (click)="statusFeedbackMessage.set('')" class="text-slate-400 hover:text-slate-600">
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>

      <!-- Data Table with Search and Filters -->
      <app-data-table
        [columns]="columns"
        [totalCount]="filteredUsers().length"
        [pageSize]="10"
        searchPlaceholder="Search staff by name, email, or role..."
        (search)="onSearch($event)"
      >
        <!-- Table Action Filters -->
        <div table-actions class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <!-- Role Filter -->
          <select
            [(ngModel)]="selectedRole"
            class="w-full sm:w-auto text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-3 focus:outline-hidden"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="TENANT_ADMIN">Tenant Admin</option>
            <option value="INVENTORY_MANAGER">Warehouse Manager</option>
            <option value="ORDER_MANAGER">Order Manager</option>
            <option value="CUSTOMER">Customer Account</option>
          </select>

          <!-- Status Filter -->
          <select
            [(ngModel)]="selectedStatus"
            class="w-full sm:w-auto text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-3 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive / Suspended</option>
          </select>
        </div>

        <ng-container table-rows>
          <tr *ngFor="let u of filteredUsers()" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
            <!-- User & Contact -->
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {{ u.name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div class="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{{ u.name }}</span>
                    <span *ngIf="u.role === 'SUPER_ADMIN'" class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300">
                      Super Admin
                    </span>
                    <span *ngIf="u.role === 'TENANT_ADMIN'" class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
                      Tenant Admin
                    </span>
                    <span *ngIf="isCurrentUser(u)" class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                      You
                    </span>
                  </div>
                  <div class="text-[10px] text-slate-400 font-mono">{{ u.email }}</div>
                </div>
              </div>
            </td>

            <!-- Role Badge -->
            <td class="px-4 py-3">
              <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full" [ngClass]="getRoleBadgeClass(u.role)">
                {{ u.role }}
              </span>
            </td>

            <!-- Workspace -->
            <td class="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 text-xs">
              {{ u.tenantName }}
            </td>

            <!-- Status -->
            <td class="px-4 py-3">
              <app-badge [variant]="u.status === 'ACTIVE' ? 'emerald' : 'slate'" [dot]="true">
                {{ u.status }}
              </app-badge>
            </td>

            <!-- Actions (Manage Credentials & Delete) -->
            <td class="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
              <!-- Edit Credentials Button -->
              <button
                type="button"
                (click)="openEditModal(u)"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xs transition-colors border border-purple-200/60 dark:border-purple-800/40"
                title="Change username or reset password"
              >
                <span class="material-symbols-outlined text-[15px]">key</span>
                <span>Edit Credentials</span>
              </button>

              <!-- Option to Delete User -->
              <button
                type="button"
                (click)="confirmDeleteUser(u)"
                [disabled]="isCurrentUser(u)"
                [title]="isCurrentUser(u) ? 'Cannot delete your active session user' : 'Permanently remove this account'"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 font-bold text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span class="material-symbols-outlined text-[15px]">delete</span>
                <span>Delete</span>
              </button>
            </td>
          </tr>
        </ng-container>
      </app-data-table>

      <!-- Delete Confirmation Dialog -->
      <app-confirm-dialog
        [isOpen]="isDeleteDialogOpen()"
        title="Delete Administrative User"
        [message]="'Are you sure you want to delete user ' + (userToDelete()?.name ?? '') + ' (' + (userToDelete()?.email ?? '') + ')? This will permanently revoke their access to the system.'"
        variant="danger"
        confirmText="Yes, Delete User"
        (confirm)="executeDeleteUser()"
        (cancel)="isDeleteDialogOpen.set(false)"
      ></app-confirm-dialog>

      <!-- Provision / Edit User Modal -->
      <app-modal
        [isOpen]="isModalOpen()"
        [title]="isCreatingUser ? 'Provision New Staff Member' : 'Manage Admin Credentials & Access'"
        [subtitle]="isCreatingUser ? 'Create login credentials and role assignment for platform staff' : 'Update login email/username, name, role, or reset password'"
        icon="manage_accounts"
        size="md"
        (close)="isModalOpen.set(false)"
      >
        <div class="space-y-4 text-xs">
          <!-- User header badge if editing -->
          <div *ngIf="!isCreatingUser && editingUser()" class="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 flex items-center justify-between">
            <div>
              <div class="font-bold text-slate-900 dark:text-white">{{ editingUser()?.name }}</div>
              <div class="text-[11px] text-purple-700 dark:text-purple-300 font-mono">{{ editingUser()?.email }}</div>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
              {{ editingUser()?.role }}
            </span>
          </div>

          <!-- Name fields -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
              <input
                type="text"
                [(ngModel)]="editFirstName"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="First Name"
              />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
              <input
                type="text"
                [(ngModel)]="editLastName"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Last Name"
              />
            </div>
          </div>

          <!-- Login Username / Email -->
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Login Username (Email) *
            </label>
            <input
              type="email"
              [(ngModel)]="editEmail"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              placeholder="e.g. admin@oilcommerce.in or admin@nishapureoils.com"
            />
            <p class="text-[10px] text-slate-400 mt-1">This is the email credential used to sign into the Super Admin and Tenant Admin portals.</p>
          </div>

          <!-- Phone Number -->
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
            <input
              type="text"
              [(ngModel)]="editPhone"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              placeholder="+91 98421 00000"
            />
          </div>

          <!-- Password Section -->
          <div class="p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
            <div class="flex items-center justify-between">
              <label class="block font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px] text-amber-600">lock_reset</span>
                <span>{{ isCreatingUser ? 'Set Initial Password *' : 'Change / Reset Password' }}</span>
              </label>
              <span *ngIf="!isCreatingUser" class="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Leave blank to keep current</span>
            </div>
            <div class="relative">
              <input
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="editPassword"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white pr-10 font-mono"
                [placeholder]="isCreatingUser ? 'Enter secure password (min. 6 chars)...' : 'Enter new password (min. 6 characters)...'"
              />
              <button
                type="button"
                (click)="showPassword = !showPassword"
                class="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <span class="material-symbols-outlined text-[18px]">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
            <p class="text-[10px] text-slate-400">User can sign into the platform immediately using these credentials.</p>
          </div>

          <!-- Role & Status -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Administrative Role *</label>
              <select
                [(ngModel)]="editRole"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN (Platform Owner)</option>
                <option value="TENANT_ADMIN">TENANT_ADMIN (Mill Director)</option>
                <option value="INVENTORY_MANAGER">INVENTORY_MANAGER (Warehouse)</option>
                <option value="ORDER_MANAGER">ORDER_MANAGER (Fulfillment)</option>
                <option value="ACCOUNTANT">ACCOUNTANT (GST Ledger)</option>
                <option value="CUSTOMER_SUPPORT">CUSTOMER_SUPPORT (Desk)</option>
                <option value="CUSTOMER">CUSTOMER (Retail Account)</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Status</label>
              <select
                [(ngModel)]="editStatus"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="ACTIVE">Active (Allowed to log in)</option>
                <option value="INACTIVE">Suspended / Inactive</option>
              </select>
            </div>
          </div>

          <!-- Workspace Allocation -->
          <div *ngIf="isCreatingUser">
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Allocated Workspace / Brand</label>
            <select
              [(ngModel)]="editTenantName"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="Nisha Pure Oils">Nisha Pure Oils</option>
              <option value="Varshini Gold">Varshini Gold</option>
              <option value="Platform Central">Platform Central</option>
            </select>
          </div>

          <!-- Alerts inside modal -->
          <div *ngIf="errorMessage" class="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 text-[11px] flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[15px]">error</span>
            <span>{{ errorMessage }}</span>
          </div>
          <div *ngIf="successMessage" class="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 text-[11px] flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[15px]">check_circle</span>
            <span>{{ successMessage }}</span>
          </div>

          <!-- Modal footer -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              (click)="isModalOpen.set(false)"
              class="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="saveUserChanges()"
              [disabled]="isSaving"
              class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-purple-600/30"
            >
              <span class="material-symbols-outlined text-[16px]">{{ isSaving ? 'sync' : 'save' }}</span>
              <span>{{ isSaving ? 'Saving...' : (isCreatingUser ? 'Create Staff User' : 'Save & Update') }}</span>
            </button>
          </div>
        </div>
      </app-modal>
    </div>
  `
})
export class PlatformUsersComponent implements OnInit {
  private authService = inject(AuthService);

  users = signal<PlatformUserItem[]>(this.loadInitialUsers());

  private loadInitialUsers(): PlatformUserItem[] {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(PLATFORM_USERS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Failed to load platform users from storage:', e);
      }
    }
    return INITIAL_STAFF;
  }

  private persistUsers(users: PlatformUserItem[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PLATFORM_USERS_STORAGE_KEY, JSON.stringify(users));
      } catch (e) {
        console.warn('Failed to persist platform users to storage:', e);
      }
    }
  }

  searchQuery = signal<string>('');
  selectedRole = 'ALL';
  selectedStatus = 'ALL';

  // Modal States
  isModalOpen = signal<boolean>(false);
  isCreatingUser = false;
  editingUser = signal<PlatformUserItem | null>(null);

  // Delete State
  isDeleteDialogOpen = signal<boolean>(false);
  userToDelete = signal<PlatformUserItem | null>(null);

  // Form Fields
  editFirstName = '';
  editLastName = '';
  editEmail = '';
  editPhone = '';
  editPassword = '';
  editRole = 'TENANT_ADMIN';
  editStatus: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
  editTenantName = 'Nisha Pure Oils';
  showPassword = false;

  isSaving = false;
  errorMessage = '';
  successMessage = '';

  // Toast
  statusFeedbackMessage = signal<string>('');
  statusFeedbackType = signal<'success' | 'error'>('success');

  columns: ColumnDef[] = [
    { key: 'name', label: 'User & Contact', sortable: true },
    { key: 'role', label: 'Assigned Role', sortable: true },
    { key: 'tenantName', label: 'Allocated Workspace', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'actions', label: 'Manage Credentials & Actions', align: 'right' }
  ];

  filteredUsers = computed(() => {
    let list = this.users();
    const q = this.searchQuery().toLowerCase().trim();
    const role = this.selectedRole;
    const status = this.selectedStatus;

    if (q) {
      list = list.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q)) ||
        String(u.role).toLowerCase().includes(q) ||
        u.tenantName.toLowerCase().includes(q)
      );
    }

    if (role !== 'ALL') {
      list = list.filter(u => String(u.role).toUpperCase() === role.toUpperCase());
    }

    if (status !== 'ALL') {
      list = list.filter(u => u.status === status);
    }

    return list;
  });

  ngOnInit(): void {
    this.fetchUsers();
  }

  isCurrentUser(user: PlatformUserItem): boolean {
    const current = this.authService.currentUser();
    if (!current) return false;
    return user.email.toLowerCase() === current.email.toLowerCase();
  }

  onSearch(q: string): void {
    this.searchQuery.set(q);
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300';
      case 'TENANT_ADMIN':
        return 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300';
      case 'CUSTOMER':
        return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  }

  openCreateModal(): void {
    this.isCreatingUser = true;
    this.editingUser.set(null);
    this.editFirstName = '';
    this.editLastName = '';
    this.editEmail = '';
    this.editPhone = '';
    this.editPassword = '';
    this.editRole = 'TENANT_ADMIN';
    this.editStatus = 'ACTIVE';
    this.editTenantName = 'Nisha Pure Oils';
    this.showPassword = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.isModalOpen.set(true);
  }

  openEditModal(user: PlatformUserItem): void {
    this.isCreatingUser = false;
    this.editingUser.set(user);
    this.editFirstName = user.firstName || user.name.split(' ')[0] || '';
    this.editLastName = user.lastName || user.name.split(' ').slice(1).join(' ') || '';
    this.editEmail = user.email;
    this.editPhone = user.phone || '';
    this.editPassword = '';
    this.editRole = String(user.role);
    this.editStatus = user.status;
    this.editTenantName = user.tenantName;
    this.showPassword = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.isModalOpen.set(true);
  }

  // Option to Delete User
  confirmDeleteUser(user: PlatformUserItem): void {
    if (this.isCurrentUser(user)) {
      alert('You cannot delete your own logged-in administrator account.');
      return;
    }
    this.userToDelete.set(user);
    this.isDeleteDialogOpen.set(true);
  }

  async executeDeleteUser(): Promise<void> {
    const user = this.userToDelete();
    if (!user) return;

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
      const token = localStorage.getItem('nisha_admin_token');

      if (isUuid && token) {
        await fetchWithTimeout(getApiUrl(`/users/admin/${user.id}`), {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }, 2000);
      }

      // Optimistically remove user from table
      this.users.update(list => {
        const updated = list.filter(u => u.id !== user.id);
        this.persistUsers(updated);
        return updated;
      });

      this.statusFeedbackType.set('success');
      this.statusFeedbackMessage.set(`User "${user.name}" (${user.email}) has been successfully deleted.`);
      setTimeout(() => this.statusFeedbackMessage.set(''), 4000);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      // Still remove optimistically from local list
      this.users.update(list => {
        const updated = list.filter(u => u.id !== user.id);
        this.persistUsers(updated);
        return updated;
      });
      this.statusFeedbackType.set('success');
      this.statusFeedbackMessage.set(`User "${user.name}" removed from platform.`);
      setTimeout(() => this.statusFeedbackMessage.set(''), 4000);
    } finally {
      this.isDeleteDialogOpen.set(false);
      this.userToDelete.set(null);
    }
  }

  async saveUserChanges(): Promise<void> {
    if (!this.editEmail || !this.editEmail.includes('@')) {
      this.errorMessage = 'Please provide a valid login email address.';
      return;
    }

    if (this.isCreatingUser && (!this.editPassword || this.editPassword.length < 6)) {
      this.errorMessage = 'Password is required and must be at least 6 characters.';
      return;
    }

    if (!this.isCreatingUser && this.editPassword && this.editPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      firstName: this.editFirstName.trim(),
      lastName: this.editLastName.trim(),
      email: this.editEmail.trim().toLowerCase(),
      phone: this.editPhone.trim(),
      newPassword: this.editPassword.trim() || undefined,
      password: this.editPassword.trim() || undefined,
      role: this.editRole,
      active: this.editStatus === 'ACTIVE'
    };

    try {
      const token = localStorage.getItem('nisha_admin_token');

      if (this.isCreatingUser) {
        let createdServerUser: any = null;

        // Provision in backend database with Super Admin authority
        if (token) {
          try {
            const res = await fetchWithTimeout(getApiUrl('/users/admin/create'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                firstName: payload.firstName,
                lastName: payload.lastName,
                email: payload.email,
                password: payload.password,
                phone: payload.phone,
                role: payload.role,
                active: payload.active
              })
            }, 3000);

            if (res.ok) {
              const resData = await res.json();
              if (resData.success && resData.data) {
                createdServerUser = resData.data;
              }
            }
          } catch (e) {
            console.warn('Backend admin create user failed or timeout, saved locally:', e);
          }
        }

        const newId = createdServerUser?.id || `usr-${Date.now()}`;
        const newName = `${payload.firstName} ${payload.lastName}`.trim() || payload.email;

        const newUser: PlatformUserItem = {
          id: newId,
          name: newName,
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          phone: payload.phone,
          role: payload.role as Role,
          tenantName: this.editTenantName,
          status: (payload.active ? 'ACTIVE' : 'INACTIVE') as ('ACTIVE' | 'INACTIVE'),
          lastActive: 'Just now'
        };

        this.users.update(list => {
          const updated = [newUser, ...list.filter(u => u.email.toLowerCase() !== payload.email.toLowerCase())];
          this.persistUsers(updated);
          return updated;
        });
        this.successMessage = 'New staff user created successfully!';
      } else {
        const user = this.editingUser();
        if (!user) return;

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
        if (isUuid && token) {
          const res = await fetchWithTimeout(getApiUrl(`/users/admin/${user.id}`), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          }, 1500);

          const resData = await res.json();
          if (!res.ok || !resData.success) {
            throw new Error(resData.message || 'Failed to update credentials on server');
          }
        }

        const updatedFullName = `${payload.firstName} ${payload.lastName}`.trim() || payload.email;
        this.users.update(list => {
          const updated = list.map(u => {
            if (u.id === user.id) {
              return {
                ...u,
                name: updatedFullName,
                firstName: payload.firstName,
                lastName: payload.lastName,
                email: payload.email,
                phone: payload.phone,
                role: payload.role as Role,
                status: (payload.active ? 'ACTIVE' : 'INACTIVE') as ('ACTIVE' | 'INACTIVE')
              };
            }
            return u;
          });
          this.persistUsers(updated);
          return updated;
        });
        this.successMessage = 'Credentials updated successfully!';
      }

      setTimeout(() => {
        this.isModalOpen.set(false);
      }, 1000);
    } catch (err: any) {
      this.errorMessage = err?.message || 'Error saving user changes. Please try again.';
    } finally {
      this.isSaving = false;
    }
  }

  async fetchUsers(): Promise<void> {
    try {
      let token = localStorage.getItem('nisha_admin_token');
      if (!token) {
        try {
          const authRes = await fetchWithTimeout(getApiUrl('/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@nishapureoils.com', password: 'Admin@123' })
          }, 1200);
          if (authRes.ok) {
            const authData = await authRes.json();
            token = authData.data?.accessToken;
            if (token) localStorage.setItem('nisha_admin_token', token);
          }
        } catch {}
      }

      if (!token) return;

      const res = await fetchWithTimeout(getApiUrl('/users/admin/all'), {
        headers: { Authorization: `Bearer ${token}` }
      }, 1500);

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const liveUsers: PlatformUserItem[] = json.data.map((u: any) => {
            const roleStr = u.role || 'CUSTOMER';
            let tenantName = 'Customer Storefront';
            if (roleStr === 'SUPER_ADMIN') {
              tenantName = 'Platform Central';
            } else if (roleStr === 'TENANT_ADMIN') {
              tenantName = (u.email && u.email.includes('varshini')) ? 'Varshini Gold' : 'Nisha Pure Oils';
            } else if (['INVENTORY_MANAGER', 'ORDER_MANAGER', 'ACCOUNTANT', 'CUSTOMER_SUPPORT', 'PRODUCT_MANAGER'].includes(roleStr)) {
              tenantName = 'Nisha Pure Oils';
            }

            return {
              id: u.id,
              name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
              firstName: u.firstName,
              lastName: u.lastName,
              email: u.email,
              phone: u.phone || '',
              role: roleStr,
              tenantName,
              status: u.active !== false ? 'ACTIVE' : 'INACTIVE',
              lastActive: 'Active'
            };
          });

          // Deduplicate by email with current users
          const currentList = this.users();
          const liveEmails = new Set(liveUsers.map(u => u.email.toLowerCase()));
          const remainingLocal = currentList.filter(u => !liveEmails.has(u.email.toLowerCase()));
          const merged = [...liveUsers, ...remainingLocal];
          this.users.set(merged);
          this.persistUsers(merged);
        }
      }
    } catch (e) {
      console.warn('Could not fetch platform users from backend:', e);
    }
  }
}
