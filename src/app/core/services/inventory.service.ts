import { Injectable, signal, computed } from '@angular/core';
import { StockMovement, VariantSize } from '../models/app.models';
import { StockMovementType } from '../enums/app.enums';
import { INITIAL_STOCK_MOVEMENTS } from './mock-data';
import { ProductService } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private movementsSignal = signal<StockMovement[]>(INITIAL_STOCK_MOVEMENTS);

  readonly movements = this.movementsSignal.asReadonly();

  constructor(private productService: ProductService) {}

  // Computed signals
  readonly totalMovementsCount = computed(() => this.movementsSignal().length);

  readonly recentMovements = computed(() => {
    return [...this.movementsSignal()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 15);
  });

  // Calculate low stock variants across all products
  readonly lowStockVariants = computed(() => {
    const products = this.productService.products();
    const lowStockList: {
      productId: string;
      productName: string;
      brand: string;
      category: string;
      variantSize: VariantSize;
      sku: string;
      stockQuantity: number;
      reorderLevel: number;
      deficit: number;
    }[] = [];

    for (const prod of products) {
      for (const variant of prod.variants) {
        if (variant.isEnabled && variant.stockQuantity <= variant.reorderLevel) {
          lowStockList.push({
            productId: prod.id,
            productName: prod.name,
            brand: prod.brand,
            category: prod.category,
            variantSize: variant.size,
            sku: variant.sku,
            stockQuantity: variant.stockQuantity,
            reorderLevel: variant.reorderLevel,
            deficit: Math.max(0, variant.reorderLevel - variant.stockQuantity)
          });
        }
      }
    }

    return lowStockList;
  });

  // Quick Stock Adjustment
  adjustStock(params: {
    productId: string;
    productName: string;
    sku: string;
    variantSize: VariantSize;
    type: StockMovementType;
    quantityChange: number; // positive or negative
    warehouseLocation: string;
    reason: string;
    performedBy: string;
    referenceId?: string;
  }): void {
    const product = this.productService.getProductById(params.productId);
    if (!product) return;

    const variantIndex = product.variants.findIndex(v => v.sku === params.sku);
    if (variantIndex === -1) return;

    const currentStock = product.variants[variantIndex].stockQuantity;
    const newStock = Math.max(0, currentStock + params.quantityChange);

    // Update variant stock in product service
    this.productService.updateVariantStock(params.productId, params.sku, newStock);

    // Create movement entry
    const newMovement: StockMovement = {
      id: 'mov-' + Date.now(),
      productId: params.productId,
      productName: params.productName,
      sku: params.sku,
      variantSize: params.variantSize,
      type: params.type,
      quantity: params.quantityChange,
      previousStock: currentStock,
      newStock,
      warehouseLocation: params.warehouseLocation,
      reason: params.reason,
      referenceId: params.referenceId || `ADJ-${Date.now().toString().slice(-6)}`,
      performedBy: params.performedBy,
      createdAt: new Date().toISOString()
    };

    this.movementsSignal.update(movements => [newMovement, ...movements]);
  }
}
