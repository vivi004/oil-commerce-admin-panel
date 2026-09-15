import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-amber-50 via-slate-50 to-amber-100/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center py-6 px-3 sm:py-12 sm:px-6 lg:px-8">
      <router-outlet></router-outlet>
    </div>
  `
})
export class AuthLayoutComponent {}
