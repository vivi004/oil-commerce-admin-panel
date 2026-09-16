import { Injectable, signal, computed } from '@angular/core';
import { Tenant, SubscriptionPlan } from '../models/app.models';
import { TenantStatus, SubscriptionTier } from '../enums/app.enums';
import { INITIAL_TENANTS, INITIAL_SUBSCRIPTION_PLANS } from './mock-data';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private tenantsSignal = signal<Tenant[]>(INITIAL_TENANTS);
  private plansSignal = signal<SubscriptionPlan[]>(INITIAL_SUBSCRIPTION_PLANS);

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
    this.tenantsSignal.update(tenants => [newTenant, ...tenants]);
    return newTenant;
  }

  updateTenantStatus(tenantId: string, status: TenantStatus): void {
    this.tenantsSignal.update(tenants =>
      tenants.map(t => t.id === tenantId ? { ...t, status } : t)
    );
  }

  updateTenant(tenantId: string, updates: Partial<Tenant>): void {
    this.tenantsSignal.update(tenants =>
      tenants.map(t => t.id === tenantId ? { ...t, ...updates } : t)
    );
  }

  deleteTenant(tenantId: string): void {
    this.tenantsSignal.update(tenants => tenants.filter(t => t.id !== tenantId));
  }

  updatePlan(planId: string, updates: Partial<SubscriptionPlan>): void {
    this.plansSignal.update(plans =>
      plans.map(p => p.id === planId ? { ...p, ...updates } : p)
    );
  }

  createPlan(planData: Omit<SubscriptionPlan, 'id'>): SubscriptionPlan {
    const newPlan: SubscriptionPlan = {
      ...planData,
      id: 'plan-' + Date.now()
    };
    this.plansSignal.update(plans => [...plans, newPlan]);
    return newPlan;
  }
}

