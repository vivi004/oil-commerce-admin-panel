import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/enums/role.enum';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="w-full sm:mx-auto sm:max-w-md px-2 sm:px-4">
      <!-- Brand Logo & Header -->
      <div class="text-center mb-6 sm:mb-8">
        <div class="inline-flex items-center justify-center w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/30 mb-3 sm:mb-4">
          <span class="material-symbols-outlined text-[28px] sm:text-[34px]">oil_barrel</span>
        </div>
        <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Nisha Pure Oils ERP
        </h2>
        <p class="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Enterprise Multi-Tenant Admin & Cold-Pressed Oil Commerce
        </p>
      </div>

      <!-- Card Container -->
      <div class="bg-white dark:bg-slate-900 py-6 sm:py-8 px-4 sm:px-8 md:px-10 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-800">
        <!-- Error Alert -->
        <div *ngIf="errorMessage()" class="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px]">error</span>
          <span>{{ errorMessage() }}</span>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <!-- Email Field -->
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                mail
              </span>
              <input
                type="email"
                formControlName="email"
                placeholder="name@pureoils.com"
                class="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-900 dark:text-white"
              />
            </div>
            <div *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched" class="text-xs text-rose-500 mt-1">
              Valid email is required.
            </div>
          </div>

          <!-- Password Field -->
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                lock
              </span>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                placeholder="••••••••"
                class="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-900 dark:text-white"
              />
              <button
                type="button"
                (click)="showPassword.set(!showPassword())"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <span class="material-symbols-outlined text-[18px]">
                  {{ showPassword() ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
          </div>

          <!-- Remember & Forgot -->
          <div class="flex items-center justify-between text-xs pt-1">
            <label class="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
              <input type="checkbox" formControlName="rememberMe" class="rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500 dark:border-slate-700" />
              <span>Remember this device</span>
            </label>
            <a href="javascript:void(0)" class="font-medium text-amber-600 hover:text-amber-500">Forgot password?</a>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="isLoading()"
            class="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <span *ngIf="isLoading()" class="animate-spin material-symbols-outlined text-[18px]">progress_activity</span>
            <span>{{ isLoading() ? 'Signing in...' : 'Sign In to Portal' }}</span>
          </button>
        </form>

        <!-- Fast Role Switcher Demo Box -->
        <div class="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center mb-3">
            Quick 1-Click Role Logins (Demo RBAC)
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              (click)="quickLogin(Role.SUPER_ADMIN)"
              class="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-950/40 text-left transition-colors"
            >
              <div class="font-bold text-xs text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">shield_person</span>
                Super Admin
              </div>
              <div class="text-[10px] text-slate-500 mt-0.5">Full multi-tenant platform</div>
            </button>

            <button
              type="button"
              (click)="quickLogin(Role.TENANT_ADMIN)"
              class="p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-left transition-colors"
            >
              <div class="font-bold text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">store</span>
                Tenant Admin
              </div>
              <div class="text-[10px] text-slate-500 mt-0.5">Nisha Pure Oils store</div>
            </button>

            <button
              type="button"
              (click)="quickLogin(Role.INVENTORY_MANAGER)"
              class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 text-left transition-colors"
            >
              <div class="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">warehouse</span>
                Warehouse Mgr
              </div>
              <div class="text-[10px] text-slate-500 mt-0.5">Stock & adjustments</div>
            </button>

            <button
              type="button"
              (click)="quickLogin(Role.ORDER_MANAGER)"
              class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 text-left transition-colors"
            >
              <div class="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">local_shipping</span>
                Fulfillment Mgr
              </div>
              <div class="text-[10px] text-slate-500 mt-0.5">Order dispatches</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly Role = Role;
  showPassword = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  loginForm: FormGroup = this.fb.group({
    email: ['admin@nishapureoils.com', [Validators.required, Validators.email]],
    password: ['Admin@123', [Validators.required, Validators.minLength(4)]],
    rememberMe: [true]
  });

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.value;
    const success = await this.authService.login(email, password);

    if (success) {
      this.redirectByRole();
    } else {
      this.errorMessage.set('Invalid email or password. Use demo quick-login below or admin@nishapureoils.com / Admin@123');
      this.isLoading.set(false);
    }
  }

  async quickLogin(role: Role): Promise<void> {
    const roleCredentials: Record<Role, { email: string; password: string }> = {
      [Role.SUPER_ADMIN]: { email: 'superadmin@nishapureoils.com', password: 'Admin@123' },
      [Role.TENANT_ADMIN]: { email: 'admin@nishapureoils.com', password: 'Admin@123' },
      [Role.INVENTORY_MANAGER]: { email: 'inventory@nishapureoils.com', password: 'Admin@123' },
      [Role.ORDER_MANAGER]: { email: 'orders@nishapureoils.com', password: 'Admin@123' },
      [Role.PRODUCT_MANAGER]: { email: 'catalog@nishapureoils.com', password: 'Admin@123' },
      [Role.ACCOUNTANT]: { email: 'accounts@nishapureoils.com', password: 'Admin@123' },
      [Role.CUSTOMER_SUPPORT]: { email: 'support@nishapureoils.com', password: 'Admin@123' }
    };

    const cred = roleCredentials[role] || { email: 'admin@nishapureoils.com', password: 'Admin@123' };
    this.loginForm.patchValue({
      email: cred.email,
      password: cred.password
    });

    await this.onSubmit();
  }

  private redirectByRole(): void {
    const user = this.authService.currentUser();
    if (user?.role === Role.SUPER_ADMIN) {
      this.router.navigate(['/super-admin/dashboard']);
    } else {
      this.router.navigate(['/tenant-admin/dashboard']);
    }
  }
}
