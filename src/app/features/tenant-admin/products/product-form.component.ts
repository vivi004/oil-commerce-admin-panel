import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { Product, ProductVariant, VariantSize } from '../../../core/models/app.models';
import { ProductStatus } from '../../../core/enums/app.enums';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FileUploadComponent],
  template: `
    <div class="space-y-6 max-w-5xl pb-12">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-3">
          <a
            routerLink="/tenant-admin/products"
            class="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
          >
            <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          </a>
          <div>
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {{ isEditMode() ? 'Edit Oil Product' : 'Add Cold-Pressed Oil Product' }}
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400">Configure wood-pressed commodity specs, multi-size packaging matrix, and retail pricing.</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <a
            routerLink="/tenant-admin/products"
            class="flex-1 sm:flex-initial text-center px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </a>
          <button
            type="button"
            (click)="onSave()"
            [disabled]="isSaving()"
            class="flex-1 sm:flex-initial justify-center px-5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <span class="material-symbols-outlined text-[18px]">{{ isSaving() ? 'sync' : saveSuccess() ? 'check' : 'save' }}</span>
            <span>{{ isSaving() ? 'Saving...' : saveSuccess() ? 'Saved!' : (isEditMode() ? 'Update Product' : 'Publish Product') }}</span>
          </button>
        </div>
      </div>

      <form [formGroup]="productForm" class="space-y-6 text-xs">
        <!-- Basic Information Card -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4">
          <h2 class="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px] text-amber-500">info</span>
            <span>Basic Oil Commodity Information</span>
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Title *</label>
              <input
                type="text"
                formControlName="name"
                placeholder="e.g. Pure Cold-Pressed Groundnut Oil (Wood Churned)"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Oil Category *</label>
              <select
                formControlName="category"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option *ngFor="let cat of productService.categories()" [value]="cat.name">{{ cat.name }}</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Brand *</label>
              <select
                formControlName="brand"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option *ngFor="let brand of productService.brands()" [value]="brand.name">{{ brand.name }}</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Base SKU *</label>
              <input
                type="text"
                formControlName="sku"
                placeholder="e.g. NPO-GNO"
                (blur)="syncVariantSkus()"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-mono"
              />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Status</label>
              <select
                formControlName="status"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option [value]="ProductStatus.ACTIVE">Active</option>
                <option [value]="ProductStatus.DRAFT">Draft</option>
                <option [value]="ProductStatus.ARCHIVED">Archived</option>
                <option [value]="ProductStatus.OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              formControlName="description"
              rows="3"
              placeholder="Provide cold-pressing method details, traditional Mara Chekku extraction, and aroma characteristics..."
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            ></textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Health Benefits</label>
              <input
                type="text"
                formControlName="benefits"
                placeholder="e.g. Rich in natural MUFA, zero cholesterol, cold-pressed antioxidant retention"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Storage Instructions</label>
              <input
                type="text"
                formControlName="storageInstructions"
                placeholder="e.g. Store in cool, dry place away from direct sunlight"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <!-- Product Imagery & Lab Certificates -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4">
          <h2 class="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px] text-amber-500">imagesmode</span>
            <span>Product Packaging & Certification Media</span>
          </h2>

          <app-file-upload
            label="Upload Bottle & Packaging Photos"
            [multiple]="true"
            [previewImages]="productImages()"
            (filesChanged)="onImagesChanged($event)"
          ></app-file-upload>
        </div>

        <!-- DYNAMIC PACKAGING SIZES & VARIANTS MATRIX -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-amber-500">grid_view</span>
                <span>Packaging Sizes & SKU Matrix (100ml to 15Kg)</span>
              </h2>
              <p class="text-[11px] text-slate-400 mt-0.5">Enable packaging sizes, set retail pricing, GST rates, and inventory thresholds.</p>
            </div>

            <!-- Quick Auto Fill Helper -->
            <button
              type="button"
              (click)="autoPopulatePricing()"
              class="w-full sm:w-auto text-center justify-center px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
            >
              Auto-Calculate Proportional Pricing
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full min-w-[720px] text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40">
                  <th class="py-2.5 px-3 w-12 text-center">Active</th>
                  <th class="py-2.5 px-3">Size</th>
                  <th class="py-2.5 px-3">SKU</th>
                  <th class="py-2.5 px-3">MRP (₹)</th>
                  <th class="py-2.5 px-3">Selling Price (₹)</th>
                  <th class="py-2.5 px-3">GST (%)</th>
                  <th class="py-2.5 px-3">Stock Units</th>
                  <th class="py-2.5 px-3">Min Threshold</th>
                </tr>
              </thead>
              <tbody formArrayName="variants" class="divide-y divide-slate-100 dark:divide-slate-800/60">
                <tr *ngFor="let vGroup of variantsArray.controls; let i = index" [formGroupName]="i" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <!-- Enabled Checkbox -->
                  <td class="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      formControlName="isEnabled"
                      class="rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500 dark:border-slate-700"
                    />
                  </td>

                  <!-- Size Label -->
                  <td class="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    <span class="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {{ vGroup.get('size')?.value }}
                    </span>
                  </td>

                  <!-- SKU Input -->
                  <td class="py-3 px-3">
                    <input
                      type="text"
                      formControlName="sku"
                      class="w-32 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[11px]"
                    />
                  </td>

                  <!-- MRP Input -->
                  <td class="py-3 px-3">
                    <input
                      type="number"
                      formControlName="mrp"
                      class="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </td>

                  <!-- Selling Price Input -->
                  <td class="py-3 px-3">
                    <input
                      type="number"
                      formControlName="sellingPrice"
                      class="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-amber-600 dark:text-amber-400"
                    />
                  </td>

                  <!-- GST Input -->
                  <td class="py-3 px-3">
                    <input
                      type="number"
                      formControlName="gstRate"
                      class="w-16 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </td>

                  <!-- Stock Qty -->
                  <td class="py-3 px-3">
                    <input
                      type="number"
                      formControlName="stockQuantity"
                      class="w-20 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                    />
                  </td>

                  <!-- Reorder Level -->
                  <td class="py-3 px-3">
                    <input
                      type="number"
                      formControlName="reorderLevel"
                      class="w-20 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </form>
    </div>
  `
})
export class ProductFormComponent implements OnInit {
  productService = inject(ProductService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly ProductStatus = ProductStatus;
  isEditMode = signal<boolean>(false);
  editingProductId: string | null = null;
  productImages = signal<string[]>([]);

  readonly standardSizes: VariantSize[] = ['100ml', '200ml', '500ml', '1L', '2L', '5L', '15L', '5Kg', '15Kg'];

  productForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    brand: ['Nisha Pure Oils', Validators.required],
    category: ['Groundnut Oil', Validators.required],
    sku: ['NPO-GNO', Validators.required],
    status: [ProductStatus.ACTIVE, Validators.required],
    description: ['Wood pressed cold extraction from selected Saurashtra groundnuts.'],
    benefits: ['Cholesterol-free, 100% natural, Mara Chekku traditional cold-press method'],
    storageInstructions: ['Store in cool, dry place. Best within 9 months of extraction.'],
    variants: this.fb.array([])
  });

  get variantsArray(): FormArray {
    return this.productForm.get('variants') as FormArray;
  }

  ngOnInit(): void {
    this.editingProductId = this.route.snapshot.paramMap.get('id');
    if (this.editingProductId) {
      this.isEditMode.set(true);
      this.loadProduct(this.editingProductId);
    } else {
      this.initDefaultVariants('NPO-OIL');
      const cats = this.productService.categories();
      const brands = this.productService.brands();
      if (cats.length > 0 && !this.productForm.get('category')?.value) {
        this.productForm.patchValue({ category: cats[0].name });
      }
      if (brands.length > 0 && !this.productForm.get('brand')?.value) {
        this.productForm.patchValue({ brand: brands[0].name });
      }
      this.productImages.set([]);
    }
  }

  private initDefaultVariants(baseSku: string): void {
    this.variantsArray.clear();
    const defaults = this.productService.createDefaultVariants(baseSku);
    defaults.forEach(v => {
      this.variantsArray.push(this.createVariantGroup(v));
    });
  }

  private createVariantGroup(v: ProductVariant): FormGroup {
    return this.fb.group({
      id: [v.id],
      size: [v.size],
      sku: [v.sku, Validators.required],
      mrp: [v.mrp, Validators.required],
      sellingPrice: [v.sellingPrice, Validators.required],
      gstRate: [v.gstRate, Validators.required],
      stockQuantity: [v.stockQuantity, Validators.required],
      reorderLevel: [v.reorderLevel, Validators.required],
      isEnabled: [v.isEnabled]
    });
  }

  private async loadProduct(id: string): Promise<void> {
    const prod = await this.productService.fetchProductById(id);
    if (!prod) {
      this.router.navigate(['/tenant-admin/products']);
      return;
    }

    this.productForm.patchValue({
      name: prod.name,
      brand: prod.brand,
      category: prod.category,
      sku: prod.sku,
      status: prod.status,
      description: prod.description,
      benefits: prod.benefits,
      storageInstructions: prod.storageInstructions
    });

    const imgs = prod.images && prod.images.length > 0 
      ? prod.images.map(img => this.productService.resolveImageUrl(img))
      : [this.productService.resolveImageUrl(prod.primaryImage)];
    this.productImages.set(imgs);

    this.variantsArray.clear();
    // Map standard sizes and merge existing variant data
    this.standardSizes.forEach(size => {
      const existing = prod.variants.find(v => v.size === size);
      if (existing) {
        this.variantsArray.push(this.createVariantGroup(existing));
      } else {
        // Fallback default
        this.variantsArray.push(this.createVariantGroup({
          id: `v-${Date.now()}-${size}`,
          size,
          sku: `${prod.sku}-${size.toUpperCase()}`,
          barcode: '',
          mrp: 400,
          sellingPrice: 350,
          gstRate: 5,
          stockQuantity: 0,
          reorderLevel: 10,
          isEnabled: false
        }));
      }
    });
  }

  syncVariantSkus(): void {
    const baseSku = (this.productForm.get('sku')?.value || 'NPO-OIL').toUpperCase().trim();
    this.variantsArray.controls.forEach(ctrl => {
      const size = ctrl.get('size')?.value;
      ctrl.patchValue({ sku: `${baseSku}-${size.toUpperCase()}` });
    });
  }

  autoPopulatePricing(): void {
    // Proportional pricing based on 1L baseline price
    const base1LPrice = 360;
    const sizeRatios: Record<VariantSize, number> = {
      '100ml': 0.15,
      '200ml': 0.25,
      '500ml': 0.55,
      '1L': 1.0,
      '2L': 1.95,
      '5L': 4.8,
      '15L': 13.8,
      '5Kg': 4.9,
      '15Kg': 14.1
    };

    this.variantsArray.controls.forEach(ctrl => {
      const size = ctrl.get('size')?.value as VariantSize;
      const ratio = sizeRatios[size] || 1;
      const sp = Math.round(base1LPrice * ratio);
      const mrp = Math.round(sp * 1.15);
      ctrl.patchValue({ sellingPrice: sp, mrp });
    });
  }

  onImagesChanged(imgs: string[]): void {
    this.productImages.set(imgs);
  }

  isSaving = signal<boolean>(false);
  saveSuccess = signal<boolean>(false);

  async onSave(): Promise<void> {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      alert('Please fill all required product fields.');
      return;
    }

    this.isSaving.set(true);

    try {
      const val = this.productForm.value;
      const variants: ProductVariant[] = this.variantsArray.value;
      const images = this.productImages();
      const primaryImage = images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80';

      if (this.isEditMode() && this.editingProductId) {
        await this.productService.updateProduct(this.editingProductId, {
          name: val.name,
          brand: val.brand,
          category: val.category,
          sku: val.sku,
          status: val.status,
          description: val.description,
          benefits: val.benefits,
          storageInstructions: val.storageInstructions,
          images,
          primaryImage,
          variants
        });
      } else {
        await this.productService.addProduct({
          name: val.name,
          brand: val.brand,
          category: val.category,
          sku: val.sku,
          barcode: `890100${Date.now().toString().slice(-6)}`,
          status: val.status,
          description: val.description,
          benefits: val.benefits,
          storageInstructions: val.storageInstructions,
          images,
          primaryImage,
          variants
        });
      }

      this.saveSuccess.set(true);
      setTimeout(() => {
        this.router.navigate(['/tenant-admin/products']);
      }, 500);
    } catch (err: any) {
      console.error('Failed to save product to database:', err);
      alert('Failed to save product to database: ' + (err?.message || 'Server error. Please verify backend connection.'));
    } finally {
      this.isSaving.set(false);
    }
  }
}

