import { Injectable, signal, computed } from '@angular/core';
import { SheetDiffItem } from '../models/app.models';
import { INITIAL_SHEET_DIFFS } from './mock-data';
import { ProductService } from './product.service';

const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1h2O9GLqQaTVUvU2w0pwBMEu9T8FzJSaqu-pn-KGRce4/edit?usp=sharing';
const STORAGE_KEY = 'oil_commerce_sheet_url';

@Injectable({
  providedIn: 'root'
})
export class GoogleSheetService {
  private initialUrl = (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) 
    ? localStorage.getItem(STORAGE_KEY)! 
    : DEFAULT_SHEET_URL;

  private diffItemsSignal = signal<SheetDiffItem[]>(INITIAL_SHEET_DIFFS);
  private isSyncingSignal = signal<boolean>(false);
  private lastSyncedSignal = signal<string>(new Date().toISOString());
  private connectedSheetUrlSignal = signal<string>(this.initialUrl);

  readonly diffItems = this.diffItemsSignal.asReadonly();
  readonly isSyncing = this.isSyncingSignal.asReadonly();
  readonly lastSynced = this.lastSyncedSignal.asReadonly();
  readonly connectedSheetUrl = this.connectedSheetUrlSignal.asReadonly();

  constructor(private productService: ProductService) {}

  readonly approvedCount = computed(() => 
    this.diffItemsSignal().filter(i => i.isApproved).length
  );

  readonly totalDiffCount = computed(() => this.diffItemsSignal().length);

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

  async fetchFromSheet(): Promise<void> {
    this.isSyncingSignal.set(true);
    const url = this.connectedSheetUrlSignal();

    try {
      // Extract spreadsheet ID to query CSV output
      const sheetIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (sheetIdMatch && sheetIdMatch[1]) {
        const sheetId = sheetIdMatch[1];
        const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

        const response = await fetch(exportUrl);
        if (response.ok) {
          const csvText = await response.text();
          const parsedDiffs = this.parseCsvDiffs(csvText);
          if (parsedDiffs.length > 0) {
            this.diffItemsSignal.set(parsedDiffs);
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch live Google Sheet via direct API, keeping current diff state:', err);
    } finally {
      this.isSyncingSignal.set(false);
      this.lastSyncedSignal.set(new Date().toISOString());
    }
  }

  private parseCsvDiffs(csvText: string): SheetDiffItem[] {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const products = this.productService.products();
    const diffs: SheetDiffItem[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      // Parse CSV line handling potential quotes
      const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
      if (cols.length < 9) continue;

      const sku = cols[0];
      const productName = cols[1];
      const variantSize = cols[2] as any;
      const newMrp = parseFloat(cols[4]) || 0;
      const newSellingPrice = parseFloat(cols[6]) || 0;
      const newStock = parseInt(cols[8], 10) || 0;

      // Find matching variant in current product catalog
      let currentVariant: any = null;
      for (const prod of products) {
        const found = prod.variants.find(v => v.sku === sku);
        if (found) {
          currentVariant = found;
          break;
        }
      }

      if (currentVariant) {
        const priceDelta = newSellingPrice - currentVariant.sellingPrice;
        const stockDelta = newStock - currentVariant.stockQuantity;

        // If there's any price or stock difference, or even preview
        if (priceDelta !== 0 || stockDelta !== 0 || newMrp !== currentVariant.mrp) {
          diffs.push({
            sku,
            productName,
            variantSize,
            currentMrp: currentVariant.mrp,
            newMrp,
            currentSellingPrice: currentVariant.sellingPrice,
            newSellingPrice,
            currentStock: currentVariant.stockQuantity,
            newStock,
            priceDelta,
            stockDelta,
            isApproved: true
          });
        }
      }
    }

    return diffs;
  }

  applyApprovedChanges(): { appliedCount: number } {
    const approved = this.diffItemsSignal().filter(i => i.isApproved);
    const products = this.productService.products();

    for (const item of approved) {
      for (const prod of products) {
        const variant = prod.variants.find(v => v.sku === item.sku);
        if (variant) {
          this.productService.updateVariantPriceAndStock(
            prod.id,
            item.sku,
            item.newSellingPrice,
            item.newMrp,
            item.newStock
          );
          break;
        }
      }
    }

    const appliedCount = approved.length;
    this.diffItemsSignal.update(items => items.filter(i => !i.isApproved));

    return { appliedCount };
  }

  updateSheetUrl(url: string): void {
    const cleanUrl = url.trim();
    this.connectedSheetUrlSignal.set(cleanUrl);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, cleanUrl);
    }
  }
}
