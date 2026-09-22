import { Injectable, signal, computed } from '@angular/core';
import { Order, OrderItem, VariantSize } from '../models/app.models';
import { OrderStatus } from '../enums/app.enums';
import { INITIAL_ORDERS } from './mock-data';
import { fetchWithTimeout, getApiUrl } from '../utils/api.utils';

const ORDERS_STORAGE_KEY = 'nisha_admin_orders_v1';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private ordersSignal = signal<Order[]>(this.loadInitialOrders());
  private isFetching = false;
  readonly isSyncing = signal<boolean>(false);

  // Expose readable signal
  readonly orders = this.ordersSignal.asReadonly();

  // Computed signals
  readonly totalOrdersCount = computed(() => this.ordersSignal().length);
  readonly totalRevenue = computed(() => 
    this.ordersSignal()
      .filter(o => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.grandTotal, 0)
  );
  readonly pendingOrdersCount = computed(() => 
    this.ordersSignal().filter(o => o.status === OrderStatus.PENDING).length
  );
  readonly processingOrdersCount = computed(() => 
    this.ordersSignal().filter(o => o.status === OrderStatus.PROCESSING).length
  );
  readonly shippedOrdersCount = computed(() => 
    this.ordersSignal().filter(o => o.status === OrderStatus.SHIPPED).length
  );
  readonly deliveredOrdersCount = computed(() => 
    this.ordersSignal().filter(o => o.status === OrderStatus.DELIVERED).length
  );

  constructor() {
    this.purgeDemoOrders();
    this.fetchOrdersFromBackend();
    // Periodically sync orders every 10 seconds to catch new customer orders
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.fetchOrdersFromBackend();
        this.syncFromStorefrontStorage();
      }, 10000);
    }
  }

  isDemoOrder(o: any): boolean {
    if (!o) return true;
    const demoIds = new Set(['ord-8841', 'ord-8842', 'ord-8843', 'ord-9821', 'ord-8419', 'ord-7612']);
    const demoNumbers = new Set(['NPO-2025-8841', 'NPO-2025-8842', 'NPO-2025-8843', 'NPO-8841', 'NPO-8842', 'NPO-8843']);
    const demoNames = ['anandapadmanabhan', 'deepa meenakshi', 'karthikeyan subramanian', 'kavitha', 'suresh b'];
    const demoEmails = new Set(['anand.p@gmail.com', 'deepa.m@yahoo.com', 'karthik.sub@outlook.com', 'kavitha.s@gmail.com', 'suresh.b@gmail.com']);

    const id = String(o.id || '').trim();
    const num = String(o.orderNumber || '').trim();
    const name = String(o.customerName || '').toLowerCase().trim();
    const email = String(o.customerEmail || '').toLowerCase().trim();

    if (demoIds.has(id) || demoNumbers.has(num)) return true;
    if (num.startsWith('NPO-2025-') || num.startsWith('DEMO-')) return true;
    if (demoEmails.has(email)) return true;
    if (demoNames.some(d => name.includes(d))) return true;

    return false;
  }

  purgeDemoOrders(): void {
    this.ordersSignal.update(list => {
      const clean = list.filter(o => !this.isDemoOrder(o));
      this.persistOrders(clean);
      return clean;
    });
  }

  private loadInitialOrders(): Order[] {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const clean = parsed.filter(o => !this.isDemoOrder(o));
            this.persistOrders(clean);
            return clean;
          }
        }
      } catch (e) {
        console.warn('Failed to load orders from localStorage:', e);
      }
    }
    return [];
  }

  private persistOrders(orders: Order[]): void {
    if (typeof window !== 'undefined') {
      try {
        const clean = orders.filter(o => !this.isDemoOrder(o));
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(clean));
      } catch (e) {
        console.warn('Failed to persist orders to localStorage:', e);
      }
    }
  }

  private syncFromStorefrontStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const sfOrdersRaw = localStorage.getItem('shopzone_orders_list');
      if (sfOrdersRaw) {
        const sfOrders = JSON.parse(sfOrdersRaw);
        if (Array.isArray(sfOrders) && sfOrders.length > 0) {
          const currentOrders = this.ordersSignal().filter(o => !this.isDemoOrder(o));
          const currentIds = new Set(currentOrders.map(o => o.id));
          const newOrdersFromSf: Order[] = [];

          for (const sfo of sfOrders) {
            if (!this.isDemoOrder(sfo) && !currentIds.has(sfo.id)) {
              newOrdersFromSf.push(this.mapDtoToOrder(sfo));
            }
          }

          if (newOrdersFromSf.length > 0) {
            const merged = [...newOrdersFromSf, ...currentOrders];
            this.ordersSignal.set(merged);
            this.persistOrders(merged);
          }
        }
      }
    } catch {
      // Ignore cross-app sync parse errors
    }
  }

  async fetchOrdersFromBackend(): Promise<boolean> {
    if (this.isFetching) return false;
    this.isFetching = true;
    this.isSyncing.set(true);

    try {
      let token = typeof window !== 'undefined' ? localStorage.getItem('nisha_admin_token') : null;

      // If token not yet present, attempt background login using default admin
      if (!token) {
        try {
          const authRes = await fetchWithTimeout(getApiUrl('/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@nishapureoils.com', password: 'Admin@123' })
          }, 15000);
          if (authRes.ok) {
            const authData = await authRes.json();
            if (authData.success && authData.data?.accessToken) {
              token = authData.data.accessToken;
              if (typeof window !== 'undefined') {
                localStorage.setItem('nisha_admin_token', token as string);
              }
            }
          }
        } catch {
          // Ignore offline/connection issues
        }
      }

      if (!token) {
        return false;
      }

      const res = await fetchWithTimeout(getApiUrl('/admin/orders?page=1&pageSize=100'), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }, 20000);

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.items) {
          const backendOrders: Order[] = json.data.items
            .filter((dto: any) => !this.isDemoOrder(dto))
            .map((dto: any) => this.mapDtoToOrder(dto));
          
          // Merge backend orders with existing orders (backend orders placed on top)
          const currentOrders = this.ordersSignal().filter(o => !this.isDemoOrder(o));
          const backendIds = new Set(backendOrders.map(o => o.id));
          const remainingLocal = currentOrders.filter(o => !backendIds.has(o.id));
          const merged = [...backendOrders, ...remainingLocal];
          this.ordersSignal.set(merged);
          this.persistOrders(merged);
          return true;
        }
      }
      return false;
    } catch (e) {
      console.warn('Could not sync orders from backend, relying on cached/local orders', e);
      return false;
    } finally {
      this.isFetching = false;
      this.isSyncing.set(false);
    }
  }

  private mapDtoToOrder(dto: any): Order {
    let addressStr = '124 Gandhipuram 4th Street, Coimbatore, Tamil Nadu 641012';
    if (dto.shippingAddress) {
      if (typeof dto.shippingAddress === 'string') {
        addressStr = dto.shippingAddress;
      } else if (typeof dto.shippingAddress === 'object') {
        const addr = dto.shippingAddress;
        addressStr = [addr.addressLine1, addr.city, addr.state, addr.postalCode, addr.country]
          .filter(Boolean)
          .join(', ');
      }
    }

    const items: OrderItem[] = (dto.items || []).map((i: any) => ({
      productId: i.productId || 'prod-custom',
      productName: i.productName || 'Cold Pressed Oil',
      variantSize: (i.variantSize || i.size || '1L') as VariantSize,
      sku: i.sku || i.productSku || 'SKU-OIL',
      quantity: i.quantity || 1,
      unitPrice: Number(i.unitPrice || 0),
      taxAmount: 0,
      totalPrice: Number(i.totalPrice || i.unitPrice * (i.quantity || 1) || 0)
    }));

    const dateStr = dto.createdAt
      ? (typeof dto.createdAt === 'number' ? new Date(dto.createdAt * 1000).toISOString() : String(dto.createdAt))
      : new Date().toISOString();

    return {
      id: String(dto.id),
      orderNumber: dto.orderNumber || `ORD-${dto.id?.substring(0, 8)}`,
      customerName: dto.customerName || (dto.shippingAddress?.fullName) || 'Customer',
      customerEmail: dto.customerEmail || '',
      customerPhone: dto.customerPhone || (dto.shippingAddress?.phone) || '+91 98421 00000',
      shippingAddress: addressStr,
      items,
      subtotal: Number(dto.subtotal ?? dto.totalAmount ?? 0),
      taxTotal: Number(dto.taxAmount ?? 0),
      shippingFee: Number(dto.shippingCost ?? 0),
      discountTotal: Number(dto.discountAmount ?? 0),
      grandTotal: Number(dto.totalAmount ?? dto.total ?? 0),
      status: (dto.status as OrderStatus) || OrderStatus.PENDING,
      paymentMethod: dto.paymentMethod || 'UPI (Google Pay)',
      paymentStatus: (dto.paymentStatus as 'PAID' | 'PENDING' | 'REFUNDED' | 'FAILED') || 'PAID',
      trackingNumber: dto.trackingNumber || undefined,
      carrier: dto.carrier || undefined,
      createdAt: dateStr,
      updatedAt: dateStr
    };
  }

  getOrderById(id: string): Order | undefined {
    return this.ordersSignal().find(o => o.id === id);
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, trackingNumber?: string, carrier?: string): Promise<void> {
    // 1. Optimistic local update with persistence
    this.ordersSignal.update(orders => {
      const updated = orders.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status,
            trackingNumber: trackingNumber ?? o.trackingNumber,
            carrier: carrier ?? o.carrier,
            updatedAt: new Date().toISOString()
          };
        }
        return o;
      });
      this.persistOrders(updated);
      return updated;
    });

    // 2. Sync to backend if order is a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    if (isUuid) {
      try {
        const token = localStorage.getItem('nisha_admin_token');
        if (token) {
          await fetchWithTimeout(getApiUrl(`/admin/orders/${orderId}/status`), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              status,
              note: `Status updated to ${status} via Admin Portal`,
              trackingNumber: trackingNumber || undefined,
              carrier: carrier || undefined
            })
          }, 1500);
        }
      } catch (err) {
        console.warn('Failed to sync status update to backend:', err);
      }
    }
  }

  updatePaymentStatus(orderId: string, paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED' | 'FAILED'): void {
    this.ordersSignal.update(orders => {
      const updated = orders.map(o => o.id === orderId ? { ...o, paymentStatus, updatedAt: new Date().toISOString() } : o);
      this.persistOrders(updated);
      return updated;
    });
  }

  addOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
    const newOrder: Order = {
      ...orderData,
      id: 'ord-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.ordersSignal.update(orders => {
      const updated = [newOrder, ...orders];
      this.persistOrders(updated);
      return updated;
    });
    return newOrder;
  }
}
