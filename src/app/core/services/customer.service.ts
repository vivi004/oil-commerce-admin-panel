import { Injectable, signal, computed, inject } from '@angular/core';
import { Customer, Order } from '../models/app.models';
import { INITIAL_CUSTOMERS } from './mock-data';
import { OrderService } from './order.service';
import { fetchWithTimeout, getApiUrl } from '../utils/api.utils';
import { environment } from '../../../environments/environment';

const CUSTOMERS_STORAGE_KEY = 'nisha_admin_customers_v2';
const DELETED_CUSTOMERS_STORAGE_KEY = 'nisha_admin_deleted_customers_v2';

const EXTENDED_SEED_CUSTOMERS: Customer[] = [
  ...INITIAL_CUSTOMERS,
  {
    id: 'cust-4',
    fullName: 'Kavitha Sundaram',
    email: 'kavitha.s@gmail.com',
    phone: '+91 98421 88442',
    address: '42, Cross Cut Road, Gandhipuram',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641012',
    totalOrders: 2,
    lifetimeSpend: 2672.50,
    lastOrderDate: '2026-03-16',
    supportNotes: 'Prefers 5L tin packaging for groundnut oil and 1L cold-pressed virgin coconut oil.',
    createdAt: '2025-01-15'
  },
  {
    id: 'cust-5',
    fullName: 'Suresh Balaji',
    email: 'suresh.b@gmail.com',
    phone: '+91 98422 33445',
    address: '108, West Veli Street',
    city: 'Madurai',
    state: 'Tamil Nadu',
    pincode: '625001',
    totalOrders: 4,
    lifetimeSpend: 6850,
    lastOrderDate: '2026-03-10',
    supportNotes: 'Regular monthly order of wood-pressed gingelly / sesame oil.',
    createdAt: '2025-02-01'
  }
];

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private orderService = inject(OrderService);

  private customersSignal = signal<Customer[]>(this.loadStoredCustomers());
  readonly customers = this.customersSignal.asReadonly();

  readonly totalCustomers = computed(() => this.customersSignal().length);
  
  readonly totalLifetimeRevenue = computed(() => 
    this.customersSignal().reduce((sum, c) => sum + (c.lifetimeSpend || 0), 0)
  );

  readonly b2bCount = computed(() =>
    this.customersSignal().filter(c => 
      c.supportNotes?.toLowerCase().includes('wholesale') || 
      c.supportNotes?.toLowerCase().includes('b2b') ||
      c.totalOrders > 5
    ).length
  );

  readonly avgOrderValue = computed(() => {
    const list = this.customersSignal();
    const totalOrders = list.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
    const totalRevenue = this.totalLifetimeRevenue();
    return totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  });

  constructor() {
    this.syncWithOrders();
    this.fetchBackendCustomers();
  }

  /**
   * Load permanent tombstone records for deleted customers (IDs and Emails)
   */
  private loadDeletedRecords(): { ids: Set<string>; emails: Set<string> } {
    if (typeof window === 'undefined') {
      return { ids: new Set(), emails: new Set() };
    }
    try {
      const raw = localStorage.getItem(DELETED_CUSTOMERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ids: new Set(parsed.ids || []),
          emails: new Set((parsed.emails || []).map((e: string) => e.toLowerCase().trim()))
        };
      }
    } catch {}
    return { ids: new Set(), emails: new Set() };
  }

  /**
   * Record customer ID and email as permanently deleted so they NEVER resurrect on reload
   */
  private recordDeletedCustomer(id: string, email?: string): void {
    if (typeof window === 'undefined') return;
    try {
      const deleted = this.loadDeletedRecords();
      if (id) deleted.ids.add(id);
      if (email) deleted.emails.add(email.toLowerCase().trim());
      localStorage.setItem(DELETED_CUSTOMERS_STORAGE_KEY, JSON.stringify({
        ids: Array.from(deleted.ids),
        emails: Array.from(deleted.emails)
      }));
    } catch (e) {
      console.warn('Failed to record deleted customer:', e);
    }
  }

  /**
   * Remove a customer from the deleted tombstone (e.g. if explicitly created anew)
   */
  private unmarkDeletedCustomer(email?: string): void {
    if (typeof window === 'undefined' || !email) return;
    try {
      const deleted = this.loadDeletedRecords();
      deleted.emails.delete(email.toLowerCase().trim());
      localStorage.setItem(DELETED_CUSTOMERS_STORAGE_KEY, JSON.stringify({
        ids: Array.from(deleted.ids),
        emails: Array.from(deleted.emails)
      }));
    } catch {}
  }

  private loadStoredCustomers(): Customer[] {
    const deleted = this.loadDeletedRecords();

    if (typeof window === 'undefined') {
      return EXTENDED_SEED_CUSTOMERS.filter(
        c => !deleted.emails.has(c.email.toLowerCase().trim()) && !deleted.ids.has(c.id)
      );
    }

    try {
      const stored = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
      // If user previously saved anything (even an empty array [] or 1 single customer), respect it!
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            c => !deleted.emails.has(c.email?.toLowerCase().trim()) && !deleted.ids.has(c.id)
          );
        }
      }
    } catch (e) {
      console.warn('Failed to load stored customers:', e);
    }

    // First time initialization:
    const initial = EXTENDED_SEED_CUSTOMERS.filter(
      c => !deleted.emails.has(c.email.toLowerCase().trim()) && !deleted.ids.has(c.id)
    );
    this.persistCustomers(initial);
    return initial;
  }

  private persistCustomers(customers: Customer[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
    } catch (e) {
      console.warn('Failed to persist customers:', e);
    }
  }

  /**
   * Cross-sync customer order counts and lifetime spend directly from OrderService orders
   * Skips any customer whose email is in the permanent deleted tombstone set.
   */
  syncWithOrders(): void {
    const orders = this.orderService.orders();
    if (!orders || orders.length === 0) return;

    const deleted = this.loadDeletedRecords();

    this.customersSignal.update(currentList => {
      const updatedList = [...currentList];
      const emailMap = new Map<string, Customer>();
      
      updatedList.forEach(c => emailMap.set(c.email.toLowerCase().trim(), c));

      orders.forEach(order => {
        if (!order.customerEmail) return;
        const emailKey = order.customerEmail.toLowerCase().trim();

        // If this customer was deleted by the user, DO NOT resurrect them!
        if (deleted.emails.has(emailKey)) {
          return;
        }

        const existing = emailMap.get(emailKey);
        const customerOrders = orders.filter(
          o => o.customerEmail?.toLowerCase().trim() === emailKey
        );
        const totalSpend = customerOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
        const lastOrder = customerOrders[0];
        const lastDate = lastOrder?.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0];

        if (existing) {
          existing.totalOrders = Math.max(existing.totalOrders, customerOrders.length);
          existing.lifetimeSpend = Math.max(existing.lifetimeSpend, totalSpend);
          if (lastDate) existing.lastOrderDate = lastDate;
          if (order.shippingAddress && (!existing.address || existing.address === 'Delivery address on record')) {
            existing.address = order.shippingAddress;
          }
        } else {
          // Discover new active storefront customer
          const newCust: Customer = {
            id: `cust-auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            fullName: order.customerName || 'Store Customer',
            email: order.customerEmail,
            phone: order.customerPhone || '+91 98421 00000',
            address: order.shippingAddress || 'Storefront Delivery Address',
            city: 'Coimbatore',
            state: 'Tamil Nadu',
            pincode: '641012',
            totalOrders: customerOrders.length,
            lifetimeSpend: totalSpend,
            lastOrderDate: lastDate,
            supportNotes: 'LIVE_REGISTERED',
            createdAt: order.createdAt || new Date().toISOString()
          };
          emailMap.set(emailKey, newCust);
          updatedList.push(newCust);
        }
      });

      this.persistCustomers(updatedList);
      return updatedList;
    });
  }

  /**
   * Sync with live PostgreSQL backend `/users/admin/all`
   * Skips any user whose email or ID is in the permanent deleted tombstone set.
   */
  async fetchBackendCustomers(): Promise<boolean> {
    try {
      let token = typeof window !== 'undefined' ? localStorage.getItem('nisha_admin_token') : null;

      if (!token) {
        try {
          const authRes = await fetchWithTimeout(getApiUrl('/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'superadmin@nishapureoils.com', password: 'Admin@123' })
          }, environment.apiTimeout);
          if (authRes.ok) {
            const authData = await authRes.json();
            token = authData.data?.accessToken;
            if (token && typeof window !== 'undefined') {
              localStorage.setItem('nisha_admin_token', token);
            }
          }
        } catch {}
      }

      if (!token) return false;

      const res = await fetchWithTimeout(getApiUrl('/users/admin/all'), {
        headers: { Authorization: `Bearer ${token}` }
      }, environment.apiTimeout);

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const allOrders = this.orderService.orders();
          const registeredUsers = json.data.filter((u: any) => u.role === 'CUSTOMER');
          const deleted = this.loadDeletedRecords();

          this.customersSignal.update(current => {
            const currentEmails = new Map(current.map(c => [c.email.toLowerCase().trim(), c]));
            const merged: Customer[] = [...current];

            registeredUsers.forEach((u: any) => {
              const emailKey = (u.email || '').toLowerCase().trim();

              // Do not add if permanently deleted
              if (!emailKey || deleted.emails.has(emailKey) || deleted.ids.has(u.id)) {
                return;
              }

              const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Store Customer';
              const userOrders = allOrders.filter(
                o => (o.customerEmail && o.customerEmail.toLowerCase().trim() === emailKey) ||
                     (o.customerPhone && u.phone && o.customerPhone.includes(u.phone))
              );
              const totalOrders = userOrders.length;
              const lifetimeSpend = userOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
              const lastOrderDate = userOrders.length > 0 
                ? (userOrders[0].createdAt?.split('T')[0] || 'Recently')
                : (u.createdAt ? new Date(typeof u.createdAt === 'number' ? u.createdAt * 1000 : u.createdAt).toISOString().split('T')[0] : 'Recently joined');

              const existing = currentEmails.get(emailKey);
              if (existing) {
                existing.fullName = fullName;
                existing.phone = u.phone || existing.phone;
                existing.supportNotes = 'LIVE_REGISTERED';
                if (totalOrders > 0) existing.totalOrders = totalOrders;
                if (lifetimeSpend > 0) existing.lifetimeSpend = lifetimeSpend;
              } else {
                const newC: Customer = {
                  id: u.id,
                  fullName,
                  email: u.email,
                  phone: u.phone || '+91 98421 00000',
                  address: 'Storefront Delivery Address',
                  city: 'Coimbatore',
                  state: 'Tamil Nadu',
                  pincode: '641012',
                  totalOrders,
                  lifetimeSpend,
                  lastOrderDate,
                  supportNotes: 'LIVE_REGISTERED',
                  createdAt: u.createdAt ? new Date(typeof u.createdAt === 'number' ? u.createdAt * 1000 : u.createdAt).toISOString() : new Date().toISOString()
                };
                merged.unshift(newC);
                currentEmails.set(emailKey, newC);
              }
            });

            this.persistCustomers(merged);
            return merged;
          });

          return true;
        }
      }
    } catch (e) {
      console.warn('Backend customer sync fallback:', e);
    }
    return false;
  }

  addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Customer {
    this.unmarkDeletedCustomer(customer.email);

    const newCustomer: Customer = {
      ...customer,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    this.customersSignal.update(list => {
      const updated = [newCustomer, ...list];
      this.persistCustomers(updated);
      return updated;
    });

    return newCustomer;
  }

  updateCustomer(id: string, updates: Partial<Customer>): void {
    if (updates.email) {
      this.unmarkDeletedCustomer(updates.email);
    }

    this.customersSignal.update(list => {
      const updated = list.map(c => c.id === id ? { ...c, ...updates } : c);
      this.persistCustomers(updated);
      return updated;
    });
  }

  deleteCustomer(id: string): void {
    const target = this.customersSignal().find(c => c.id === id);
    const email = target?.email;

    // 1. Record in permanent tombstone set so it never resurrects on reload or sync
    this.recordDeletedCustomer(id, email);

    // 2. Remove from active signal and persist immediately
    this.customersSignal.update(list => {
      const updated = list.filter(c => c.id !== id);
      this.persistCustomers(updated);
      return updated;
    });

    // 3. If UUID, delete from backend PostgreSQL database as well
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid && typeof window !== 'undefined') {
      const token = localStorage.getItem('nisha_admin_token');
      if (token) {
        fetchWithTimeout(getApiUrl(`/users/admin/${id}`), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }, 4000).catch(() => {});
      }
    }
  }

  getCustomerOrders(customerEmail: string, customerPhone?: string): Order[] {
    const emailKey = customerEmail.toLowerCase().trim();
    return this.orderService.orders().filter(o => {
      const oEmail = o.customerEmail?.toLowerCase().trim();
      const matchEmail = oEmail && oEmail === emailKey;
      const matchPhone = customerPhone && o.customerPhone && o.customerPhone.includes(customerPhone.trim());
      return matchEmail || matchPhone;
    });
  }
}
