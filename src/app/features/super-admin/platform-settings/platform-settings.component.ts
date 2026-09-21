import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { fetchWithTimeout, getApiUrl } from '../../../core/utils/api.utils';

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

const PLATFORM_SETTINGS_STORAGE_KEY = 'nisha_admin_platform_settings_v1';

const INITIAL_COMMODITIES: MandiBenchmarkItem[] = [
  { commodity: 'Raw Bold Groundnut Pods (Kadiri-6)', hsnCode: '1202', cropSeason: 'Kharif', mandiBenchmarkRate: 7200, edibleClassification: 'Edible Oilseed', gstBracket: 5, effectiveDate: 'Today', status: 'ACTIVE' },
  { commodity: 'Black Sesame Seeds (Til / Gingelly)', hsnCode: '1207', cropSeason: 'Rabi', mandiBenchmarkRate: 14800, edibleClassification: 'Edible Oilseed', gstBracket: 5, effectiveDate: 'Today', status: 'ACTIVE' },
  { commodity: 'Sun-Dried Copra Halves (Pollachi Grade)', hsnCode: '1203', cropSeason: 'Perennial', mandiBenchmarkRate: 11200, edibleClassification: 'Edible Oilseed', gstBracket: 5, effectiveDate: 'Today', status: 'ACTIVE' },
  { commodity: 'Black Mustard Seeds (Rai / Sarson)', hsnCode: '1205', cropSeason: 'Rabi', mandiBenchmarkRate: 5900, edibleClassification: 'Edible Oilseed', gstBracket: 5, effectiveDate: 'Yesterday', status: 'ACTIVE' },
  { commodity: 'Castor Oil Seeds (Vilakkennai)', hsnCode: '1207', cropSeason: 'Kharif', mandiBenchmarkRate: 6400, edibleClassification: 'Non-Edible / Pooja', gstBracket: 18, effectiveDate: '3 days ago', status: 'ACTIVE' },
  { commodity: 'Mahua Dry Flowers & Kernels (Iluppai)', hsnCode: '1207', cropSeason: 'Forest Gather', mandiBenchmarkRate: 4800, edibleClassification: 'Non-Edible / Pooja', gstBracket: 18, effectiveDate: '1 week ago', status: 'ACTIVE' },
  { commodity: 'Neem Kernel Seeds (Azadirachta Indica)', hsnCode: '1207', cropSeason: 'Summer', mandiBenchmarkRate: 3600, edibleClassification: 'Non-Edible / Pooja', gstBracket: 18, effectiveDate: '1 week ago', status: 'ACTIVE' }
];

@Component({
  selector: 'app-platform-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, BadgeComponent],
  template: `
    <div class="space-y-6 max-w-5xl">
      <!-- SUCCESS BANNER -->
      <div *ngIf="savedMessage()" class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xs">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
          <span>{{ savedMessage() }}</span>
        </div>
        <button (click)="savedMessage.set('')" class="text-emerald-600 hover:text-emerald-800 text-xs">✕</button>
      </div>

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
            <div class="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-[20px]">percent</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">GST Rates & HSN Brackets</h3>
              <p class="text-[11px] text-slate-500">Platform-wide statutory tax configurations for pure oils vs pooja fuels</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Edible Cold-Pressed Oil GST Rate (%)</label>
              <input
                type="number"
                [(ngModel)]="edibleOilGst"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-500"
              />
              <span class="text-[10px] text-slate-400">Standard GST under HSN 1508, 1513 is 5%</span>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Pooja & Lamp Oil GST Rate (%)</label>
              <input
                type="number"
                [(ngModel)]="lampOilGst"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-500"
              />
              <span class="text-[10px] text-slate-400">Non-edible blended lamp oil GST rate is 18%</span>
            </div>
          </div>
        </div>

        <!-- Mandi Google Sheet Synchronizer -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4">
          <div class="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div class="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-[20px]">sync</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Mandi Google Sheet Sync Gateway</h3>
              <p class="text-[11px] text-slate-500">Live endpoint connected to agro market mandi price scrapers</p>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Mandi Feed Spreadsheet URL</label>
              <input
                type="text"
                [(ngModel)]="mandiSheetUrl"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-500 font-mono text-[11px]"
              />
            </div>

            <div class="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="autoSync"
                [(ngModel)]="autoSyncEnabled"
                class="rounded-sm border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <label for="autoSync" class="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                Automatically synchronize tenant margin benchmarks daily at 06:00 AM IST
              </label>
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
  savedMessage = signal<string>('');

  columns: ColumnDef[] = [
    { key: 'commodity', label: 'Commodity & HSN', sortable: true },
    { key: 'edibleClassification', label: 'Classification', sortable: true },
    { key: 'mandiBenchmarkRate', label: 'Mandi Benchmark Rate', sortable: true, align: 'right' },
    { key: 'gstBracket', label: 'GST Bracket', sortable: true, align: 'right' },
    { key: 'effectiveDate', label: 'Effective Date' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions', align: 'right' }
  ];

  commodities = signal<MandiBenchmarkItem[]>(INITIAL_COMMODITIES);

  constructor() {
    this.loadSettings();
    this.syncFromBackend();
  }

  private async syncFromBackend(): Promise<void> {
    try {
      const res = await fetchWithTimeout(getApiUrl('/platform-settings'));
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          if (result.data.edibleOilGst !== undefined) this.edibleOilGst = result.data.edibleOilGst;
          if (result.data.lampOilGst !== undefined) this.lampOilGst = result.data.lampOilGst;
          if (result.data.mandiSheetUrl) this.mandiSheetUrl = result.data.mandiSheetUrl;
          if (result.data.autoSyncEnabled !== undefined) this.autoSyncEnabled = result.data.autoSyncEnabled;
          this.persistSettings();
        }
      }
    } catch (e) {
      console.warn('Backend /platform-settings offline, using cached settings');
    }

    try {
      const mRes = await fetchWithTimeout(getApiUrl('/mandi-benchmarks'));
      if (mRes.ok) {
        const mResult = await mRes.json();
        if (mResult.success && Array.isArray(mResult.data) && mResult.data.length > 0) {
          const mapped: MandiBenchmarkItem[] = mResult.data.map((m: any) => ({
            commodity: m.commodity,
            hsnCode: m.hsnCode,
            cropSeason: m.cropSeason,
            mandiBenchmarkRate: m.mandiBenchmarkRate,
            edibleClassification: m.edibleClassification as any,
            gstBracket: m.gstBracket,
            effectiveDate: m.effectiveDate || 'Today',
            status: (m.status as any) || 'ACTIVE'
          }));
          this.commodities.set(mapped);
          this.persistSettings();
        }
      }
    } catch (e) {
      console.warn('Backend /mandi-benchmarks offline, using cached commodities');
    }
  }

  private loadSettings(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(PLATFORM_SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.edibleOilGst !== undefined) this.edibleOilGst = parsed.edibleOilGst;
        if (parsed.lampOilGst !== undefined) this.lampOilGst = parsed.lampOilGst;
        if (parsed.mandiSheetUrl) this.mandiSheetUrl = parsed.mandiSheetUrl;
        if (parsed.autoSyncEnabled !== undefined) this.autoSyncEnabled = parsed.autoSyncEnabled;
        if (Array.isArray(parsed.commodities) && parsed.commodities.length > 0) {
          this.commodities.set(parsed.commodities);
        }
      }
    } catch (e) {
      console.warn('Failed to load platform settings from localStorage:', e);
    }
  }

  private persistSettings(): void {
    if (typeof window === 'undefined') return;
    try {
      const data = {
        edibleOilGst: this.edibleOilGst,
        lampOilGst: this.lampOilGst,
        mandiSheetUrl: this.mandiSheetUrl,
        autoSyncEnabled: this.autoSyncEnabled,
        commodities: this.commodities()
      };
      localStorage.setItem(PLATFORM_SETTINGS_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to persist platform settings:', e);
    }
  }

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
      this.commodities.update(list => {
        const updated = list.map(item =>
          item.commodity === c.commodity ? { ...item, mandiBenchmarkRate: newRate, effectiveDate: 'Just now' } : item
        );
        return updated;
      });
      this.persistSettings();
      this.savedMessage.set(`Updated Mandi benchmark rate for ${c.commodity} to ₹${newRate}/Qtl`);
      setTimeout(() => this.savedMessage.set(''), 4000);

      fetchWithTimeout(getApiUrl('/mandi-benchmarks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commodity: c.commodity,
          hsnCode: c.hsnCode,
          cropSeason: c.cropSeason,
          mandiBenchmarkRate: newRate,
          edibleClassification: c.edibleClassification,
          gstBracket: c.gstBracket,
          effectiveDate: 'Today',
          status: c.status
        })
      }).catch(e => console.warn('Async Mandi benchmark update failed:', e));
    }
  }

  saveSettings(): void {
    this.persistSettings();
    this.savedMessage.set('Global Platform & Commodity settings updated and saved successfully!');
    setTimeout(() => this.savedMessage.set(''), 4000);

    fetchWithTimeout(getApiUrl('/platform-settings'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        edibleOilGst: this.edibleOilGst,
        lampOilGst: this.lampOilGst,
        mandiSheetUrl: this.mandiSheetUrl,
        autoSyncEnabled: this.autoSyncEnabled
      })
    }).catch(e => console.warn('Async platform settings save failed:', e));
  }
}
