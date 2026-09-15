import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/app.models';
import { Role } from '../enums/role.enum';
import { fetchWithTimeout, getApiUrl } from '../utils/api.utils';

const STORAGE_KEY = 'nisha_admin_user';

export const DEMO_USERS: Record<Role, User> = {
  [Role.SUPER_ADMIN]: {
    id: 'usr-super-1',
    name: 'Gowtham Raj (Platform Admin)',
    email: 'superadmin@nishapureoils.com',
    role: Role.SUPER_ADMIN,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    phone: '+91 94432 10001',
    lastLoginAt: 'Just now'
  },
  [Role.TENANT_ADMIN]: {
    id: 'usr-tenant-1',
    name: 'Kaviarasu M (Mill Director)',
    email: 'admin@nishapureoils.com',
    role: Role.TENANT_ADMIN,
    tenantId: 'tenant-nisha-1',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    phone: '+91 98421 88990',
    lastLoginAt: 'Just now'
  },
  [Role.PRODUCT_MANAGER]: {
    id: 'usr-prod-1',
    name: 'Senthil Nathan (Catalog Manager)',
    email: 'catalog@nishapureoils.com',
    role: Role.PRODUCT_MANAGER,
    tenantId: 'tenant-nisha-1',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    phone: '+91 98421 66778',
    lastLoginAt: '30 mins ago'
  },
  [Role.INVENTORY_MANAGER]: {
    id: 'usr-inv-1',
    name: 'Muruganathan S (Inventory Head)',
    email: 'inventory@nishapureoils.com',
    role: Role.INVENTORY_MANAGER,
    tenantId: 'tenant-nisha-1',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    phone: '+91 98421 55667',
    lastLoginAt: '1 hour ago'
  },
  [Role.ORDER_MANAGER]: {
    id: 'usr-ord-1',
    name: 'Selvi Anand (Fulfillment Lead)',
    email: 'orders@nishapureoils.com',
    role: Role.ORDER_MANAGER,
    tenantId: 'tenant-nisha-1',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    phone: '+91 94432 77889',
    lastLoginAt: '2 hours ago'
  },
  [Role.ACCOUNTANT]: {
    id: 'usr-acc-1',
    name: 'Ramanathan C (Accounts & GST)',
    email: 'accounts@nishapureoils.com',
    role: Role.ACCOUNTANT,
    tenantId: 'tenant-nisha-1',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    phone: '+91 98421 33445',
    lastLoginAt: 'Yesterday'
  },
  [Role.CUSTOMER_SUPPORT]: {
    id: 'usr-sup-1',
    name: 'Priyanka D (Support Desk)',
    email: 'support@nishapureoils.com',
    role: Role.CUSTOMER_SUPPORT,
    tenantId: 'tenant-nisha-1',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    phone: '+91 94432 22334',
    lastLoginAt: '3 hours ago'
  }
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly currentUserSignal = signal<User | null>(this.loadUserFromStorage());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  readonly userRole = computed(() => this.currentUserSignal()?.role ?? null);
  readonly isSuperAdmin = computed(() => this.currentUserSignal()?.role === Role.SUPER_ADMIN);
  readonly isTenantAdmin = computed(() => this.currentUserSignal()?.role === Role.TENANT_ADMIN);

  constructor(private router: Router) {}

  async login(roleOrEmail: Role | string, password?: string): Promise<boolean> {
    if (Object.values(Role).includes(roleOrEmail as Role)) {
      const user = DEMO_USERS[roleOrEmail as Role] || DEMO_USERS[Role.TENANT_ADMIN];
      this.currentUserSignal.set(user);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } catch {}

      // Acquire backend API token in background without blocking login
      const backendEmail = (roleOrEmail === Role.SUPER_ADMIN) ? 'admin@oilcommerce.in' : 'admin@nishapureoils.com';
      fetchWithTimeout(getApiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: backendEmail, password: 'Admin@123' })
      }, environment.apiTimeout).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.accessToken) {
            localStorage.setItem('nisha_admin_token', data.data.accessToken);
          }
        }
      }).catch(() => {
        // Backend offline, keep local demo mode
      });

      return true;
    }

    if (typeof roleOrEmail === 'string') {
      const email = roleOrEmail.trim();
      // Try backend authentication with quick timeout to prevent long UI freeze if backend is offline
      if (password) {
        try {
          const response = await fetchWithTimeout(getApiUrl('/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          }, environment.apiTimeout);

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              const apiUser = result.data.user;
              const isSuper = apiUser.role === 'SUPER_ADMIN';
              const matchedRole = isSuper ? Role.SUPER_ADMIN : Role.TENANT_ADMIN;
              const user: User = {
                id: apiUser.id,
                name: `${apiUser.firstName} ${apiUser.lastName}`,
                email: apiUser.email,
                role: matchedRole,
                avatar: apiUser.avatar || (isSuper ? DEMO_USERS[Role.SUPER_ADMIN].avatar : DEMO_USERS[Role.TENANT_ADMIN].avatar),
                phone: apiUser.phone || '+91 94432 10001',
                lastLoginAt: 'Just now'
              };
              this.currentUserSignal.set(user);
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
                localStorage.setItem('nisha_admin_token', result.data.accessToken);
              } catch {}
              return true;
            }
          }
        } catch (e) {
          console.warn('Backend service offline or unreachable on port 8080. Proceeding with local admin session...');
        }
      }

      // Fallback matching for local admin / demo session
      const emailLower = email.toLowerCase();
      let matchedRole: Role = Role.TENANT_ADMIN;
      if (emailLower.includes('super') || emailLower === 'superadmin@nishapureoils.com' || emailLower === 'admin@oilcommerce.in') {
        matchedRole = Role.SUPER_ADMIN;
      } else if (emailLower.includes('inv') || emailLower.includes('warehouse')) {
        matchedRole = Role.INVENTORY_MANAGER;
      } else if (emailLower.includes('order')) {
        matchedRole = Role.ORDER_MANAGER;
      } else {
        matchedRole = Role.TENANT_ADMIN;
      }

      const baseUser = DEMO_USERS[matchedRole] || DEMO_USERS[Role.TENANT_ADMIN];
      const usernamePart = email.split('@')[0];
      const displayName = usernamePart.toLowerCase() === 'admin'
        ? baseUser.name
        : usernamePart.charAt(0).toUpperCase() + usernamePart.slice(1);

      const user: User = {
        ...baseUser,
        id: `usr-${usernamePart}`,
        name: displayName,
        email: email
      };

      this.currentUserSignal.set(user);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } catch {}
      return true;
    }

    return false;
  }

  logout(): void {
    this.currentUserSignal.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('nisha_admin_token');
    } catch {}
    this.router.navigate(['/auth/login']);
  }

  switchRole(role: Role): void {
    this.login(role);
  }

  private loadUserFromStorage(): User | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    // Default to TENANT_ADMIN for immediate rich ERP demo
    return DEMO_USERS[Role.TENANT_ADMIN];
  }
}
