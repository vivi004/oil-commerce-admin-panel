import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-platform-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-4xl">
      <div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Global Platform & Commodity Settings</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400">Configure multi-tenant defaults, edible oil GST brackets, Mandi price feed sync, and notification gateways.</p>
      </div>

      <div class="space-y-6">
        <!-- Oil Commodity & Tax Settings -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4">
          <div class="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div class="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-[20px]">percent</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Taxation & Mandi Regulations</h3>
              <p class="text-[11px] text-slate-500">Default GST rules for cold-pressed oils in India (HSN 1508 / 1513 / 1515)</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Standard Edible Oil GST Rate (%)</label>
              <input type="number" [(ngModel)]="edibleOilGst" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
              <p class="text-[10px] text-slate-400 mt-1">Applicable to Groundnut, Sesame, Coconut & Mustard oils</p>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Puja / Non-Edible Oil GST Rate (%)</label>
              <input type="number" [(ngModel)]="lampOilGst" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
              <p class="text-[10px] text-slate-400 mt-1">Applicable to Lamp Oil, Neem Oil & Mahua industrial oil</p>
            </div>
          </div>
        </div>

        <!-- Google Sheet API & Commodity Sync Settings -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4">
          <div class="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div class="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-[20px]">sync_alt</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Daily Seed Market Feed (Google Sheets)</h3>
              <p class="text-[11px] text-slate-500">Automated seed price polling interval for tenant retail margin recalculations</p>
            </div>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mandi Pricing Webhook URL</label>
              <input type="text" [(ngModel)]="mandiSheetUrl" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono" />
            </div>
            <div class="flex items-center gap-3">
              <input type="checkbox" id="autoSync" [(ngModel)]="autoSyncEnabled" class="rounded-sm border-slate-300 text-purple-600 focus:ring-purple-500" />
              <label for="autoSync" class="text-slate-700 dark:text-slate-300">Auto-sync daily prices every morning at 09:00 AM IST</label>
            </div>
          </div>
        </div>

        <!-- SMS & WhatsApp Delivery Updates -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4">
          <div class="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div class="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-[20px]">chat</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Communications & Customer Dispatch Notifications</h3>
              <p class="text-[11px] text-slate-500">Send cold-pressed oil batch dispatches & tracking URLs to customers</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">SMS DLT Entity ID</label>
              <input type="text" [(ngModel)]="dltEntityId" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">WhatsApp Business API Phone</label>
              <input type="text" [(ngModel)]="whatsappPhone" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
            </div>
          </div>
        </div>

        <div class="flex justify-end w-full">
          <button
            type="button"
            (click)="saveSettings()"
            class="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/20 transition-colors flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">save</span>
            <span>Save Global Platform Settings</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class PlatformSettingsComponent {
  edibleOilGst: number = 5;
  lampOilGst: number = 18;
  mandiSheetUrl: string = 'https://docs.google.com/spreadsheets/d/1XyZ-SeedMarket-DailyPriceSync-2026/feed';
  autoSyncEnabled: boolean = true;
  dltEntityId: string = 'DLT-110294819002';
  whatsappPhone: string = '+91 98421 55000';

  saveSettings(): void {
    alert('Global Platform & Commodity settings updated successfully!');
  }
}
