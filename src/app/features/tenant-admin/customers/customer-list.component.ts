import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { INITIAL_CUSTOMERS } from '../../../core/services/mock-data';
import { Customer } from '../../../core/models/app.models';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { OrderService } from '../../../core/services/order.service';
import { fetchWithTimeout, getApiUrl } from '../../../core/utils/api.utils';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Customers & Wholesale Accounts</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Retail households and B2B restaurants buying cold-pressed wood-churned oils.</p>
        </div>
        <div>
          <button
            type="button"
            (click)="refresh()"
            class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <span class="material-symbols-outlined text-[16px]">sync</span>
            <span>Refresh Customers</span>
          </button>
        </div>
      </div>

      <app-data-table
        [columns]="columns"
        [totalCount]="filteredCustomers().length"
        [pageSize]="10"
        searchPlaceholder="Search customer by name, email, phone or city..."
        (search)="onSearch($event)"
      >
        <ng-container table-rows>
          <tr *ngFor="let c of filteredCustomers()" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center">
                  {{ c.fullName.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div class="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{{ c.fullName }}</span>
                    <span *ngIf="c.supportNotes === 'LIVE_REGISTERED'" class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                      Live Customer
                    </span>
                  </div>
                  <div class="text-[10px] text-slate-400">{{ c.email }} • {{ c.phone }}</div>
                </div>
              </div>
            </td>

            <td class="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
              <div>{{ c.city }}, {{ c.state }}</div>
              <div class="text-[10px] text-slate-400">PIN: {{ c.pincode }}</div>
            </td>

            <td class="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 text-xs">
              {{ c.totalOrders }} {{ c.totalOrders === 1 ? 'order' : 'orders' }}
            </td>

            <td class="px-4 py-3 text-right font-black text-slate-900 dark:text-white text-xs">
              ₹{{ c.lifetimeSpend.toLocaleString() }}
            </td>

            <td class="px-4 py-3 text-right text-[11px] text-slate-400">
              {{ c.lastOrderDate }}
            </td>
          </tr>
        </ng-container>
      </app-data-table>
    </div>
  `
})
export class CustomerListComponent implements OnInit {
  private orderService = inject(OrderService);

  customers = signal<Customer[]>(INITIAL_CUSTOMERS);
  searchQuery = signal<string>('');

  columns: ColumnDef[] = [
    { key: 'fullName', label: 'Customer Name & Contact', sortable: true },
    { key: 'city', label: 'Location', sortable: true },
    { key: 'totalOrders', label: 'Total Orders', sortable: true },
    { key: 'lifetimeSpend', label: 'Lifetime Spend', sortable: true, align: 'right' },
    { key: 'lastOrderDate', label: 'Last Order', align: 'right' }
  ];

  filteredCustomers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.customers();
    return this.customers().filter(c =>
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.fetchLiveCustomers();
  }

  refresh(): void {
    this.orderService.fetchOrdersFromBackend();
    this.fetchLiveCustomers();
  }

  async fetchLiveCustomers(): Promise<void> {
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
          const allOrders = this.orderService.orders();
          const registeredCustomers = json.data
            .filter((u: any) => u.role === 'CUSTOMER')
            .map((u: any) => {
              const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Store Customer';
              const userOrders = allOrders.filter(
                o => (o.customerEmail && o.customerEmail.toLowerCase() === u.email.toLowerCase()) ||
                     (o.customerPhone && u.phone && o.customerPhone.includes(u.phone))
              );
              const totalOrders = userOrders.length;
              const lifetimeSpend = userOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
              const lastOrderDate = userOrders.length > 0 
                ? (userOrders[0].createdAt?.split('T')[0] || 'Recently')
                : (u.createdAt ? new Date(typeof u.createdAt === 'number' ? u.createdAt * 1000 : u.createdAt).toISOString().split('T')[0] : 'Recently joined');

              const customerCreatedAt = u.createdAt
                ? (typeof u.createdAt === 'number' ? new Date(u.createdAt * 1000).toISOString() : String(u.createdAt))
                : new Date().toISOString();

              const customerItem: Customer = {
                id: u.id,
                fullName,
                email: u.email,
                phone: u.phone || '+91 98421 00000',
                address: 'Delivery address on record',
                city: 'Coimbatore',
                state: 'Tamil Nadu',
                pincode: '641012',
                totalOrders,
                lifetimeSpend,
                lastOrderDate,
                supportNotes: 'LIVE_REGISTERED',
                createdAt: customerCreatedAt
              };
              return customerItem;
            });

          const liveEmails = new Set(registeredCustomers.map((c: Customer) => c.email.toLowerCase()));
          const remainingMock = INITIAL_CUSTOMERS.filter(c => !liveEmails.has(c.email.toLowerCase()));
          this.customers.set([...registeredCustomers, ...remainingMock]);
        }
      }
    } catch (e) {
      console.warn('Could not fetch live customers from backend:', e);
    }
  }

  onSearch(q: string): void {
    this.searchQuery.set(q);
  }
}
