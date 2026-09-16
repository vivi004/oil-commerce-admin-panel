import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventoryService, StockInventoryItem } from '../../../core/services/inventory.service';
import { ProductService } from '../../../core/services/product.service';
import { StockMovementType } from '../../../core/enums/app.enums';
import { VariantSize } from '../../../core/models/app.models';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-inventory-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent, ModalComponent, BadgeComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Warehouse & Stock Operations</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Mara Chekku cold-pressed oil batches, live inventory levels per SKU, and movement audit ledger.</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- Live Sync -->
          <button
            type="button"
            (click)="syncLive()"
            class="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Sync stock levels with database"
          >
            <span class="material-symbols-outlined text-[16px]">sync</span>
            <span>Sync Live</span>
          </button>
          <button
            type="button"
            (click)="openAdjustModal()"
            class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">tune</span>
            <span>Quick Stock Adjustment</span>
          </button>
        </div>
      </div>

      <!-- Low Stock Alert Banner -->
      <div *ngIf="inventoryService.lowStockVariants().length > 0" class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[24px]">crisis_alert</span>
          </div>
          <div>
            <div class="font-bold text-xs text-rose-900 dark:text-rose-200">
              Low Stock Alert: {{ inventoryService.lowStockVariants().length }} variant(s) below reorder threshold
            </div>
            <div class="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
              Refill extraction batches for {{ getLowStockSummary() }}
            </div>
          </div>
        </div>
        <button
          type="button"
          (click)="openAdjustModalForFirstLow()"
          class="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 text-center"
        >
          Batch Stock In
        </button>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          (click)="activeTab.set('stock')"
          [ngClass]="activeTab() === 'stock' ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold bg-amber-50/50 dark:bg-amber-950/30' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'"
          class="px-4 py-2 rounded-xl border text-xs flex items-center gap-2 transition-all"
        >
          <span class="material-symbols-outlined text-[18px]">inventory_2</span>
          <span>Live Stock Levels ({{ inventoryService.allStockItems().length }} SKUs)</span>
        </button>
        <button
          type="button"
          (click)="activeTab.set('movements')"
          [ngClass]="activeTab() === 'movements' ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold bg-amber-50/50 dark:bg-amber-950/30' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'"
          class="px-4 py-2 rounded-xl border text-xs flex items-center gap-2 transition-all"
        >
          <span class="material-symbols-outlined text-[18px]">history</span>
          <span>Movement Audit Ledger ({{ inventoryService.movements().length }})</span>
        </button>
      </div>

      <!-- TAB 1: LIVE STOCK LEVELS TABLE -->
      <div *ngIf="activeTab() === 'stock'" class="space-y-4">
        <app-data-table
          [columns]="stockColumns"
          [totalCount]="filteredStockItems().length"
          [pageSize]="10"
          searchPlaceholder="Search product name, SKU, or pack size..."
          (search)="onStockSearch($event)"
        >
          <ng-container table-rows>
            <tr *ngFor="let item of filteredStockItems()" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
              <!-- Product & Size -->
              <td class="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                <div class="flex items-center gap-3">
                  <img [src]="item.primaryImage" [alt]="item.productName" class="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs" />
                  <div>
                    <div class="text-xs font-bold">{{ item.productName }}</div>
                    <div class="text-[10px] text-slate-400 font-mono">{{ item.sku }} • <span class="text-amber-600 dark:text-amber-400 font-semibold">{{ item.variantSize }}</span></div>
                  </div>
                </div>
              </td>

              <!-- Batch & Mill Location -->
              <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                <div class="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">{{ item.batchNumber }}</div>
                <div class="text-[10px] text-slate-400">{{ item.warehouseLocation }}</div>
              </td>

              <!-- Selling Price / MRP -->
              <td class="px-4 py-3 text-xs font-semibold text-slate-900 dark:text-white">
                <div>₹{{ item.sellingPrice }}</div>
                <div class="text-[10px] text-slate-400 line-through">₹{{ item.mrp }}</div>
              </td>

              <!-- Current Stock -->
              <td class="px-4 py-3 text-right">
                <div [ngClass]="item.stockQuantity === 0 ? 'text-rose-600 font-black' : item.stockQuantity <= item.reorderLevel ? 'text-amber-600 font-bold' : 'text-slate-900 dark:text-white font-bold'" class="text-xs">
                  {{ item.stockQuantity }} units
                </div>
                <div class="text-[10px] text-slate-400">Safety: {{ item.reorderLevel }}</div>
              </td>

              <!-- Stock Status Badge -->
              <td class="px-4 py-3">
                <app-badge
                  [variant]="item.status === 'IN_STOCK' ? 'emerald' : item.status === 'LOW_STOCK' ? 'amber' : 'rose'"
                  [dot]="true"
                >
                  {{ item.status === 'IN_STOCK' ? 'In Stock' : item.status === 'LOW_STOCK' ? 'Low Stock' : 'Depleted' }}
                </app-badge>
              </td>

              <!-- Actions -->
              <td class="px-4 py-3 text-right">
                <button
                  type="button"
                  (click)="adjustItemStock(item)"
                  class="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200/60 dark:border-amber-800/40 transition-colors inline-flex items-center gap-1"
                  title="Adjust or Restock this SKU"
                >
                  <span class="material-symbols-outlined text-[15px]">add_box</span>
                  <span>Restock</span>
                </button>
              </td>
            </tr>
          </ng-container>
        </app-data-table>
      </div>

      <!-- TAB 2: MOVEMENTS LEDGER TABLE -->
      <div *ngIf="activeTab() === 'movements'" class="space-y-4">
        <app-data-table
          [columns]="movementColumns"
          [totalCount]="filteredMovements().length"
          [pageSize]="10"
          searchPlaceholder="Search by product, SKU, or batch reference..."
          (search)="onMovementSearch($event)"
        >
          <ng-container table-rows>
            <tr *ngFor="let m of filteredMovements()" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
              <td class="px-4 py-3 text-slate-500 text-[11px] whitespace-nowrap">
                {{ m.createdAt | date:'short' }}
              </td>
              <td class="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                <div class="text-xs">{{ m.productName }}</div>
                <div class="text-[10px] text-slate-400 font-mono">{{ m.sku }} ({{ m.variantSize }})</div>
              </td>
              <td class="px-4 py-3">
                <app-badge [variant]="getMovementVariant(m.type)">
                  {{ m.type }}
                </app-badge>
              </td>
              <td class="px-4 py-3 font-bold text-xs" [ngClass]="m.quantity >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
                {{ m.quantity >= 0 ? '+' : '' }}{{ m.quantity }}
              </td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                {{ m.previousStock }} → <strong class="text-slate-900 dark:text-white">{{ m.newStock }}</strong>
              </td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                {{ m.warehouseLocation }}
              </td>
              <td class="px-4 py-3 text-slate-500 text-xs truncate max-w-xs">
                {{ m.reason }}
                <span *ngIf="m.referenceId" class="text-[10px] font-mono text-slate-400">[{{ m.referenceId }}]</span>
              </td>
              <td class="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300 text-xs">
                {{ m.performedBy }}
              </td>
            </tr>
          </ng-container>
        </app-data-table>
      </div>

      <!-- Quick Adjustment Modal -->
      <app-modal
        [isOpen]="isAdjustModalOpen()"
        title="Stock Adjustment Entry"
        subtitle="Record warehouse oil stock inbound batch or breakage write-off"
        icon="warehouse"
        size="md"
        (close)="isAdjustModalOpen.set(false)"
      >
        <form [formGroup]="adjustForm" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Oil Product *</label>
            <select
              formControlName="productId"
              (change)="onProductSelected()"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              <option *ngFor="let p of productService.products()" [value]="p.id">{{ p.name }}</option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Variant Size & SKU *</label>
              <select
                formControlName="sku"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option *ngFor="let v of currentProductVariants()" [value]="v.sku">{{ v.size }} (Current: {{ v.stockQuantity }})</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Movement Type *</label>
              <select
                formControlName="type"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option [value]="StockMovementType.STOCK_IN">Stock IN (Fresh Pressing)</option>
                <option [value]="StockMovementType.ADJUSTMENT">Physical Audit Adjustment</option>
                <option [value]="StockMovementType.SCRAP">Damaged / Leakage Scrap</option>
                <option [value]="StockMovementType.RETURN">Customer Return Restock</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantity Change (+ or -) *</label>
              <input
                type="number"
                formControlName="quantityChange"
                placeholder="e.g. 50 or -5"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
              />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Warehouse Location *</label>
              <select
                formControlName="warehouseLocation"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="Unit 1 - Mara Chekku Mill">Unit 1 - Mara Chekku Mill</option>
                <option value="Unit 2 - Packing Station">Unit 2 - Packing Station</option>
                <option value="Bulk Storage Silo #3">Bulk Storage Silo #3</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reason / Batch Ref *</label>
            <input
              type="text"
              formControlName="reason"
              placeholder="e.g. Mara Chekku fresh milling batch #MC-882"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
        </form>

        <div modal-footer class="flex items-center gap-2">
          <button
            type="button"
            (click)="isAdjustModalOpen.set(false)"
            class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="saveStockAdjustment()"
            class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-xs"
          >
            Commit Stock Change
          </button>
        </div>
      </app-modal>
    </div>
  `
})
export class InventoryManagementComponent {
  inventoryService = inject(InventoryService);
  productService = inject(ProductService);
  private fb = inject(FormBuilder);

  readonly StockMovementType = StockMovementType;
  activeTab = signal<'stock' | 'movements'>('stock');
  isAdjustModalOpen = signal<boolean>(false);
  stockSearchQuery = signal<string>('');
  movementSearchQuery = signal<string>('');

  stockColumns: ColumnDef[] = [
    { key: 'productName', label: 'Oil Product & SKU', sortable: true },
    { key: 'batchNumber', label: 'Batch # & Mill Station', sortable: true },
    { key: 'sellingPrice', label: 'Selling Price / MRP', sortable: true },
    { key: 'stockQuantity', label: 'On-Hand Stock', sortable: true, align: 'right' },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'actions', label: 'Actions', align: 'right' }
  ];

  movementColumns: ColumnDef[] = [
    { key: 'createdAt', label: 'Date & Time', sortable: true },
    { key: 'productName', label: 'Product & Variant', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'quantity', label: 'Quantity Delta', sortable: true },
    { key: 'newStock', label: 'Stock Progression' },
    { key: 'warehouseLocation', label: 'Location' },
    { key: 'reason', label: 'Reason / Ref' },
    { key: 'performedBy', label: 'Logged By', align: 'right' }
  ];

  adjustForm: FormGroup = this.fb.group({
    productId: ['', Validators.required],
    sku: ['', Validators.required],
    type: [StockMovementType.STOCK_IN, Validators.required],
    quantityChange: [50, Validators.required],
    warehouseLocation: ['Unit 1 - Mara Chekku Mill', Validators.required],
    reason: ['Mara Chekku fresh milling batch #MC-882', Validators.required]
  });

  currentProductVariants = computed(() => {
    const pId = this.adjustForm.get('productId')?.value;
    const prod = this.productService.getProductById(pId);
    return prod ? prod.variants.filter(v => v.isEnabled) : [];
  });

  filteredStockItems = computed(() => {
    let list = this.inventoryService.allStockItems();
    const q = this.stockSearchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(i =>
        i.productName.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.variantSize.toLowerCase().includes(q) ||
        i.batchNumber.toLowerCase().includes(q)
      );
    }
    return list;
  });

  filteredMovements = computed(() => {
    let list = this.inventoryService.movements();
    const q = this.movementSearchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(m =>
        m.productName.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        (m.referenceId && m.referenceId.toLowerCase().includes(q))
      );
    }
    return list;
  });

  getLowStockSummary(): string {
    return this.inventoryService.lowStockVariants().map(v => `${v.productName} (${v.variantSize})`).slice(0, 2).join(', ');
  }

  onStockSearch(q: string): void {
    this.stockSearchQuery.set(q);
  }

  onMovementSearch(q: string): void {
    this.movementSearchQuery.set(q);
  }

  syncLive(): void {
    this.productService.syncFromBackend();
  }

  openAdjustModal(): void {
    const firstProd = this.productService.products()[0];
    if (firstProd) {
      this.adjustForm.patchValue({
        productId: firstProd.id,
        sku: firstProd.variants[0]?.sku || '',
        quantityChange: 50
      });
    }
    this.isAdjustModalOpen.set(true);
  }

  adjustItemStock(item: StockInventoryItem): void {
    this.adjustForm.patchValue({
      productId: item.productId,
      sku: item.sku,
      quantityChange: 50,
      type: StockMovementType.STOCK_IN,
      reason: `Restock batch for ${item.productName} (${item.variantSize})`
    });
    this.isAdjustModalOpen.set(true);
  }

  openAdjustModalForFirstLow(): void {
    const low = this.inventoryService.lowStockVariants()[0];
    if (low) {
      this.adjustForm.patchValue({
        productId: low.productId,
        sku: low.sku,
        quantityChange: low.deficit + 30,
        type: StockMovementType.STOCK_IN,
        reason: `Restock to resolve deficit of ${low.deficit} units`
      });
    }
    this.isAdjustModalOpen.set(true);
  }

  onProductSelected(): void {
    const variants = this.currentProductVariants();
    if (variants.length > 0) {
      this.adjustForm.patchValue({ sku: variants[0].sku });
    }
  }

  saveStockAdjustment(): void {
    if (this.adjustForm.invalid) {
      this.adjustForm.markAllAsTouched();
      return;
    }

    const val = this.adjustForm.value;
    const prod = this.productService.getProductById(val.productId);
    const variant = prod?.variants.find(v => v.sku === val.sku);
    if (!prod || !variant) return;

    this.inventoryService.adjustStock({
      productId: prod.id,
      productName: prod.name,
      sku: val.sku,
      variantSize: variant.size,
      type: val.type,
      quantityChange: Number(val.quantityChange),
      warehouseLocation: val.warehouseLocation,
      reason: val.reason,
      performedBy: 'Warehouse Manager'
    });

    this.isAdjustModalOpen.set(false);
  }

  getMovementVariant(type: StockMovementType): 'emerald' | 'amber' | 'rose' | 'blue' | 'slate' {
    switch (type) {
      case StockMovementType.STOCK_IN: return 'emerald';
      case StockMovementType.ADJUSTMENT: return 'amber';
      case StockMovementType.SCRAP: return 'rose';
      case StockMovementType.RETURN: return 'blue';
      default: return 'slate';
    }
  }
}
