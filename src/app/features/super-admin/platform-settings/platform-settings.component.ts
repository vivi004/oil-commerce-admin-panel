import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

interface MandiBenchmarkItem {
  commodity: string;
  hsnCode: string;
  cropSeason: string;
  mandiBenchmarkRate: number; // ₹ per Quintal (100Kg)
  edibleClassification: 'Edible Oilseed' | 'Non-Edible / Pooja' | 'Agro Feed';
  gstBracket: number;
  effectiveDate: string;
  status: 'ACTIVE' | 'FLAGGED';
}

@Component({
  selector: 'app-platform-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, BadgeComponent],
  template: `
    <div class="space-y-6 max-w-5xl">
      <div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Global Platform & Commodity Benchmarks</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400">Configure multi-tenant defaults, edible oil GST brackets, Mandi seed price benchmarks, and notification gateways.</p>
      </div>

      <!-- COMMODITY BENCHMARK MANDI PRICING TABLE -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-[20px]">agriculture</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Daily Mandi Raw Seed Benchmarks</h3>
              <p class="text-[11px] text-slate-500">Benchmark procurement baseline rates per quintal (100Kg) for calculating tenant oil yields</p>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60 self-start sm:self-auto">
            Updated Today: 08:30 AM IST
          </span>
        </div>

        <app-data-table
          [columns]="columns"
          [totalCount]="filteredCommodities().length"
          [pageSize]="10"
          searchPlaceholder="Search commodity or HSN code..."
          (search)="onSearch($event)"
        >
          <ng-container table-rows>
            <tr *ngFor="let c of filteredCommodities()" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
              <td class="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                <div class="text-xs font-bold">{{ c.commodity }}</div>
                <div class="text-[10px] text-slate-400 font-mono">HSN: {{ c.hsnCode }} • Season: {{ c.cropSeason }}</div>
              </td>

              <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                {{ c.edibleClassification }}
              </td>

              <td class="px-4 py-3 text-right font-black text-slate-900 dark:text-white text-xs">
                ₹{{ c.mandiBenchmarkRate.toLocaleString() }}
                <span class="text-[10px] text-slate-400 font-normal">/Qtl</span>
              </td>

              <td class="px-4 py-3 text-right font-semibold text-xs text-slate-700 dark:text-slate-300">
                {{ c.gstBracket }}% GST
              </td>

              <td class="px-4 py-3 text-xs text-slate-500">
                {{ c.effectiveDate }}
              </td>

              <td class="px-4 py-3">
                <app-badge [variant]="c.status === 'ACTIVE' ? 'emerald' : 'amber'" [dot]="true">
                  {{ c.status }}
                </app-badge>
              </td>

              <td class="px-4 py-3 text-right">
                <button
                  type="button"
                  (click)="adjustBenchmarkRate(c)"
                  class="px-2.5 py-1 rounded-lg text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-xs font-semibold border border-purple-200/60 dark:border-purple-800/40 transition-colors"
                >
                  Adjust Rate
                </button>
              </td>
            </tr>
          </ng-container>
        </app-data-table>
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
              <input type="number" [(ngModel)]="edibleOilGst" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold" />
              <p class="text-[10px] text-slate-400 mt-1">Applicable to Groundnut, Sesame, Coconut & Mustard oils</p>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Puja / Non-Edible Oil GST Rate (%)</label>
              <input type="number" [(ngModel)]="lampOilGst" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold" />
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
  searchQuery = signal<string>('');

  columns: ColumnDef[] = [
    { key: 'commodity', label: 'Commodity & HSN', sortable: true },
    { key: 'edibleClassification', label: 'Classification', sortable: true },
    { key: 'mandiBenchmarkRate', label: 'Mandi Benchmark Rate', sortable: true, align: 'right' },
    { key: 'gstBracket', label: 'GST Bracket', sortable: true, align: 'right' },
    { key: 'effectiveDate', label: 'Effective Date' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions', align: 'right' }
  ];

  commodities = signal<MandiBenchmarkItem[]>([
    { commodity: 'Raw Bold Groundnut Pods (Kadiri-6)', hsnCode: '1202', cropSeason: 'Kharif', mandiBenchmarkRate: 7200, edibleClassification: 'Edible Oilseed', gstBracket: 5, effectiveDate: 'Today', status: 'ACTIVE' },
    { commodity: 'Black Sesame Seeds (Til / Gingelly)', hsnCode: '1207', cropSeason: 'Rabi', mandiBenchmarkRate: 14800, edibleClassification: 'Edible Oilseed', gstBracket: 5, effectiveDate: 'Today', status: 'ACTIVE' },
    { commodity: 'Sun-Dried Copra Halves (Pollachi Grade)', hsnCode: '1203', cropSeason: 'Perennial', mandiBenchmarkRate: 11200, edibleClassification: 'Edible Oilseed', gstBracket: 5, effectiveDate: 'Today', status: 'ACTIVE' },
    { commodity: 'Black Mustard Seeds (Rai / Sarson)', hsnCode: '1205', cropSeason: 'Rabi', mandiBenchmarkRate: 5900, edibleClassification: 'Edible Oilseed', gstBracket: 5, effectiveDate: 'Yesterday', status: 'ACTIVE' },
    { commodity: 'Castor Oil Seeds (Vilakkennai)', hsnCode: '1207', cropSeason: 'Kharif', mandiBenchmarkRate: 6400, edibleClassification: 'Non-Edible / Pooja', gstBracket: 18, effectiveDate: '3 days ago', status: 'ACTIVE' },
    { commodity: 'Mahua Dry Flowers & Kernels (Iluppai)', hsnCode: '1207', cropSeason: 'Forest Gather', mandiBenchmarkRate: 4800, edibleClassification: 'Non-Edible / Pooja', gstBracket: 18, effectiveDate: '1 week ago', status: 'ACTIVE' },
    { commodity: 'Neem Kernel Seeds (Azadirachta Indica)', hsnCode: '1207', cropSeason: 'Summer', mandiBenchmarkRate: 3600, edibleClassification: 'Non-Edible / Pooja', gstBracket: 18, effectiveDate: '1 week ago', status: 'ACTIVE' }
  ]);

  filteredCommodities = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.commodities();
    return this.commodities().filter(c =>
      c.commodity.toLowerCase().includes(q) ||
      c.hsnCode.toLowerCase().includes(q) ||
      c.edibleClassification.toLowerCase().includes(q)
    );
  });

  onSearch(q: string): void {
    this.searchQuery.set(q);
  }

  adjustBenchmarkRate(c: MandiBenchmarkItem): void {
    const newRateStr = prompt(`Enter new Mandi benchmark rate per quintal for ${c.commodity}:`, String(c.mandiBenchmarkRate));
    if (newRateStr && !isNaN(Number(newRateStr))) {
      const newRate = Number(newRateStr);
      this.commodities.update(list => list.map(item =>
        item.commodity === c.commodity ? { ...item, mandiBenchmarkRate: newRate, effectiveDate: 'Just now' } : item
      ));
    }
  }

  saveSettings(): void {
    alert('Global Platform & Commodity settings updated successfully!');
  }
}
