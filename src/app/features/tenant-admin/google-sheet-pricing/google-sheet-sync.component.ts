import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleSheetService } from '../../../core/services/google-sheet.service';
import { LiveSyncService } from '../../../core/services/live-sync.service';
import { SheetDiffItem } from '../../../core/models/app.models';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-google-sheet-sync',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent],
  template: `
    <div class="space-y-6">
      <!-- Header Banner -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Live Seed Mandi Feed</span>
          </div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Google Sheets Pricing & Stock Sync
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sync daily groundnut, sesame, and copra mandi seed fluctuations directly to online packaging prices with two-way diff validation.
          </p>
          <div class="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-400">
            <span>Connected Sheet:</span>
            <a [href]="sheetService.connectedSheetUrl()" target="_blank" class="font-mono text-amber-600 hover:underline truncate max-w-xs sm:max-w-md">
              {{ sheetService.connectedSheetUrl() }}
            </a>
            <button 
              type="button" 
              (click)="isEditingUrl.set(true)" 
              class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-[10px] font-semibold flex items-center gap-1"
            >
              <span class="material-symbols-outlined text-[14px]">edit</span>
              Edit URL
            </button>
          </div>
        </div>

        <div class="flex flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <!-- Sync Live Button -->
          <button
            type="button"
            (click)="syncLive()"
            [disabled]="liveSyncService.isSyncing()"
            class="w-full sm:w-auto justify-center px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-60"
            title="Sync live catalog & products from backend"
          >
            <span class="material-symbols-outlined text-[16px]" [ngClass]="{'animate-spin text-amber-500': liveSyncService.isSyncing()}">sync</span>
            <span>{{ liveSyncService.isSyncing() ? 'Syncing...' : 'Sync Live' }}</span>
          </button>

          <button
            type="button"
            (click)="downloadTemplate()"
            class="w-full sm:w-auto justify-center px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs"
            title="Download CSV template with all active products and columns"
          >
            <span class="material-symbols-outlined text-[18px] text-amber-600">download</span>
            <span>Download CSV Template</span>
          </button>

          <a
            href="https://sheets.new"
            target="_blank"
            class="w-full sm:w-auto justify-center px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-xs"
            title="Create a new Google Sheet directly"
          >
            <span class="material-symbols-outlined text-[18px]">open_in_new</span>
            <span>New Google Sheet</span>
          </a>

          <button
            type="button"
            (click)="refreshFromSheet()"
            [disabled]="sheetService.isSyncing()"
            class="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <span class="material-symbols-outlined text-[18px]" [ngClass]="{ 'animate-spin': sheetService.isSyncing() }">sync</span>
            <span>{{ sheetService.isSyncing() ? 'Polling Mandi Sheet...' : 'Fetch Latest Feed' }}</span>
          </button>

          <button
            type="button"
            (click)="applyChanges()"
            [disabled]="sheetService.approvedCount() === 0"
            class="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-40"
          >
            <span class="material-symbols-outlined text-[18px]">publish</span>
            <span>Apply {{ sheetService.approvedCount() }} Approved Changes</span>
          </button>
        </div>
      </div>

      <!-- URL Edit Banner Modal -->
      <div *ngIf="isEditingUrl()" class="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
        <div class="flex-1 w-full">
          <label class="block text-xs font-bold text-amber-900 dark:text-amber-200 mb-1">
            Google Sheets Document URL
          </label>
          <input
            type="text"
            [(ngModel)]="tempUrl"
            placeholder="https://docs.google.com/spreadsheets/d/.../edit"
            class="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
          />
        </div>
        <div class="flex items-center gap-2 self-end sm:self-auto mt-2 sm:mt-5">
          <button
            type="button"
            (click)="saveUrl()"
            class="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Save Sheet URL
          </button>
          <button
            type="button"
            (click)="isEditingUrl.set(false)"
            class="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl"
          >
            Cancel
          </button>
        </div>
      </div>

      <!-- Quick Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          <span class="text-slate-400">Total Fluctuations Detected:</span>
          <div class="text-xl font-bold text-slate-900 dark:text-white mt-1">{{ sheetService.totalDiffCount() }} items</div>
        </div>
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          <span class="text-slate-400">Approved for Publishing:</span>
          <div class="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{{ sheetService.approvedCount() }} items</div>
        </div>
        <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          <span class="text-slate-400">Last Synced From Sheet:</span>
          <div class="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">{{ sheetService.lastSynced() | date:'mediumTime' }}</div>
        </div>
      </div>

      <!-- Diff Review Table -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div class="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 class="text-sm font-bold text-slate-900 dark:text-white">Price & Inventory Diff Review</h2>
            <p class="text-[11px] text-slate-400">Select checkboxes to confirm price and stock adjustments before pushing live</p>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <button
              type="button"
              (click)="sheetService.selectAll(true)"
              class="text-amber-600 hover:underline font-semibold"
            >
              Select All
            </button>
            <span class="text-slate-300">|</span>
            <button
              type="button"
              (click)="sheetService.selectAll(false)"
              class="text-slate-500 hover:underline font-medium"
            >
              Deselect All
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[700px] text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th class="w-12 px-4 py-3.5 text-center">Approve</th>
                <th class="px-4 py-3.5">Product & SKU</th>
                <th class="px-4 py-3.5">Size</th>
                <th class="px-4 py-3.5">Current Price</th>
                <th class="px-4 py-3.5">Sheet Price</th>
                <th class="px-4 py-3.5">Price Delta</th>
                <th class="px-4 py-3.5">Stock Delta</th>
                <th class="px-4 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
              <tr *ngFor="let item of sheetService.diffItems()" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <!-- Checkbox -->
                <td class="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    [checked]="item.isApproved"
                    (change)="sheetService.toggleApproval(item.sku)"
                    class="rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                </td>

                <!-- Product -->
                <td class="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                  <div>{{ item.productName }}</div>
                  <div class="text-[10px] text-slate-400 font-mono">{{ item.sku }}</div>
                </td>

                <!-- Size -->
                <td class="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                  <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {{ item.variantSize }}
                  </span>
                </td>

                <!-- Current Price -->
                <td class="px-4 py-3 text-slate-600 dark:text-slate-400">
                  ₹{{ item.currentSellingPrice }}
                  <span class="text-[10px] text-slate-400 line-through ml-1">(MRP ₹{{ item.currentMrp }})</span>
                </td>

                <!-- New Sheet Price -->
                <td class="px-4 py-3 font-bold text-slate-900 dark:text-white">
                  ₹{{ item.newSellingPrice }}
                  <span class="text-[10px] text-slate-400 ml-1">(MRP ₹{{ item.newMrp }})</span>
                </td>

                <!-- Delta -->
                <td class="px-4 py-3 font-bold" [ngClass]="item.priceDelta > 0 ? 'text-emerald-600' : 'text-rose-600'">
                  <div class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px]">
                      {{ item.priceDelta > 0 ? 'arrow_upward' : 'arrow_downward' }}
                    </span>
                    <span>₹{{ Math.abs(item.priceDelta) }}</span>
                  </div>
                </td>

                <!-- Stock Delta -->
                <td class="px-4 py-3 text-slate-700 dark:text-slate-300">
                  {{ item.currentStock }} → <strong>{{ item.newStock }}</strong>
                  <span class="text-[10px] ml-1 font-semibold" [ngClass]="item.stockDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                    ({{ item.stockDelta >= 0 ? '+' : '' }}{{ item.stockDelta }})
                  </span>
                </td>

                <!-- Approval Status Badge -->
                <td class="px-4 py-3 text-right">
                  <app-badge [variant]="item.isApproved ? 'emerald' : 'slate'" [dot]="true">
                    {{ item.isApproved ? 'Approved' : 'Pending' }}
                  </app-badge>
                </td>
              </tr>

              <!-- Empty State -->
              <tr *ngIf="sheetService.totalDiffCount() === 0">
                <td colspan="8" class="py-12 text-center text-xs text-slate-400">
                  <div class="flex flex-col items-center justify-center space-y-1">
                    <span class="material-symbols-outlined text-4xl text-emerald-500">task_alt</span>
                    <p class="font-bold text-slate-700 dark:text-slate-300">All prices and stock levels are 100% in sync!</p>
                    <p class="text-[11px] text-slate-400">No pending diffs from the Google Sheet feed.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class GoogleSheetSyncComponent {
  sheetService = inject(GoogleSheetService);
  readonly liveSyncService = inject(LiveSyncService);
  Math = Math;
  isEditingUrl = signal<boolean>(false);
  tempUrl = '';

  async syncLive(): Promise<void> {
    await this.liveSyncService.syncCatalog();
  }

  constructor() {
    this.tempUrl = this.sheetService.connectedSheetUrl();
  }

  saveUrl(): void {
    if (this.tempUrl && this.tempUrl.trim().length > 0) {
      this.sheetService.updateSheetUrl(this.tempUrl.trim());
      this.isEditingUrl.set(false);
    }
  }

  downloadTemplate(): void {
    const csvUrl = '/google-sheets-pricing-template.csv';
    const link = document.createElement('a');
    link.href = csvUrl;
    link.setAttribute('download', 'oil-commerce-pricing-inventory-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  refreshFromSheet(): void {
    this.sheetService.fetchFromSheet().then(() => {
      alert('Fetched latest daily seed pricing differences from Google Sheets.');
    });
  }

  applyChanges(): void {
    const { appliedCount } = this.sheetService.applyApprovedChanges();
    alert(`Successfully synced ${appliedCount} oil variant price & inventory updates to the live store catalog!`);
  }
}
