import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { LiveSyncService } from '../../../core/services/live-sync.service';
import { ExportService } from '../../../core/services/export.service';
import { Order } from '../../../core/models/app.models';
import { OrderStatus } from '../../../core/enums/app.enums';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ModalComponent, BadgeComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Orders & Dispatch Pipeline</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Process online oil orders, assign tracking numbers, and print GST tax invoices.</p>
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <!-- Sync Live -->
          <button
            type="button"
            (click)="syncLive()"
            [disabled]="liveSyncService.isSyncing()"
            class="w-full sm:w-auto justify-center px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-60"
            title="Sync orders pipeline with live backend"
          >
            <span class="material-symbols-outlined text-[16px]" [ngClass]="{'animate-spin text-amber-500': liveSyncService.isSyncing()}">sync</span>
            <span>{{ liveSyncService.isSyncing() ? 'Syncing...' : 'Sync Live' }}</span>
          </button>

          <button
            type="button"
            (click)="exportOrders()"
            class="w-full sm:w-auto justify-center px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[18px]">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <!-- Orders Data Table -->
      <app-data-table
        [columns]="columns"
        [totalCount]="filteredOrders().length"
        [pageSize]="10"
        searchPlaceholder="Search order #, customer name, phone, or carrier..."
        (search)="onSearch($event)"
      >
        <div table-actions class="flex items-center gap-2 w-full sm:w-auto">
          <select
            [(ngModel)]="statusFilter"
            class="w-full sm:w-auto text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-3 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option [value]="OrderStatus.PENDING">Pending</option>
            <option [value]="OrderStatus.PROCESSING">Processing</option>
            <option [value]="OrderStatus.SHIPPED">Shipped</option>
            <option [value]="OrderStatus.DELIVERED">Delivered</option>
            <option [value]="OrderStatus.CANCELLED">Cancelled</option>
          </select>
        </div>

        <ng-container table-rows>
          <tr *ngFor="let ord of filteredOrders()" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
            <!-- Order # & Date -->
            <td class="px-4 py-3 font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
              <div>{{ ord.orderNumber }}</div>
              <div class="text-[10px] text-slate-400 font-sans font-normal">{{ ord.createdAt | date:'mediumDate' }}</div>
            </td>

            <!-- Customer -->
            <td class="px-4 py-3 text-slate-900 dark:text-white">
              <div class="font-bold text-xs">{{ ord.customerName }}</div>
              <div class="text-[10px] text-slate-400">{{ ord.customerPhone }}</div>
            </td>

            <!-- Items -->
            <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
              <div *ngFor="let item of ord.items.slice(0, 2)" class="truncate max-w-xs">
                {{ item.quantity }}x {{ item.productName }} ({{ item.variantSize }})
              </div>
              <div *ngIf="ord.items.length > 2" class="text-[10px] text-amber-600 font-semibold">
                +{{ ord.items.length - 2 }} more item(s)
              </div>
            </td>

            <!-- Order Status -->
            <td class="px-4 py-3">
              <app-badge [variant]="getStatusVariant(ord.status)" [dot]="true">
                {{ ord.status }}
              </app-badge>
            </td>

            <!-- Payment -->
            <td class="px-4 py-3 text-xs">
              <app-badge [variant]="ord.paymentStatus === 'PAID' ? 'emerald' : 'amber'">
                {{ ord.paymentStatus }}
              </app-badge>
              <div class="text-[10px] text-slate-400 mt-0.5">{{ ord.paymentMethod }}</div>
            </td>

            <!-- Total -->
            <td class="px-4 py-3 text-right font-black text-slate-900 dark:text-white text-xs">
              ₹{{ ord.grandTotal.toLocaleString() }}
            </td>

            <!-- Actions -->
            <td class="px-4 py-3 text-right space-x-1">
              <button
                type="button"
                (click)="openStatusModal(ord)"
                class="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Update Fulfillment Status"
              >
                <span class="material-symbols-outlined text-[18px]">local_shipping</span>
              </button>
              <button
                type="button"
                (click)="openInvoiceModal(ord)"
                class="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                title="View & Print GST Invoice"
              >
                <span class="material-symbols-outlined text-[18px]">receipt</span>
              </button>
            </td>
          </tr>
        </ng-container>
      </app-data-table>

      <!-- Status Updater Modal -->
      <app-modal
        [isOpen]="isStatusModalOpen()"
        title="Update Fulfillment & Tracking"
        icon="local_shipping"
        size="md"
        (close)="isStatusModalOpen.set(false)"
      >
        <div *ngIf="selectedOrder()" class="space-y-4 text-xs">
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
            <div>
              <span class="text-slate-400">Order:</span>
              <strong class="ml-1 text-slate-800 dark:text-white">{{ selectedOrder()?.orderNumber }}</strong>
            </div>
            <div>
              <span class="text-slate-400">Customer:</span>
              <strong class="ml-1 text-slate-800 dark:text-white">{{ selectedOrder()?.customerName }}</strong>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Order Status *</label>
            <select
              [(ngModel)]="newStatus"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              <option [value]="OrderStatus.PENDING">Pending</option>
              <option [value]="OrderStatus.PROCESSING">Processing (Cold-Press Packaging)</option>
              <option [value]="OrderStatus.SHIPPED">Shipped (Dispatched to Courier)</option>
              <option [value]="OrderStatus.DELIVERED">Delivered</option>
              <option [value]="OrderStatus.CANCELLED">Cancelled</option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Carrier / Logistics</label>
              <input
                type="text"
                [(ngModel)]="newCarrier"
                placeholder="e.g. DTDC Express / ST Courier"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tracking Number</label>
              <input
                type="text"
                [(ngModel)]="newTrackingNumber"
                placeholder="e.g. DTDC89218290"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>
          </div>
        </div>

        <div modal-footer class="flex items-center gap-2">
          <button
            type="button"
            (click)="isStatusModalOpen.set(false)"
            class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="commitStatusUpdate()"
            class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-xs"
          >
            Update Order
          </button>
        </div>
      </app-modal>

      <!-- PRINTABLE GST TAX INVOICE MODAL -->
      <app-modal
        [isOpen]="isInvoiceModalOpen()"
        title="Tax Invoice (Cold-Pressed Edible Oils)"
        icon="receipt"
        size="2xl"
        (close)="isInvoiceModalOpen.set(false)"
      >
        <div *ngIf="selectedOrder()" id="printable-invoice" class="p-4 sm:p-6 bg-white text-slate-900 text-xs space-y-6">
          <!-- Invoice Header -->
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b border-slate-200 pb-5 gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xl font-black text-amber-700">NISHA PURE OILS</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">Mara Chekku Mill</span>
              </div>
              <p class="text-slate-600 text-[11px]">SF No. 104, Avinashi Road, Tirupur, Tamil Nadu 641652</p>
              <p class="text-slate-600 text-[11px]">GSTIN: <strong>33AAACN1284P1Z3</strong> • FSSAI: <strong>12421008000451</strong></p>
              <p class="text-slate-600 text-[11px]">Email: contact&#64;nishapureoils.com • Ph: +91 98421 55000</p>
            </div>

            <div class="text-left sm:text-right">
              <h2 class="text-lg font-black text-slate-800">TAX INVOICE</h2>
              <div class="text-[11px] text-slate-500 mt-1">Invoice #: <strong>{{ selectedOrder()?.orderNumber }}</strong></div>
              <div class="text-[11px] text-slate-500">Date: <strong>{{ selectedOrder()?.createdAt | date:'mediumDate' }}</strong></div>
              <div class="text-[11px] text-slate-500">Payment: <strong>{{ selectedOrder()?.paymentMethod }} ({{ selectedOrder()?.paymentStatus }})</strong></div>
            </div>
          </div>

          <!-- Customer Address & Consignee -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
            <div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billed & Shipped To</div>
              <div class="font-bold text-sm text-slate-900">{{ selectedOrder()?.customerName }}</div>
              <div class="text-slate-600 text-[11px] leading-relaxed">{{ selectedOrder()?.shippingAddress }}</div>
              <div class="text-slate-600 text-[11px] mt-1">Ph: {{ selectedOrder()?.customerPhone }} • {{ selectedOrder()?.customerEmail }}</div>
            </div>
            <div class="text-left sm:text-right">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dispatch Details</div>
              <div class="text-slate-600 text-[11px]">Logistics: <strong>{{ selectedOrder()?.carrier || 'DTDC Surface' }}</strong></div>
              <div class="text-slate-600 text-[11px]">Tracking: <strong>{{ selectedOrder()?.trackingNumber || 'PENDING' }}</strong></div>
              <div class="text-slate-600 text-[11px]">HSN Code: <strong>1508 / 1513 / 1515</strong></div>
            </div>
          </div>

          <!-- Items Table -->
          <div class="overflow-x-auto">
            <table class="w-full min-w-[500px] text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 uppercase text-[10px]">
                <th class="p-2.5">Item Description</th>
                <th class="p-2.5 text-center">Pack Size</th>
                <th class="p-2.5 text-right">Qty</th>
                <th class="p-2.5 text-right">Rate (₹)</th>
                <th class="p-2.5 text-right">GST (5%)</th>
                <th class="p-2.5 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr *ngFor="let item of selectedOrder()?.items">
                <td class="p-2.5">
                  <div class="font-bold">{{ item.productName }}</div>
                  <div class="text-[10px] text-slate-500 font-mono">SKU: {{ item.sku }}</div>
                </td>
                <td class="p-2.5 text-center font-semibold">{{ item.variantSize }}</td>
                <td class="p-2.5 text-right font-bold">{{ item.quantity }}</td>
                <td class="p-2.5 text-right">₹{{ item.unitPrice }}</td>
                <td class="p-2.5 text-right">₹{{ item.taxAmount }}</td>
                <td class="p-2.5 text-right font-bold">₹{{ item.totalPrice }}</td>
              </tr>
            </tbody>
            </table>
          </div>

          <!-- Totals Calculation -->
          <div class="flex justify-end pt-4">
            <div class="w-64 space-y-2 text-xs">
              <div class="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{{ selectedOrder()?.subtotal?.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>CGST (2.5%):</span>
                <span>₹{{ ((selectedOrder()?.taxTotal || 0) / 2).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>SGST (2.5%):</span>
                <span>₹{{ ((selectedOrder()?.taxTotal || 0) / 2).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Shipping Charges:</span>
                <span>{{ (selectedOrder()?.shippingFee || 0) === 0 ? 'FREE' : '₹' + selectedOrder()?.shippingFee }}</span>
              </div>
              <div class="flex justify-between font-black text-sm text-slate-900 pt-2 border-t-2 border-slate-900">
                <span>Grand Total:</span>
                <span>₹{{ selectedOrder()?.grandTotal?.toLocaleString() }}</span>
              </div>
            </div>
          </div>

          <!-- Footer Signature & Notes -->
          <div class="border-t border-slate-200 pt-4 flex items-center justify-between text-[10px] text-slate-500">
            <div>
              <p>Thank you for choosing 100% pure cold-pressed natural oils.</p>
              <p>Certified FSSAI 12421008000451 • Traditional Wood Churned Guarantee</p>
            </div>
            <div class="text-right">
              <div class="font-bold text-slate-800">For NISHA PURE OILS</div>
              <div class="h-8"></div>
              <div>Authorized Mill Signatory</div>
            </div>
          </div>
        </div>

        <div modal-footer class="flex items-center gap-2">
          <button
            type="button"
            (click)="isInvoiceModalOpen.set(false)"
            class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            Close
          </button>
          <button
            type="button"
            (click)="printInvoice()"
            class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-xs flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[18px]">print</span>
            <span>Print Invoice</span>
          </button>
        </div>
      </app-modal>
    </div>
  `
})
export class OrderListComponent {
  orderService = inject(OrderService);
  exportService = inject(ExportService);
  readonly liveSyncService = inject(LiveSyncService);

  readonly OrderStatus = OrderStatus;

  searchQuery = signal<string>('');
  statusFilter = signal<string>('ALL');

  async syncLive(): Promise<void> {
    await this.liveSyncService.syncOrders();
  }

  isStatusModalOpen = signal<boolean>(false);
  isInvoiceModalOpen = signal<boolean>(false);
  selectedOrder = signal<Order | null>(null);

  newStatus: OrderStatus = OrderStatus.PROCESSING;
  newCarrier: string = 'DTDC Express';
  newTrackingNumber: string = '';

  columns: ColumnDef[] = [
    { key: 'orderNumber', label: 'Order # & Date', sortable: true },
    { key: 'customerName', label: 'Customer', sortable: true },
    { key: 'items', label: 'Oil Items' },
    { key: 'status', label: 'Dispatch Status', sortable: true },
    { key: 'paymentStatus', label: 'Payment', sortable: true },
    { key: 'grandTotal', label: 'Grand Total', sortable: true, align: 'right' },
    { key: 'actions', label: 'Actions', align: 'right' }
  ];

  filteredOrders = computed(() => {
    let list = this.orderService.orders();
    const q = this.searchQuery().toLowerCase().trim();
    const st = this.statusFilter();

    if (q) {
      list = list.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        (o.carrier && o.carrier.toLowerCase().includes(q))
      );
    }

    if (st !== 'ALL') {
      list = list.filter(o => o.status === st);
    }

    return list;
  });

  onSearch(q: string): void {
    this.searchQuery.set(q);
  }

  openStatusModal(order: Order): void {
    this.selectedOrder.set(order);
    this.newStatus = order.status;
    this.newCarrier = order.carrier || 'DTDC Express';
    this.newTrackingNumber = order.trackingNumber || `DTDC-${Date.now().toString().slice(-6)}`;
    this.isStatusModalOpen.set(true);
  }

  commitStatusUpdate(): void {
    const o = this.selectedOrder();
    if (o) {
      this.orderService.updateOrderStatus(o.id, this.newStatus, this.newTrackingNumber, this.newCarrier);
    }
    this.isStatusModalOpen.set(false);
  }

  openInvoiceModal(order: Order): void {
    this.selectedOrder.set(order);
    this.isInvoiceModalOpen.set(true);
  }

  printInvoice(): void {
    this.exportService.printInvoice('printable-invoice');
  }

  exportOrders(): void {
    const data = this.orderService.orders().map(o => ({
      OrderNumber: o.orderNumber,
      Customer: o.customerName,
      Phone: o.customerPhone,
      Subtotal: o.subtotal,
      GST: o.taxTotal,
      GrandTotal: o.grandTotal,
      Status: o.status,
      PaymentStatus: o.paymentStatus,
      Carrier: o.carrier || '',
      Tracking: o.trackingNumber || '',
      Date: o.createdAt
    }));
    this.exportService.exportToCsv('NishaPureOils-Orders', data);
  }

  getStatusVariant(status: OrderStatus): 'emerald' | 'amber' | 'blue' | 'rose' | 'slate' {
    switch (status) {
      case OrderStatus.DELIVERED: return 'emerald';
      case OrderStatus.SHIPPED: return 'blue';
      case OrderStatus.PROCESSING: return 'amber';
      case OrderStatus.CANCELLED: return 'rose';
      default: return 'slate';
    }
  }
}
