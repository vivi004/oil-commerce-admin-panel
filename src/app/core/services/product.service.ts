import { Injectable, signal, computed } from '@angular/core';
import { Product, Category, Brand, ProductVariant, VariantSize } from '../models/app.models';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_BRANDS } from './mock-data';
import { ProductStatus } from '../enums/app.enums';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly productsSignal = signal<Product[]>(INITIAL_PRODUCTS);
  private readonly categoriesSignal = signal<Category[]>(INITIAL_CATEGORIES);
  private readonly brandsSignal = signal<Brand[]>(INITIAL_BRANDS);

  readonly products = this.productsSignal.asReadonly();
  readonly categories = this.categoriesSignal.asReadonly();
  readonly brands = this.brandsSignal.asReadonly();

  readonly totalProductsCount = computed(() => this.productsSignal().length);
  readonly activeProductsCount = computed(() => this.productsSignal().filter(p => p.status === ProductStatus.ACTIVE).length);
  readonly lowStockProducts = computed(() => {
    return this.productsSignal().filter(p => p.totalStock <= 70);
  });

  getProductById(id: string): Product | undefined {
    return this.productsSignal().find(p => p.id === id);
  }

  addProduct(productData: Partial<Product>): Product {
    const variants = productData.variants ?? [];
    const totalStock = variants.reduce((sum, v) => sum + (v.isEnabled ? v.stockQuantity : 0), 0);
    const enabledPrices = variants.filter(v => v.isEnabled).map(v => v.sellingPrice);
    const minPrice = enabledPrices.length > 0 ? Math.min(...enabledPrices) : 0;
    const maxPrice = enabledPrices.length > 0 ? Math.max(...enabledPrices) : 0;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: productData.name ?? 'Untitled Product',
      brand: productData.brand ?? 'Nisha Pure Oils',
      category: productData.category ?? 'Groundnut Oil',
      categoryId: productData.categoryId ?? 'cat-groundnut',
      sku: productData.sku ?? `NPO-SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: productData.barcode ?? `8901234${Math.floor(100000 + Math.random() * 900000)}`,
      description: productData.description ?? '',
      benefits: productData.benefits ?? '',
      ingredients: productData.ingredients ?? '',
      storageInstructions: productData.storageInstructions ?? '',
      images: productData.images && productData.images.length > 0 ? productData.images : ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80'],
      primaryImage: productData.primaryImage ?? (productData.images?.[0] ?? 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80'),
      status: productData.status ?? ProductStatus.ACTIVE,
      variants,
      totalStock,
      minPrice,
      maxPrice,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    this.productsSignal.update(list => [newProduct, ...list]);
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): void {
    this.productsSignal.update(list => list.map(p => {
      if (p.id === id) {
        const variants = updates.variants ?? p.variants;
        const totalStock = variants.reduce((sum, v) => sum + (v.isEnabled ? v.stockQuantity : 0), 0);
        const enabledPrices = variants.filter(v => v.isEnabled).map(v => v.sellingPrice);
        const minPrice = enabledPrices.length > 0 ? Math.min(...enabledPrices) : p.minPrice;
        const maxPrice = enabledPrices.length > 0 ? Math.max(...enabledPrices) : p.maxPrice;

        return {
          ...p,
          ...updates,
          variants,
          totalStock,
          minPrice,
          maxPrice,
          updatedAt: new Date().toISOString().split('T')[0]
        };
      }
      return p;
    }));
  }

  deleteProduct(id: string): void {
    this.productsSignal.update(list => list.filter(p => p.id !== id));
  }

  // Categories
  addCategory(category: Partial<Category>): void {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: category.name ?? '',
      slug: (category.name ?? '').toLowerCase().replace(/\s+/g, '-'),
      description: category.description ?? '',
      image: category.image ?? 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
      seoTitle: category.seoTitle ?? category.name,
      seoDescription: category.seoDescription ?? category.description,
      isActive: true,
      productCount: 0
    };
    this.categoriesSignal.update(list => [newCat, ...list]);
  }

  updateCategory(id: string, updates: Partial<Category>): void {
    this.categoriesSignal.update(list => list.map(c => c.id === id ? { ...c, ...updates } : c));
  }

  deleteCategory(id: string): void {
    this.categoriesSignal.update(list => list.filter(c => c.id !== id));
  }

  // Brands
  addBrand(brand: Partial<Brand>): void {
    const newBrand: Brand = {
      id: `br-${Date.now()}`,
      name: brand.name ?? '',
      logo: brand.logo,
      description: brand.description ?? '',
      isActive: true,
      productCount: 0
    };
    this.brandsSignal.update(list => [newBrand, ...list]);
  }

  updateBrand(id: string, updates: Partial<Brand>): void {
    this.brandsSignal.update(list => list.map(b => b.id === id ? { ...b, ...updates } : b));
  }

  deleteBrand(id: string): void {
    this.brandsSignal.update(list => list.filter(b => b.id !== id));
  }

  // Helper for generating standard variant templates
  createDefaultVariants(baseSku: string = 'NPO-VAR'): ProductVariant[] {
    const allSizes: VariantSize[] = ['100ml', '200ml', '500ml', '1L', '2L', '5L', '15L', '5Kg', '15Kg'];
    return allSizes.map((size, idx) => ({
      id: `v-${idx + 1}-${Date.now()}`,
      size,
      sku: `${baseSku}-${size.toUpperCase()}`,
      barcode: `89012345${idx + 100}`,
      mrp: (idx + 1) * 100,
      sellingPrice: (idx + 1) * 85,
      gstRate: 5,
      stockQuantity: 50,
      reorderLevel: 15,
      isEnabled: ['200ml', '500ml', '1L', '5L'].includes(size) // enable popular variants by default
    }));
  }

  updateVariantStock(productId: string, sku: string, newStock: number): void {
    this.productsSignal.update(products => products.map(p => {
      if (p.id === productId) {
        const variants = p.variants.map(v => v.sku === sku ? { ...v, stockQuantity: newStock } : v);
        const totalStock = variants.reduce((sum, v) => sum + (v.isEnabled ? v.stockQuantity : 0), 0);
        return { ...p, variants, totalStock, updatedAt: new Date().toISOString().split('T')[0] };
      }
      return p;
    }));
  }

  updateVariantPriceAndStock(productId: string, sku: string, sellingPrice: number, mrp: number, stock: number): void {
    this.productsSignal.update(products => products.map(p => {
      if (p.id === productId) {
        const variants = p.variants.map(v => v.sku === sku ? { ...v, sellingPrice, mrp, stockQuantity: stock } : v);
        const totalStock = variants.reduce((sum, v) => sum + (v.isEnabled ? v.stockQuantity : 0), 0);
        const enabledPrices = variants.filter(v => v.isEnabled).map(v => v.sellingPrice);
        const minPrice = enabledPrices.length > 0 ? Math.min(...enabledPrices) : p.minPrice;
        const maxPrice = enabledPrices.length > 0 ? Math.max(...enabledPrices) : p.maxPrice;
        return { ...p, variants, totalStock, minPrice, maxPrice, updatedAt: new Date().toISOString().split('T')[0] };
      }
      return p;
    }));
  }
}
