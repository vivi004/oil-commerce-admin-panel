import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/enums/role.enum';
import { TenantService } from '../../core/services/tenant.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      <!-- Mobile Backdrop -->
      <div 
        *ngIf="isMobileSidebarOpen()" 
        class="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        (click)="closeMobileSidebar()"
      ></div>

      <!-- SIDEBAR -->
      <aside 
        [ngClass]="[
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out',
          isSidebarCollapsed() ? 'w-20' : 'w-64',
          isMobileSidebarOpen() ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        ]"
      >
        <!-- Sidebar Brand Header -->
        <div class="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div class="flex items-center gap-3 overflow-hidden">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
              <span class="material-symbols-outlined text-[24px]">oil_barrel</span>
            </div>
            <div *ngIf="!isSidebarCollapsed()" class="leading-tight truncate">
              <span class="font-black text-sm tracking-tight text-slate-900 dark:text-white block truncate">
                {{ currentTenantName() }}
              </span>
              <span class="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {{ isSuperAdmin() ? 'Platform Admin' : 'Commerce ERP' }}
              </span>
            </div>
          </div>

          <button 
            type="button" 
            (click)="toggleSidebarCollapse()" 
            class="hidden lg:flex w-8 h-8 rounded-lg items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <span class="material-symbols-outlined text-[20px]">
              {{ isSidebarCollapsed() ? 'chevron_right' : 'chevron_left' }}
            </span>
          </button>
        </div>

        <!-- Navigation Links -->
        <div class="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 space-y-6">
          <div *ngFor="let section of activeNavSections()">
            <p *ngIf="!isSidebarCollapsed()" class="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {{ section.title }}
            </p>
            <div class="space-y-1">
              <a
                *ngFor="let item of section.items"
                [routerLink]="item.route"
                routerLinkActive="bg-amber-500 text-white shadow-sm shadow-amber-500/20 font-semibold"
                [routerLinkActiveOptions]="{ exact: item.route === '/super-admin/dashboard' || item.route === '/tenant-admin/dashboard' }"
                (click)="closeMobileSidebar()"
                [title]="isSidebarCollapsed() ? item.label : ''"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all group relative"
              >
                <span class="material-symbols-outlined text-[22px] shrink-0 group-hover:scale-105 transition-transform">
                  {{ item.icon }}
                </span>
                <span *ngIf="!isSidebarCollapsed()" class="truncate flex-1">{{ item.label }}</span>
                <span 
                  *ngIf="!isSidebarCollapsed() && item.badge" 
                  [ngClass]="item.badgeColor || 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'"
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                >
                  {{ item.badge }}
                </span>
              </a>
            </div>
          </div>
        </div>

        <!-- Sidebar Footer Tenant Switcher / Status -->
        <div class="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div class="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[18px]">verified</span>
            </div>
            <div *ngIf="!isSidebarCollapsed()" class="truncate text-xs">
              <div class="font-semibold text-slate-800 dark:text-slate-200 truncate">Cold-Pressed ERP</div>
              <div class="text-[10px] text-slate-500 dark:text-slate-400">v2.4.0 • Enterprise</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- MAIN WRAPPER -->
      <div 
        [ngClass]="[
          'flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out',
          isSidebarCollapsed() ? 'lg:pl-20' : 'lg:pl-64'
        ]"
      >
        <!-- TOP HEADER -->
        <header class="h-14 sm:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
          <!-- Left: Mobile Hamburger & Search -->
          <div class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-xl">
            <button 
              type="button" 
              (click)="openMobileSidebar()" 
              class="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
              aria-label="Toggle navigation menu"
            >
              <span class="material-symbols-outlined text-[24px]">menu</span>
            </button>

            <!-- Global Search Bar -->
            <div class="relative w-full max-w-md hidden sm:block">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                search
              </span>
              <input
                type="text"
                placeholder="Search orders, oils, SKUs, batches... (Ctrl+K)"
                class="w-full pl-9 pr-12 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:focus:border-amber-500 transition-all text-slate-900 dark:text-white"
              />
              <kbd class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded bg-white dark:bg-slate-900">
                ⌘K
              </kbd>
            </div>

            <!-- Mobile Compact Brand Title when collapsed -->
            <div class="sm:hidden truncate font-bold text-xs text-slate-800 dark:text-slate-200">
              {{ currentTenantName() }}
            </div>
          </div>

          <!-- Right: Action Icons & User Dropdown -->
          <div class="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <!-- Quick Role Switcher Pill for testing RBAC -->
            <div class="relative">
              <button
                type="button"
                (click)="toggleRoleDropdown()"
                class="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors"
                title="Switch role instantly to test RBAC"
              >
                <span class="material-symbols-outlined text-[16px]">swap_horiz</span>
                <span class="hidden md:inline">Role:</span>
                <span class="hidden sm:inline truncate max-w-[120px]">{{ currentUser()?.role }}</span>
                <span class="sm:hidden font-bold">Role</span>
                <span class="material-symbols-outlined text-[14px]">expand_more</span>
              </button>

              <!-- Role Switch Menu -->
              <div 
                *ngIf="isRoleDropdownOpen()" 
                class="absolute right-0 mt-2 w-64 sm:w-56 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs animate-in zoom-in-95 duration-150"
              >
                <div class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Active Role
                </div>
                <button
                  *ngFor="let role of availableRoles"
                  type="button"
                  (click)="switchRole(role.id)"
                  class="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  [ngClass]="currentUser()?.role === role.id ? 'font-bold text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'"
                >
                  <div class="truncate pr-2">
                    <div class="truncate">{{ role.label }}</div>
                    <div class="text-[10px] text-slate-400 truncate">{{ role.desc }}</div>
                  </div>
                  <span *ngIf="currentUser()?.role === role.id" class="material-symbols-outlined text-[16px] text-amber-500 shrink-0">check</span>
                </button>
              </div>
            </div>

            <!-- Dark Mode Toggle -->
            <button
              type="button"
              (click)="toggleDarkMode()"
              class="w-8 sm:w-9 h-8 sm:h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
              title="Toggle Dark Mode"
            >
              <span class="material-symbols-outlined text-[18px] sm:text-[20px]">
                {{ isDarkMode() ? 'light_mode' : 'dark_mode' }}
              </span>
            </button>

            <!-- Notifications Bell -->
            <div class="relative">
              <button
                type="button"
                (click)="toggleNotifications()"
                class="w-8 sm:w-9 h-8 sm:h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 relative transition-colors"
                title="Notifications"
              >
                <span class="material-symbols-outlined text-[18px] sm:text-[20px]">notifications</span>
                <span class="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900"></span>
              </button>

              <!-- Notifications Drawer -->
              <div 
                *ngIf="isNotificationsOpen()" 
                class="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 text-xs animate-in zoom-in-95 duration-150"
              >
                <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 font-bold">
                  <span>ERP Notifications</span>
                  <span class="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">3 New</span>
                </div>
                <div class="space-y-2">
                  <div class="p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                    <div class="font-semibold text-amber-800 dark:text-amber-300 text-[11px]">Low Stock: Sesame Oil 5L</div>
                    <div class="text-[10px] text-slate-500 mt-0.5">Inventory is down to 8 tins in Warehouse Unit #1</div>
                  </div>
                  <div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                    <div class="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Google Sheet Sync Pending</div>
                    <div class="text-[10px] text-slate-500 mt-0.5">Groundnut Seed mandi price increased by ₹12/Kg</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Profile Info & Logout -->
            <div class="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
              <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-white font-bold flex items-center justify-center text-[10px] sm:text-xs shadow-xs shrink-0">
                {{ userInitials() }}
              </div>
              <div class="hidden md:block text-left text-xs leading-tight">
                <div class="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">{{ currentUser()?.name }}</div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400">{{ currentUser()?.role }}</div>
              </div>
              <button
                type="button"
                (click)="logout()"
                class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                title="Logout"
              >
                <span class="material-symbols-outlined text-[16px] sm:text-[18px]">logout</span>
              </button>
            </div>
          </div>
        </header>

        <!-- ROUTER OUTLET CONTAINER -->
        <main class="flex-1 p-3 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private tenantService = inject(TenantService);
  private router = inject(Router);

  isSidebarCollapsed = signal<boolean>(false);
  isMobileSidebarOpen = signal<boolean>(false);
  isRoleDropdownOpen = signal<boolean>(false);
  isNotificationsOpen = signal<boolean>(false);
  isDarkMode = signal<boolean>(false);

  currentUser = this.authService.currentUser;
  isSuperAdmin = this.authService.isSuperAdmin;

  availableRoles = [
    { id: Role.SUPER_ADMIN, label: 'Super Admin', desc: 'Full Platform & Multi-Tenant Control' },
    { id: Role.TENANT_ADMIN, label: 'Tenant Admin (Nisha)', desc: 'Store, Products, Pricing & Orders' },
    { id: Role.PRODUCT_MANAGER, label: 'Product Manager', desc: 'Catalog, Brands & Categories' },
    { id: Role.INVENTORY_MANAGER, label: 'Warehouse Manager', desc: 'Stock Adjustments & Low Stock' },
    { id: Role.ORDER_MANAGER, label: 'Order Fulfillment', desc: 'Dispatches, Tracking & Invoices' }
  ];

  userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return 'AD';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  });

  currentTenantName = computed(() => {
    if (this.isSuperAdmin()) return 'Platform Overseer';
    return 'Nisha Pure Oils';
  });

  // Navigation menu grouped by role
  activeNavSections = computed<NavSection[]>(() => {
    if (this.isSuperAdmin()) {
      return [
        {
          title: 'Platform Overview',
          items: [
            { label: 'Super Dashboard', route: '/super-admin/dashboard', icon: 'dashboard' },
            { label: 'Tenants & Brands', route: '/super-admin/tenants', icon: 'storefront', badge: 'Active' },
            { label: 'Subscription Plans', route: '/super-admin/subscriptions', icon: 'loyalty' }
          ]
        },
        {
          title: 'Governance & Security',
          items: [
            { label: 'Platform Users & Customers', route: '/super-admin/platform-users', icon: 'manage_accounts' },
            { label: 'Audit Security Logs', route: '/super-admin/audit-logs', icon: 'security' },
            { label: 'Global Commodities', route: '/super-admin/platform-settings', icon: 'tune' },
            { label: 'Platform Analytics', route: '/super-admin/reports', icon: 'monitoring' }
          ]
        },
        {
          title: 'Store Operations',
          items: [
            { label: 'All Customer Orders', route: '/tenant-admin/orders', icon: 'receipt_long', badge: 'Live' },
            { label: 'Registered Customers', route: '/tenant-admin/customers', icon: 'groups' },
            { label: 'Tenant Admin', route: '/tenant-admin/dashboard', icon: 'store', badge: 'Switch' }
          ]
        }
      ];
    } else {
      return [
        {
          title: 'Commerce Center',
          items: [
            { label: 'Dashboard', route: '/tenant-admin/dashboard', icon: 'space_dashboard' },
            { label: 'Orders & Invoices', route: '/tenant-admin/orders', icon: 'receipt_long', badge: 'New' },
            { label: 'Products & SKUs', route: '/tenant-admin/products', icon: 'inventory_2' },
            { label: 'Oil Categories', route: '/tenant-admin/categories', icon: 'category' },
            { label: 'Oil Brands', route: '/tenant-admin/brands', icon: 'sell' }
          ]
        },
        {
          title: 'Stock & Operations',
          items: [
            { label: 'Warehouse & Inventory', route: '/tenant-admin/inventory', icon: 'warehouse', badge: 'Alerts', badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' },
            { label: 'Google Sheet Pricing', route: '/tenant-admin/google-sheet-pricing', icon: 'table_view', badge: 'Sync', badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
            { label: 'Customers & B2B', route: '/tenant-admin/customers', icon: 'groups' },
            { label: 'Payments & Ledger', route: '/tenant-admin/payments', icon: 'payments' },
            { label: 'Reports & Analytics', route: '/tenant-admin/reports', icon: 'bar_chart' }
          ]
        }
      ];
    }
  });

  toggleSidebarCollapse(): void {
    this.isSidebarCollapsed.update(v => !v);
  }

  openMobileSidebar(): void {
    this.isMobileSidebarOpen.set(true);
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen.set(false);
  }

  toggleRoleDropdown(): void {
    this.isRoleDropdownOpen.update(v => !v);
    this.isNotificationsOpen.set(false);
  }

  toggleNotifications(): void {
    this.isNotificationsOpen.update(v => !v);
    this.isRoleDropdownOpen.set(false);
  }

  toggleDarkMode(): void {
    const isDark = !this.isDarkMode();
    this.isDarkMode.set(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  switchRole(role: Role): void {
    this.authService.switchRole(role);
    this.isRoleDropdownOpen.set(false);
    if (role === Role.SUPER_ADMIN) {
      this.router.navigate(['/super-admin/dashboard']);
    } else {
      this.router.navigate(['/tenant-admin/dashboard']);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.isRoleDropdownOpen.set(false);
      this.isNotificationsOpen.set(false);
    }
  }
}
