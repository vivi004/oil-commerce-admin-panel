import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../core/services/order.service';
import { PaymentTransaction } from '../../../core/models/app.models';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, BadgeComponent],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Payments & Ledger</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Gateway transactions via Razorpay, UPI, Direct Bank Transfer & COD.</p>
        </div>
      </div>

      <app-data-table
        [columns]="columns"
        [totalCount]="filteredPayments().length"
        [pageSize]="10"
        searchPlaceholder="Search order #, customer, or gateway transaction ID..."
        (search)="onSearch($event)"
      >
        <ng-container table-rows>
          <tr *ngFor="let p of filteredPayments()" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
            <td class="px-4 py-3 font-mono text-xs font-bold text-slate-900 dark:text-white">
              <div>{{ p.gatewayTransactionId }}</div>
              <div class="text-[10px] text-amber-600 font-sans">Order: {{ p.orderNumber }}</div>
            </td>

            <td class="px-4 py-3 font-semibold text-slate-900 dark:text-white text-xs">
              {{ p.customerName }}
            </td>

            <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
              {{ p.paymentMethod }}
            </td>

            <td class="px-4 py-3">
              <app-badge [variant]="p.status === 'SUCCESS' ? 'emerald' : p.status === 'REFUNDED' ? 'amber' : 'rose'" [dot]="true">
                {{ p.status }}
              </app-badge>
            </td>

            <td class="px-4 py-3">
              <span class="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {{ p.settlementStatus }}
              </span>
            </td>

            <td class="px-4 py-3 text-right font-black text-slate-900 dark:text-white text-xs">
              ₹{{ p.amount.toLocaleString() }}
            </td>

            <td class="px-4 py-3 text-right text-[11px] text-slate-400">
              {{ p.createdAt | date:'short' }}
            </td>
          </tr>
        </ng-container>
      </app-data-table>
    </div>
  `
})
export class PaymentListComponent {
  private orderService = inject(OrderService);

  payments = computed<PaymentTransaction[]>(() => {
    return this.orderService.orders().map(o => ({
      id: `pay-${o.id}`,
      orderId: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName || 'Store Customer',
      amount: o.grandTotal,
      paymentMethod: o.paymentMethod || 'Online Payment',
      gatewayTransactionId: o.trackingNumber || `txn_${o.id}`,
      status: o.paymentStatus === 'PAID' ? 'SUCCESS' : o.paymentStatus === 'FAILED' ? 'FAILED' : 'PENDING',
      settlementStatus: o.paymentStatus === 'PAID' ? 'SETTLED' : 'PENDING',
      createdAt: o.createdAt
    }));
  });
  searchQuery = signal<string>('');

  columns: ColumnDef[] = [
    { key: 'gatewayTransactionId', label: 'Transaction ID & Order #', sortable: true },
    { key: 'customerName', label: 'Customer', sortable: true },
    { key: 'paymentMethod', label: 'Payment Method', sortable: true },
    { key: 'status', label: 'Payment Status', sortable: true },
    { key: 'settlementStatus', label: 'Bank Settlement' },
    { key: 'amount', label: 'Amount', sortable: true, align: 'right' },
    { key: 'createdAt', label: 'Timestamp', align: 'right' }
  ];

  filteredPayments = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.payments();
    return this.payments().filter(p =>
      p.gatewayTransactionId.toLowerCase().includes(q) ||
      p.orderNumber.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q) ||
      p.paymentMethod.toLowerCase().includes(q)
    );
  });

  onSearch(q: string): void {
    this.searchQuery.set(q);
  }
}
