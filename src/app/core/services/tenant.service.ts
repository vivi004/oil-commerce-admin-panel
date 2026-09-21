import { Injectable, signal, computed } from '@angular/core';
import { Tenant, SubscriptionPlan } from '../models/app.models';
import { TenantStatus, SubscriptionTier } from '../enums/app.enums';
import { INITIAL_TENANTS, INITIAL_SUBSCRIPTION_PLANS } from './mock-data';
import { fetchWithTimeout, getApiUrl } from '../utils/api.utils';

const TENANTS_STORAGE_KEY = 'nisha_admin_tenants_v1';
const PLANS_STORAGE_KEY = 'nisha_admin_plans_v1';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private tenantsSignal = signal<Tenant[]>(this.loadInitialTenants());
  private plansSignal = signal<SubscriptionPlan[]>(this.loadInitialPlans());

  readonly tenants = this.tenantsSignal.asReadonly();
  readonly plans = this.plansSignal.asReadonly();

  // Computed platform statistics
  readonly totalTenantsCount = computed(() => this.tenantsSignal().length);
  readonly activeTenantsCount = computed(() => 
    this.tenantsSignal().filter(t => t.status === TenantStatus.ACTIVE).length
  );
  readonly suspendedTenantsCount = computed(() => 
    this.tenantsSignal().filter(t => t.status === TenantStatus.SUSPENDED).length
  );
  readonly totalPlatformMRR = computed(() => 
    this.tenantsSignal()
      .filter(t => t.status === TenantStatus.ACTIVE)
      .reduce((sum, t) => sum + t.mrr, 0)
  );
  readonly totalPlatformOrders = computed(() => 
    this.tenantsSignal().reduce((sum, t) => sum + t.totalOrders, 0)
  );

  constructor() {
    this.syncFromBackend();
  }

  private async syncFromBackend(): Promise<void> {
    try {
      const res = await fetchWithTimeout(getApiUrl('/tenants'));
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          const mapped: Tenant[] = result.data.map((t: any) => ({
            id: t.id,
            name: t.name,
            businessName: t.businessName || t.name,
            ownerName: t.ownerName || 'Owner',
            email: t.email,
            phone: t.phone,
            status: (t.status as TenantStatus) || TenantStatus.ACTIVE,
            subscriptionPlanId: t.subscriptionPlanId || '33333333-3333-3333-3333-333333333333',
            subscriptionPlanName: t.subscriptionPlanName || 'Standard Plan',
            planTier: (t.planTier as SubscriptionTier) || SubscriptionTier.ENTERPRISE,
            createdAt: t.createdAt || new Date().toISOString(),
            mrr: t.mrr || 0,
            totalOrders: t.totalOrders || 0,
            productCount: t.productCount || 0
          }));
          this.tenantsSignal.set(mapped);
          this.persistTenants(mapped);
        }
      }
    } catch (e) {
      console.warn('Backend /tenants offline, relying on cached data:', e);
    }

    try {
      const planRes = await fetchWithTimeout(getApiUrl('/tenants/plans'));
      if (planRes.ok) {
        const planResult = await planRes.json();
        if (planResult.success && Array.isArray(planResult.data) && planResult.data.length > 0) {
          const mappedPlans: SubscriptionPlan[] = planResult.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            tier: p.tier as SubscriptionTier,
            priceMonthly: p.priceMonthly,
            priceAnnual: p.priceAnnual,
            maxProducts: p.maxProducts,
            maxUsers: p.maxUsers,
            maxOrdersPerMonth: p.maxOrdersPerMonth,
            features: p.features || [],
            isActive: p.active ?? true
          }));
          this.plansSignal.set(mappedPlans);
          this.persistPlans(mappedPlans);
        }
      }
    } catch (e) {
      console.warn('Backend /tenants/plans offline, relying on cached data:', e);
    }
  }

  private loadInitialTenants(): Tenant[] {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(TENANTS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Failed to load tenants from localStorage:', e);
      }
    }
    return INITIAL_TENANTS;
  }

  private persistTenants(tenants: Tenant[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(tenants));
      } catch (e) {
        console.warn('Failed to persist tenants to localStorage:', e);
      }
    }
  }

  private loadInitialPlans(): SubscriptionPlan[] {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(PLANS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Failed to load plans from localStorage:', e);
      }
    }
    return INITIAL_SUBSCRIPTION_PLANS;
  }

  private persistPlans(plans: SubscriptionPlan[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
      } catch (e) {
        console.warn('Failed to persist plans to localStorage:', e);
      }
    }
  }

  getTenantById(id: string): Tenant | undefined {
    return this.tenantsSignal().find(t => t.id === id);
  }

  createTenant(tenantData: Omit<Tenant, 'id' | 'createdAt' | 'totalOrders' | 'productCount'>): Tenant {
    const newTenant: Tenant = {
      ...tenantData,
      id: 'tenant-' + Date.now(),
      createdAt: new Date().toISOString(),
      totalOrders: 0,
      productCount: 0
    };
    this.tenantsSignal.update(tenants => {
      const updated = [newTenant, ...tenants];
      this.persistTenants(updated);
      return updated;
    });

    fetchWithTimeout(getApiUrl('/tenants'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: tenantData.name,
        businessName: tenantData.businessName,
        ownerName: tenantData.ownerName,
        email: tenantData.email,
        phone: tenantData.phone,
        status: tenantData.status,
        mrr: tenantData.mrr,
        subscriptionPlanId: tenantData.subscriptionPlanId
      })
    }).catch(e => console.warn('Async backend tenant sync failed:', e));

    return newTenant;
  }

  updateTenantStatus(tenantId: string, status: TenantStatus): void {
    this.tenantsSignal.update(tenants => {
      const updated = tenants.map(t => t.id === tenantId ? { ...t, status } : t);
      this.persistTenants(updated);
      return updated;
    });

    fetchWithTimeout(getApiUrl(`/tenants/${tenantId}/status`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(e => console.warn('Async backend status update failed:', e));
  }

  updateTenant(tenantId: string, updates: Partial<Tenant>): void {
    this.tenantsSignal.update(tenants => {
      const updated = tenants.map(t => t.id === tenantId ? { ...t, ...updates } : t);
      this.persistTenants(updated);
      return updated;
    });

    fetchWithTimeout(getApiUrl(`/tenants/${tenantId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(e => console.warn('Async backend tenant update failed:', e));
  }

  deleteTenant(tenantId: string): void {
    this.tenantsSignal.update(tenants => {
      const updated = tenants.filter(t => t.id !== tenantId);
      this.persistTenants(updated);
      return updated;
    });

    fetchWithTimeout(getApiUrl(`/tenants/${tenantId}`), {
      method: 'DELETE'
    }).catch(e => console.warn('Async backend tenant deletion failed:', e));
  }

  updatePlan(planId: string, updates: Partial<SubscriptionPlan>): void {
    this.plansSignal.update(plans => {
      const updated = plans.map(p => p.id === planId ? { ...p, ...updates } : p);
      this.persistPlans(updated);
      return updated;
    });

    fetchWithTimeout(getApiUrl(`/tenants/plans/${planId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(e => console.warn('Async backend plan update failed:', e));
  }

  createPlan(planData: Omit<SubscriptionPlan, 'id'>): SubscriptionPlan {
    const newPlan: SubscriptionPlan = {
      ...planData,
      id: 'plan-' + Date.now()
    };
    this.plansSignal.update(plans => {
      const updated = [...plans, newPlan];
      this.persistPlans(updated);
      return updated;
    });

    fetchWithTimeout(getApiUrl('/tenants/plans'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planData)
    }).catch(e => console.warn('Async backend plan creation failed:', e));

    return newPlan;
  }
}
