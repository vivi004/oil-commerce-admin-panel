import { Injectable, signal, computed } from '@angular/core';
import { SheetDiffItem, VariantSize } from '../models/app.models';
import { ProductService } from './product.service';
import { fetchWithTimeout, getApiUrl } from '../utils/api.utils';

const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1-jUkelMl4CmVZnNhmIgHj0shXvG5-3UDZ8s5LRhw0UE/edit?usp=sharing';
const STORAGE_KEY = 'oil_commerce_sheet_url';

// ---------------------------------------------------------------------------
// Master_Price_Sheet column → product mapping
//  Col 0  : Size label (row header)
//  Col 1  : Groundnut Oil   → NPO-GNO
//  Col 2  : Coconut Oil     → NPO-COC
//  Col 3  : Sesame Oil      → NPO-SES
//  Col 4  : Castor Oil      → NPO-CAS
//  Col 5  : Lamp Oil        → NPO-LMP
//  Col 6  : Neem Oil        → NPO-NEM
//  Col 7  : Mahua Oil       → NPO-MAH
//  Col 8  : Edible Oil      → VG-EO
//  Col 9  : Sunflower Oil   → RG-SFO
//  Col 10 : Palm Oil        → RSG-PO
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
  // fetchFromSheet — reads CSV directly from browser, parses the real sheet layout
  // ---------------------------------------------------------------------------
  async fetchFromSheet(): Promise<void> {
    this.isSyncingSignal.set(true);
    const url = this.connectedSheetUrlSignal();

    try {
      const sheetIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (!sheetIdMatch?.[1]) throw new Error('Could not extract spreadsheet ID from URL');

      const sheetId = sheetIdMatch[1];
      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

      const response = await fetch(exportUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const csvText = await response.text();
      const parsedDiffs = this.parseCsvDiffs(csvText);
      if (parsedDiffs.length > 0) {
        this.diffItemsSignal.set(parsedDiffs);
      } else {
        // All prices already in sync — show empty list (not mock)
        this.diffItemsSignal.set([]);
      }
    } catch (err) {
      console.warn('Could not fetch Google Sheet — keeping current diff state:', err);
    } finally {
      this.isSyncingSignal.set(false);
      this.lastSyncedSignal.set(new Date().toISOString());
    }
  }

  // ---------------------------------------------------------------------------
  // parseCsvDiffs — understands the actual Master_Price_Sheet layout:
  //   Row 0: Brand name header  → SKIP
  //   Row 1: Product name header → SKIP
  //   Rows 2+: Size data rows (col 0 = size label, col 1–10 = prices)
  // ---------------------------------------------------------------------------
  private parseCsvDiffs(csvText: string): SheetDiffItem[] {
    const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 3) return [];

    const products = this.productService.products();
    const diffs: SheetDiffItem[] = [];

    // Start from row index 2 (skip brand-header row 0 and product-name-header row 1)
    for (let rowIdx = 2; rowIdx < lines.length; rowIdx++) {
      const cols = this.parseCsvLine(lines[rowIdx]);
      if (cols.length < 2) continue;

      const sizeLabel = cols[0].trim().toLowerCase();
      const sizeInfo = SIZE_MAP[sizeLabel];
      if (!sizeInfo) continue;   // unrecognised size row, skip

      for (const colProduct of SHEET_COLUMNS) {
        const { colIndex, productName, skuPrefix } = colProduct;
        if (colIndex >= cols.length) continue;

        const cellValue = cols[colIndex].trim();
        if (!cellValue || cellValue === '-' || cellValue === '') continue;

        const sheetPrice = parseFloat(cellValue.replace(/[^0-9.]/g, ''));
        if (isNaN(sheetPrice) || sheetPrice <= 0) continue;

        // Build expected SKU e.g. NPO-GNO-1L
        const expectedSku = `${skuPrefix}-${sizeInfo.code}`;

        // Find matching variant in admin's local product catalog
        let matchedVariant: any = null;
        let matchedProduct: any = null;
        for (const prod of products) {
          const found = prod.variants.find(v =>
            v.sku?.toUpperCase() === expectedSku.toUpperCase()
          );
          if (found) {
            matchedVariant = found;
            matchedProduct = prod;
            break;
          }
        }

        if (!matchedVariant) {
          // Variant not yet in local catalog — skip (backend sync handles DB match)
          continue;
        }

        const currentSellingPrice = matchedVariant.sellingPrice ?? 0;
        const currentMrp = matchedVariant.mrp ?? 0;
        const priceDelta = sheetPrice - currentSellingPrice;

        if (priceDelta === 0) continue;  // no change, skip

        diffs.push({
          sku: expectedSku,
          productName: productName,
          variantSize: sizeInfo.size,
          currentMrp: currentMrp,
          newMrp: currentMrp,   // sheet has no MRP column — keep existing
          currentSellingPrice: currentSellingPrice,
          newSellingPrice: sheetPrice,
          currentStock: matchedVariant.stockQuantity ?? 0,
          newStock: matchedVariant.stockQuantity ?? 0,  // sheet has no stock col
          priceDelta: priceDelta,
          stockDelta: 0,
          isApproved: true
        });
      }
    }

    return diffs;
  }

  /** Parse one CSV line respecting quoted fields */
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
  // applyApprovedChanges — update local catalog AND call backend API
  // ---------------------------------------------------------------------------
  applyApprovedChanges(): { appliedCount: number } {
    const approved = this.diffItemsSignal().filter(i => i.isApproved);
    const products = this.productService.products();

    // 1. Update local in-memory catalog
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

    // 2. Persist to backend DB (fire-and-forget, errors logged)
    const approvedSkus = approved.map(i => i.sku);
    this.persistToBackend(approvedSkus).catch(err =>
      console.warn('Backend approve call failed (local changes still applied):', err)
    );

    const appliedCount = approved.length;
    this.diffItemsSignal.update(items => items.filter(i => !i.isApproved));
    return { appliedCount };
  }

  /** Calls POST /admin/sheet-sync/approve to save prices to the DB */
  private async persistToBackend(skus: string[]): Promise<void> {
    if (skus.length === 0) return;
    try {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('nisha_admin_token')
        : null;
      const authHeaders: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const res = await fetchWithTimeout(getApiUrl('/admin/sheet-sync/approve'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ skus })
      }, 15_000);
      if (!res.ok) {
        const text = await res.text();
        console.warn(`Backend approve returned ${res.status}: ${text}`);
      } else {
        console.info(`Backend: ${skus.length} variant price(s) persisted to DB.`);
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
