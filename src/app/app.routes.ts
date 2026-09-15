import { Routes } from '@angular/router';
import { authGuard, superAdminGuard, tenantAdminGuard } from './core/guards/auth.guard';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';

export const routes: Routes = [
  // Auth Layout
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },

  // Super Admin Routes (RBAC Protected)
  {
    path: 'super-admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, superAdminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/super-admin/dashboard/super-dashboard.component').then(m => m.SuperDashboardComponent)
      },
      {
        path: 'tenants',
        loadComponent: () => import('./features/super-admin/tenants/tenant-list.component').then(m => m.TenantListComponent)
      },
      {
        path: 'subscriptions',
        loadComponent: () => import('./features/super-admin/subscriptions/subscription-plans.component').then(m => m.SubscriptionPlansComponent)
      },
      {
        path: 'platform-settings',
        loadComponent: () => import('./features/super-admin/platform-settings/platform-settings.component').then(m => m.PlatformSettingsComponent)
      },
      {
        path: 'platform-users',
        loadComponent: () => import('./features/super-admin/platform-users/platform-users.component').then(m => m.PlatformUsersComponent)
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./features/super-admin/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/super-admin/reports/super-reports.component').then(m => m.SuperReportsComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // Tenant Admin Routes (RBAC Protected for Nisha Pure Oils & Brand Staff)
  {
    path: 'tenant-admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, tenantAdminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/tenant-admin/dashboard/tenant-dashboard.component').then(m => m.TenantDashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./features/tenant-admin/products/product-list.component').then(m => m.ProductListComponent)
      },
      {
        path: 'products/new',
        loadComponent: () => import('./features/tenant-admin/products/product-form.component').then(m => m.ProductFormComponent)
      },
      {
        path: 'products/edit/:id',
        loadComponent: () => import('./features/tenant-admin/products/product-form.component').then(m => m.ProductFormComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/tenant-admin/categories/category-list.component').then(m => m.CategoryListComponent)
      },
      {
        path: 'brands',
        loadComponent: () => import('./features/tenant-admin/brands/brand-list.component').then(m => m.BrandListComponent)
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/tenant-admin/inventory/inventory-management.component').then(m => m.InventoryManagementComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/tenant-admin/orders/order-list.component').then(m => m.OrderListComponent)
      },
      {
        path: 'customers',
        loadComponent: () => import('./features/tenant-admin/customers/customer-list.component').then(m => m.CustomerListComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./features/tenant-admin/payments/payment-list.component').then(m => m.PaymentListComponent)
      },
      {
        path: 'google-sheet-pricing',
        loadComponent: () => import('./features/tenant-admin/google-sheet-pricing/google-sheet-sync.component').then(m => m.GoogleSheetSyncComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/tenant-admin/reports/tenant-reports.component').then(m => m.TenantReportsComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // Root redirect
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },

  // Wildcard
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
