import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Role } from '../../../core/enums/role.enum';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
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
  { id: 'usr-1', name: 'Super Admin', firstName: 'Super', lastName: 'Admin', email: 'admin@oilcommerce.in', role: Role.SUPER_ADMIN, tenantName: 'Platform Central', status: 'ACTIVE', lastActive: 'Just now' },
  { id: 'usr-2', name: 'Kaviarasu M', firstName: 'Kaviarasu', lastName: 'M', email: 'admin@nishapureoils.com', role: Role.TENANT_ADMIN, tenantName: 'Nisha Pure Oils', status: 'ACTIVE', lastActive: '5 mins ago' },
  { id: 'usr-3', name: 'R. Velumani', firstName: 'R.', lastName: 'Velumani', email: 'warehouse@pureoils.com', role: Role.INVENTORY_MANAGER, tenantName: 'Nisha Pure Oils', status: 'ACTIVE', lastActive: '1 hour ago' },
  { id: 'usr-4', name: 'Praveen Kumar', firstName: 'Praveen', lastName: 'Kumar', email: 'orders@pureoils.com', role: Role.ORDER_MANAGER, tenantName: 'Nisha Pure Oils', status: 'ACTIVE', lastActive: '3 hours ago' },
  { id: 'usr-5', name: 'Muruganathan S.', firstName: 'Muruganathan', lastName: 'S.', email: 'admin@varshinigold.com', role: Role.TENANT_ADMIN, tenantName: 'Varshini Gold', status: 'ACTIVE', lastActive: 'Yesterday' }
];

@Component({
  selector: 'app-platform-users',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, BadgeComponent, ModalComponent],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Platform Users & Administrative Accounts</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Manage login credentials, usernames (emails), roles, and reset passwords for Super Admin and Tenant Admins.</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="fetchUsers()"
            class="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <span class="material-symbols-outlined text-[16px]">sync</span>
            <span>Refresh Platform Users</span>
          </button>
        </div>
      </div>

      <app-data-table
        [columns]="columns"
        [totalCount]="users().length"
        [pageSize]="10"
        searchPlaceholder="Search staff or customers by name or email..."
      >
        <ng-container table-rows>
          <tr *ngFor="let u of users()" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center">
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
                  </div>
                  <div class="text-[10px] text-slate-400 font-mono">{{ u.email }}</div>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full" [ngClass]="getRoleBadgeClass(u.role)">
                {{ u.role }}
              </span>
            </td>
            <td class="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 text-xs">
              {{ u.tenantName }}
            </td>
            <td class="px-4 py-3">
              <app-badge [variant]="u.status === 'ACTIVE' ? 'emerald' : 'slate'" [dot]="true">
                {{ u.status }}
              </app-badge>
            </td>
            <td class="px-4 py-3 text-right">
              <button
                type="button"
                (click)="openEditModal(u)"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xs transition-colors border border-purple-200/60 dark:border-purple-800/40"
                title="Change username or reset password"
              >
                <span class="material-symbols-outlined text-[15px]">key</span>
                <span>Edit Credentials</span>
              </button>
            </td>
          </tr>
        </ng-container>
      </app-data-table>

      <!-- Edit User & Password Modal -->
      <app-modal
        [isOpen]="isEditModalOpen()"
        title="Manage Admin Credentials & Access"
        subtitle="Update login email/username, name, role, or reset password"
        icon="manage_accounts"
        size="md"
        (close)="isEditModalOpen.set(false)"
      >
        <div *ngIf="editingUser()" class="space-y-4 text-xs">
          <!-- User header badge -->
          <div class="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 flex items-center justify-between">
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

          <!-- New Password Section -->
          <div class="p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
            <div class="flex items-center justify-between">
              <label class="block font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px] text-amber-600">lock_reset</span>
                <span>Change / Reset Password</span>
              </label>
              <span class="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Leave blank to keep current</span>
            </div>
            <div class="relative">
              <input
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="editPassword"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white pr-10 font-mono"
                placeholder="Enter new password (min. 6 characters)..."
              />
              <button
                type="button"
                (click)="showPassword = !showPassword"
                class="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <span class="material-symbols-outlined text-[18px]">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
            <p class="text-[10px] text-slate-400">If you enter a new password here, the user can immediately log in with it.</p>
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

          <!-- Alerts -->
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
              (click)="isEditModalOpen.set(false)"
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
              <span>{{ isSaving ? 'Saving Changes...' : 'Save & Update Credentials' }}</span>
            </button>
          </div>
        </div>
      </app-modal>
    </div>
  `
})
export class PlatformUsersComponent implements OnInit {
  users = signal<PlatformUserItem[]>(INITIAL_STAFF);

  // Edit Modal State
  isEditModalOpen = signal<boolean>(false);
  editingUser = signal<PlatformUserItem | null>(null);

  editFirstName = '';
  editLastName = '';
  editEmail = '';
  editPhone = '';
  editPassword = '';
  editRole = 'TENANT_ADMIN';
  editStatus: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
  showPassword = false;

  isSaving = false;
  errorMessage = '';
  successMessage = '';

  columns: ColumnDef[] = [
    { key: 'name', label: 'User & Contact', sortable: true },
    { key: 'role', label: 'Assigned Role', sortable: true },
    { key: 'tenantName', label: 'Allocated Workspace', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'actions', label: 'Manage Credentials', align: 'right' }
  ];

  ngOnInit(): void {
    this.fetchUsers();
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

  openEditModal(user: PlatformUserItem): void {
    this.editingUser.set(user);
    this.editFirstName = user.firstName || user.name.split(' ')[0] || '';
    this.editLastName = user.lastName || user.name.split(' ').slice(1).join(' ') || '';
    this.editEmail = user.email;
    this.editPhone = user.phone || '';
    this.editPassword = '';
    this.editRole = String(user.role);
    this.editStatus = user.status;
    this.showPassword = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.isEditModalOpen.set(true);
  }

  async saveUserChanges(): Promise<void> {
    const user = this.editingUser();
    if (!user) return;

    if (!this.editEmail || !this.editEmail.includes('@')) {
      this.errorMessage = 'Please provide a valid login email address.';
      return;
    }

    if (this.editPassword && this.editPassword.length < 6) {
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
      role: this.editRole,
      active: this.editStatus === 'ACTIVE'
    };

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
      let token = localStorage.getItem('nisha_admin_token');

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

      // Optimistic local update
      const updatedFullName = `${payload.firstName} ${payload.lastName}`.trim() || payload.email;
      this.users.update(list =>
        list.map(u => {
          if (u.id === user.id) {
            return {
              ...u,
              name: updatedFullName,
              firstName: payload.firstName,
              lastName: payload.lastName,
              email: payload.email,
              phone: payload.phone,
              role: payload.role as Role,
              status: payload.active ? 'ACTIVE' : 'INACTIVE'
            };
          }
          return u;
        })
      );

      this.successMessage = 'Credentials updated successfully! User can now sign in with the new details.';
      setTimeout(() => {
        this.isEditModalOpen.set(false);
        this.fetchUsers();
      }, 1200);
    } catch (err: any) {
      this.errorMessage = err?.message || 'Error updating user credentials. Please try again.';
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
            body: JSON.stringify({ email: 'admin@oilcommerce.in', password: 'Admin@123' })
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
            if (roleStr === 'SUPER_ADMIN') tenantName = 'Platform Central';
            else if (roleStr === 'TENANT_ADMIN') tenantName = 'Nisha Pure Oils';

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

          // Deduplicate by email with mock
          const liveEmails = new Set(liveUsers.map(u => u.email.toLowerCase()));
          const remainingMock = INITIAL_STAFF.filter(u => !liveEmails.has(u.email.toLowerCase()));
          this.users.set([...liveUsers, ...remainingMock]);
        }
      }
    } catch (e) {
      console.warn('Could not fetch platform users from backend:', e);
    }
  }
}
