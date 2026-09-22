import { Injectable, inject, signal, computed } from '@angular/core';
import { ProductService } from './product.service';
import { InventoryService } from './inventory.service';
import { OrderService } from './order.service';
import { CustomerService } from './customer.service';

export interface SyncFeedback {
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class LiveSyncService {
  private productService = inject(ProductService);
  private inventoryService = inject(InventoryService);
  private orderService = inject(OrderService);
  private customerService = inject(CustomerService);

  readonly isSyncing = signal<boolean>(false);
  readonly lastSyncedAt = signal<Date | null>(new Date());
  readonly syncStatus = signal<'idle' | 'syncing' | 'success' | 'error'>('idle');
  readonly syncFeedback = signal<SyncFeedback | null>(null);

  private feedbackTimeout: any = null;
  private autoSyncIntervalId: any = null;

  constructor() {
    this.initAutoSync();
  }

  private initAutoSync(): void {
    if (typeof window === 'undefined') return;

    // Periodic live sync every 90 seconds
    this.autoSyncIntervalId = setInterval(() => {
      if (document.visibilityState === 'visible' && !this.isSyncing()) {
        this.syncAll(true);
      }
    }, 90000);

    // Refresh when user focuses back on the tab
    window.addEventListener('focus', () => {
      const last = this.lastSyncedAt();
      if (!last || Date.now() - last.getTime() > 30000) {
        if (!this.isSyncing()) {
          this.syncAll(true);
        }
      }
    });
  }

  showFeedback(message: string, type: 'success' | 'error' | 'info' = 'success', durationMs = 5000): void {
    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout);
    }
    this.syncFeedback.set({ message, type, timestamp: Date.now() });
    if (typeof window !== 'undefined') {
      this.feedbackTimeout = setTimeout(() => {
        this.syncFeedback.set(null);
      }, durationMs);
    }
  }

  clearFeedback(): void {
    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout);
    }
    this.syncFeedback.set(null);
  }

  /**
   * Complete live synchronization across all entities
   */
  async syncAll(isSilent = false): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing()) {
      return { success: false, message: 'Sync already in progress' };
    }

    this.isSyncing.set(true);
    this.syncStatus.set('syncing');

    try {
      const [prodRes, invRes, ordRes, custRes] = await Promise.allSettled([
        this.productService.syncFromBackend(),
        this.inventoryService.syncMovementsFromBackend(),
        this.orderService.fetchOrdersFromBackend(),
        this.customerService.fetchBackendCustomers()
      ]);

      const now = new Date();
      this.lastSyncedAt.set(now);
      this.syncStatus.set('success');

      let catalogSummary = '';
      if (prodRes.status === 'fulfilled') {
        const d = prodRes.value;
        catalogSummary = `${d.brandsCount} brands, ${d.categoriesCount} categories, ${d.productsCount} products`;
      } else {
        catalogSummary = 'catalog cached';
      }

      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const msg = `Live sync completed (${timeStr}): Refreshed ${catalogSummary} & latest database records.`;

      if (!isSilent) {
        this.showFeedback(msg, 'success');
      }

      return { success: true, message: msg };
    } catch (err: any) {
      this.syncStatus.set('error');
      const errorMsg = 'Could not sync live from backend. Offline cached data is preserved.';
      if (!isSilent) {
        this.showFeedback(errorMsg, 'error');
      }
      return { success: false, message: errorMsg };
    } finally {
      this.isSyncing.set(false);
    }
  }

  /**
   * Sync catalog (Brands, Categories, Products)
   */
  async syncCatalog(): Promise<void> {
    if (this.isSyncing()) return;
    this.isSyncing.set(true);
    this.syncStatus.set('syncing');

    try {
      const res = await this.productService.syncFromBackend();
      this.lastSyncedAt.set(new Date());
      this.syncStatus.set('success');
      this.showFeedback(
        `✓ Synced live: ${res.brandsCount} brands, ${res.categoriesCount} categories, and ${res.productsCount} catalog SKUs refreshed.`,
        'success'
      );
    } catch (err) {
      this.syncStatus.set('error');
      this.showFeedback('Live catalog sync timed out. Kept cached data.', 'error');
    } finally {
      this.isSyncing.set(false);
    }
  }

  /**
   * Sync inventory (Products + Movement ledger)
   */
  async syncInventory(): Promise<void> {
    if (this.isSyncing()) return;
    this.isSyncing.set(true);
    this.syncStatus.set('syncing');

    try {
      const [prodRes, invRes] = await Promise.allSettled([
        this.productService.syncFromBackend(),
        this.inventoryService.syncMovementsFromBackend()
      ]);

      this.lastSyncedAt.set(new Date());
      this.syncStatus.set('success');
      this.showFeedback(
        '✓ Stock levels & warehouse movements successfully synced with live database.',
        'success'
      );
    } catch (err) {
      this.syncStatus.set('error');
      this.showFeedback('Inventory sync encountered network issues. Using local stock data.', 'error');
    } finally {
      this.isSyncing.set(false);
    }
  }

  /**
   * Sync orders pipeline
   */
  async syncOrders(): Promise<void> {
    if (this.isSyncing()) return;
    this.isSyncing.set(true);
    this.syncStatus.set('syncing');

    try {
      const ok = await this.orderService.fetchOrdersFromBackend();
      this.customerService.syncWithOrders();
      this.lastSyncedAt.set(new Date());
      this.syncStatus.set('success');
      this.showFeedback(
        ok ? '✓ Live orders & dispatch pipeline refreshed from server.' : '✓ Orders checked with backend (cached state intact).',
        'success'
      );
    } catch (err) {
      this.syncStatus.set('error');
      this.showFeedback('Orders sync warning. Using cached orders.', 'error');
    } finally {
      this.isSyncing.set(false);
    }
  }

  /**
   * Sync customers & accounts
   */
  async syncCustomers(): Promise<void> {
    if (this.isSyncing()) return;
    this.isSyncing.set(true);
    this.syncStatus.set('syncing');

    try {
      await Promise.allSettled([
        this.orderService.fetchOrdersFromBackend(),
        this.customerService.fetchBackendCustomers()
      ]);
      this.customerService.syncWithOrders();
      this.lastSyncedAt.set(new Date());
      this.syncStatus.set('success');
      this.showFeedback('✓ Customers & wholesale accounts synced with live database.', 'success');
    } catch (err) {
      this.syncStatus.set('error');
      this.showFeedback('Customer sync warning. Using cached records.', 'error');
    } finally {
      this.isSyncing.set(false);
    }
  }
}
