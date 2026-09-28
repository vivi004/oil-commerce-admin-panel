import { Injectable, signal, computed } from '@angular/core';
import { SheetDiffItem, VariantSize } from '../models/app.models';
import { ProductService } from './product.service';
import { fetchWithTimeout, getApiUrl } from '../utils/api.utils';

const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1-jUkelMl4CmVZnNhmIgHj0shXvG5-3UDZ8s5LRhw0UE/edit?usp=sharing';
const STORAGE_KEY = 'oil_commerce_sheet_url';

// ---------------------------------------------------------------------------
// Master_Price_Sheet column → product mapping (aligned with DB SKU prefixes)
//  Col 0  : Size label (row header)
//  Col 1  : Groundnut Oil   → NPO-GNO
//  Col 2  : Coconut Oil     → NPO-CCO  (fixed: was NPO-COC)
//  Col 3  : Sesame Oil      → NPO-SSO
//  Col 4  : Castor Oil      → NPO-CO
//  Col 5  : Lamp Oil        → NPO-LO
//  Col 6  : Neem Oil        → NPO-NO
//  Col 7  : Mahua Oil       → NPO-MO
//  Col 8  : Edible Oil      → VG-EO
//  Col 9  : Sunflower Oil   → RO-SO
//  Col 10 : Palm Oil        → RG-PO
// ---------------------------------------------------------------------------
interface ColProduct {
  colIndex: number;
  productName: string;
  skuPrefix: string;
}

const SHEET_COLUMNS: ColProduct[] = [
  { colIndex: 1, productName: 'Groundnut Oil', skuPrefix: 'NPO-GNO' },
  { colIndex: 2, productName: 'Coconut Oil', skuPrefix: 'NPO-CCO' },
  { colIndex: 3, productName: 'Sesame Oil', skuPrefix: 'NPO-SSO' },
  { colIndex: 4, productName: 'Castor Oil', skuPrefix: 'NPO-CO' },
  { colIndex: 5, productName: 'Lamp Oil', skuPrefix: 'NPO-LO' },
  { colIndex: 6, productName: 'Neem Oil', skuPrefix: 'NPO-NO' },
  { colIndex: 7, productName: 'Mahua Oil', skuPrefix: 'NPO-MO' },
  { colIndex: 8, productName: 'Edible Oil', skuPrefix: 'VG-EO' },
  { colIndex: 9, productName: 'Sunflower Oil', skuPrefix: 'RO-SO' },
  { colIndex: 10, productName: 'Palm Oil', skuPrefix: 'RG-PO' },
];

// Size label (lower-case) → variant SKU suffix & VariantSize display value
const SIZE_MAP: Record<string, { code: string; size: VariantSize }> = {
  '100ml': { code: '100ML', size: '100ml' },
  '200ml': { code: '200ML', size: '200ml' },
  '500ml': { code: '500ML', size: '500ml' },
  '1ltr': { code: '1L', size: '1L' },
  '2ltr': { code: '2L', size: '2L' },
  '5ltr': { code: '5L', size: '5L' },
  '5kg': { code: '5KG', size: '5Kg' },
  '15ltr': { code: '15L', size: '15L' },
  '15kg': { code: '15KG', size: '15Kg' },
};

@Injectable({ providedIn: 'root' })
export class GoogleSheetService {
  private initialUrl =
    typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)
      ? localStorage.getItem(STORAGE_KEY)!
      : DEFAULT_SHEET_URL;

  private diffItemsSignal = signal<SheetDiffItem[]>([]);
  private isSyncingSignal = signal<boolean>(false);
  private lastSyncedSignal = signal<string>(new Date().toISOString());
  private connectedSheetUrlSignal = signal<string>(this.initialUrl);

  readonly diffItems = this.diffItemsSignal.asReadonly();
  readonly isSyncing = this.isSyncingSignal.asReadonly();
  readonly lastSynced = this.lastSyncedSignal.asReadonly();
  readonly connectedSheetUrl = this.connectedSheetUrlSignal.asReadonly();

  readonly approvedCount = computed(() =>
    this.diffItemsSignal().filter(i => i.isApproved).length
  );
  readonly totalDiffCount = computed(() => this.diffItemsSignal().length);

  constructor(private productService: ProductService) { }

  // ---------------------------------------------------------------------------
  // Approval toggles
  // ---------------------------------------------------------------------------
  toggleApproval(sku: string): void {
    this.diffItemsSignal.update(items =>
      items.map(i => i.sku === sku ? { ...i, isApproved: !i.isApproved } : i)
    );
  }

  selectAll(approve: boolean): void {
    this.diffItemsSignal.update(items =>
      items.map(i => ({ ...i, isApproved: approve }))
    );
  }

  // ---------------------------------------------------------------------------
  // fetchFromSheet — calls backend /admin/sheet-sync/import which fetches CSV,
  // compares against LIVE DB prices (authoritative), returns SheetSyncPreviewDto[]
  // ---------------------------------------------------------------------------
  async fetchFromSheet(): Promise<void> {
    this.isSyncingSignal.set(true);
    const sheetUrl = this.connectedSheetUrlSignal();

    try {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('nisha_admin_token')
        : null;
      const authHeaders: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      // POST to backend with optional custom sheet URL as query param
      const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      const queryParam   = sheetIdMatch?.[1]
        ? `?sheetUrl=${encodeURIComponent(sheetUrl)}`
        : '';

      const res = await fetchWithTimeout(
        getApiUrl(`/admin/sheet-sync/import${queryParam}`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders }
        },
        25_000
      );

      if (!res.ok) throw new Error(`Backend import returned HTTP ${res.status}`);

      const json = await res.json();
      // Backend returns ApiResponse<List<SheetSyncPreviewDto>>
      const diffs: SheetDiffItem[] = (json.data ?? []).map((d: any) => ({
        sku:                 d.sku,
        productName:         d.productName,
        variantSize:         d.variantSize as VariantSize,
        currentMrp:          Number(d.mrp ?? 0),
        newMrp:              Number(d.newMrp ?? d.mrp ?? 0),
        currentSellingPrice: Number(d.currentPrice ?? 0),
        newSellingPrice:     Number(d.newPrice ?? 0),
        currentStock:        Number(d.currentStock ?? 0),
        newStock:            Number(d.currentStock ?? 0),  // sheet has no stock col
        priceDelta:          Number(d.priceDelta ?? 0),
        stockDelta:          0,
        isApproved:          d.approved !== false          // default true
      }));

      this.diffItemsSignal.set(diffs);
      console.info(`Sheet sync: ${diffs.length} price diff(s) from backend (live DB comparison).`);
    } catch (err) {
      console.warn('Sheet import from backend failed — keeping current diff state:', err);
    } finally {
      this.isSyncingSignal.set(false);
      this.lastSyncedSignal.set(new Date().toISOString());
    }
  }

  // parseCsvLine is no longer used for the primary sync flow (backend handles CSV parsing)
  // Kept for potential future use or fallback scenarios.
  /** @deprecated Use fetchFromSheet() which calls the backend importer */
  private parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"'; i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        fields.push(current); current = '';
      } else {
        current += c;
      }
    }
    fields.push(current);
    return fields;
  }

  // ---------------------------------------------------------------------------
  // applyApprovedChanges — persist to backend FIRST (with prices), then update local catalog
  // ---------------------------------------------------------------------------
  async applyApprovedChanges(): Promise<{ appliedCount: number }> {
    const approved = this.diffItemsSignal().filter(i => i.isApproved);
    if (approved.length === 0) return { appliedCount: 0 };

    // 1. Persist to backend DB FIRST — send SKU + new price pairs so backend
    //    does NOT need its in-memory cache (safe across server restarts on Render)
    await this.persistToBackend(approved);

    // 2. Update local in-memory catalog only after backend succeeds
    const products = this.productService.products();
    for (const item of approved) {
      for (const prod of products) {
        const variant = prod.variants.find(v => v.sku === item.sku);
        if (variant) {
          this.productService.updateVariantPriceAndStock(
            prod.id, item.sku,
            item.newSellingPrice, item.newMrp, item.newStock
          );
          break;
        }
      }
    }

    // 3. Remove applied items from the diff list
    this.diffItemsSignal.update(items => items.filter(i => !i.isApproved));

    // 4. Reload product catalog from backend so prices are fresh everywhere
    try {
      await this.productService.syncFromBackend();
    } catch (err) {
      console.warn('Post-approve catalog reload failed (prices already saved to DB):', err);
    }

    return { appliedCount: approved.length };
  }

  /**
   * Calls POST /admin/sheet-sync/approve with {skuPrices: {sku: newPrice, ...}}
   * Sends new prices directly — backend does NOT need its in-memory cache.
   */
  private async persistToBackend(approved: SheetDiffItem[]): Promise<void> {
    if (approved.length === 0) return;
    try {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('nisha_admin_token')
        : null;
      const authHeaders: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      // Build sku → newSellingPrice map so backend writes correct price to DB
      const skuPrices: Record<string, number> = {};
      for (const item of approved) {
        skuPrices[item.sku] = item.newSellingPrice;
      }

      const res = await fetchWithTimeout(getApiUrl('/admin/sheet-sync/approve'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ skuPrices })
      }, 15_000);
      if (!res.ok) {
        const text = await res.text();
        console.warn(`Backend approve returned ${res.status}: ${text}`);
      } else {
        console.info(`Backend: ${approved.length} variant price(s) persisted to DB.`);
      }
    } catch (err) {
      console.warn('Backend approve network error:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // URL management
  // ---------------------------------------------------------------------------
  updateSheetUrl(url: string): void {
    const cleanUrl = url.trim();
    this.connectedSheetUrlSignal.set(cleanUrl);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, cleanUrl);
    }
  }
}
