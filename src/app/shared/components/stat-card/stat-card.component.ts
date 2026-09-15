import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all duration-200">
      <div class="flex items-start justify-between">
        <div class="space-y-1">
          <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ title }}</p>
          <div class="flex items-baseline gap-2">
            <h3 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ value }}</h3>
            <span *ngIf="unit" class="text-sm font-medium text-slate-500">{{ unit }}</span>
          </div>
        </div>

        <div [ngClass]="['w-11 h-11 rounded-lg flex items-center justify-center text-xl shrink-0', iconBgClass, iconTextClass]">
          <span class="material-symbols-outlined text-[24px]">{{ icon }}</span>
        </div>
      </div>

      <div *ngIf="trendText || subtitle" class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
        <div *ngIf="trendText" class="flex items-center gap-1 font-medium" [ngClass]="isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
          <span class="material-symbols-outlined text-[16px]">{{ isPositive ? 'trending_up' : 'trending_down' }}</span>
          <span>{{ trendText }}</span>
        </div>
        <span *ngIf="subtitle" class="text-slate-500 dark:text-slate-400">{{ subtitle }}</span>
      </div>
    </div>
  `
})
export class StatCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() unit?: string;
  @Input() icon: string = 'analytics';
  @Input() iconBgClass: string = 'bg-amber-50 dark:bg-amber-950/50';
  @Input() iconTextClass: string = 'text-amber-600 dark:text-amber-400';
  @Input() trendText?: string;
  @Input() isPositive: boolean = true;
  @Input() subtitle?: string;
}
