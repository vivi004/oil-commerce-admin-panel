import { Injectable, signal, computed } from '@angular/core';
import { Product, Category, Brand, ProductVariant, VariantSize } from '../models/app.models';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_BRANDS } from './mock-data';
import { ProductStatus } from '../enums/app.enums';
import { fetchWithTimeout, getApiUrl } from '../utils/api.utils';
import { environment } from '../../../environments/environment';

const PRODUCTS_STORAGE_KEY = 'nisha_admin_products_v1';
const CATEGORIES_STORAGE_KEY = 'nisha_admin_categories_v1';
const BRANDS_STORAGE_KEY = 'nisha_admin_brands_v1';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly productsSignal = signal<Product[]>(this.loadStoredProducts());
  private readonly categoriesSignal = signal<Category[]>(this.loadStoredCategories());
  private readonly brandsSignal = signal<Brand[]>(this.loadStoredBrands());

  readonly storefrontUrl: string = (environment as any).storefrontUrl || 'http://localhost:4200';

  readonly products = this.productsSignal.asReadonly();
  readonly categories = this.categoriesSignal.asReadonly();
  readonly brands = this.brandsSignal.asReadonly();

  readonly totalProductsCount = computed(() => this.productsSignal().length);
  readonly activeProductsCount = computed(() => this.productsSignal().filter(p => p.status === ProductStatus.ACTIVE).length);
  readonly lowStockProducts = computed(() => {
    return this.productsSignal().filter(p => p.totalStock <= 70);
  });

  constructor() {
    this.syncFromBackend();
  }

  // --- Persistent Storage Helpers ---
  private loadStoredProducts(): Product[] {
    if (typeof window === 'undefined') return INITIAL_PRODUCTS;
    try {
      const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load products from local storage:', e);
    }
    return INITIAL_PRODUCTS;
  }

  private loadStoredCategories(): Category[] {
    if (typeof window === 'undefined') return INITIAL_CATEGORIES;
    try {
      const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load categories from local storage:', e);
    }
    return INITIAL_CATEGORIES;
  }

  private loadStoredBrands(): Brand[] {
    if (typeof window === 'undefined') return INITIAL_BRANDS;
    try {
      const saved = localStorage.getItem(BRANDS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load brands from local storage:', e);
    }
    return INITIAL_BRANDS;
  }

  private persistProducts(products: Product[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
      } catch (e) {
        console.warn('Failed to persist products to local storage:', e);
      }
    }
  }

  private persistCategories(categories: Category[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
      } catch (e) {
        console.warn('Failed to persist categories to local storage:', e);
      }
    }
  }

  private persistBrands(brands: Brand[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(BRANDS_STORAGE_KEY, JSON.stringify(brands));
      } catch (e) {
        console.warn('Failed to persist brands to local storage:', e);
      }
    }
  }

  getStorefrontProductUrl(idOrSlug: string): string {
    return `${this.storefrontUrl}/products/${idOrSlug}`;
  }

  getStorefrontCategoryUrl(slug: string): string {
    return `${this.storefrontUrl}/categories/${slug}`;
  }

  async syncFromBackend(): Promise<void> {
    try {
      // 1. Sync categories
      const catRes = await fetchWithTimeout(getApiUrl('/categories'), {}, 2000);
      if (catRes.ok) {
        const catData = await catRes.json();
        if (catData.success && Array.isArray(catData.data) && catData.data.length > 0) {
          const liveCats: Category[] = catData.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
            description: c.description || '',
            image: c.image || 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
            productCount: c.productCount || 0,
            isActive: c.isActive !== false,
            seoTitle: c.seoTitle || c.name,
            seoDescription: c.seoDescription || c.description
          }));

          // Merge without losing locally added categories
          const currentMap = new Map(this.categoriesSignal().map(c => [c.id, c]));
          liveCats.forEach(lc => currentMap.set(lc.id, lc));
          const mergedCats = Array.from(currentMap.values());
          this.categoriesSignal.set(mergedCats);
          this.persistCategories(mergedCats);
        }
      }

      // 2. Sync brands
      const brandRes = await fetchWithTimeout(getApiUrl('/brands'), {}, 2000);
      if (brandRes.ok) {
        const brandData = await brandRes.json();
        if (brandData.success && Array.isArray(brandData.data) && brandData.data.length > 0) {
          const liveBrands: Brand[] = brandData.data.map((b: any) => ({
            id: b.id,
            name: b.name,
            logo: b.logo,
            description: b.description || '',
            isActive: b.isActive !== false,
            productCount: b.productCount || 0
          }));

          // Merge without losing locally added brands
          const currentBrandMap = new Map(this.brandsSignal().map(b => [b.id, b]));
          liveBrands.forEach(lb => currentBrandMap.set(lb.id, lb));
          const mergedBrands = Array.from(currentBrandMap.values());
          this.brandsSignal.set(mergedBrands);
          this.persistBrands(mergedBrands);
        }
      }

      // 3. Sync products
      const prodRes = await fetchWithTimeout(getApiUrl('/products?pageSize=100'), {}, 2000);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        const items = prodData.data?.items || prodData.data;
        if (Array.isArray(items) && items.length > 0) {
          const liveProds: Product[] = items.map((p: any) => {
            const variants: ProductVariant[] = Array.isArray(p.variants || p.weightVariants) 
              ? (p.variants || p.weightVariants).map((v: any, idx: number) => ({
                  id: v.id || `v-${idx}`,
                  size: (v.size || v.weightCode || '1L') as VariantSize,
                  sku: v.sku || `${p.sku || 'NPO'}-${v.size || idx}`,
                  barcode: v.barcode || '',
                  mrp: Number(v.mrp || v.price || 0),
                  sellingPrice: Number(v.sellingPrice || v.discountPrice || v.price || 0),
                  gstRate: Number(v.gstRate || 5),
                  stockQuantity: Number(v.stockQuantity || v.stock || 50),
                  reorderLevel: Number(v.reorderLevel || 15),
                  isEnabled: v.isEnabled !== false
                }))
              : this.createDefaultVariants(p.sku || 'NPO-VAR');

            const totalStock = variants.reduce((sum, v) => sum + (v.isEnabled ? v.stockQuantity : 0), 0);
            const prices = variants.filter(v => v.isEnabled).map(v => v.sellingPrice);

            return {
              id: p.id,
              name: p.name,
              brand: p.brand || 'Nisha Pure Oils',
              category: typeof p.category === 'string' ? p.category : (p.category?.name || 'Groundnut Oil'),
              categoryId: p.categoryId || 'cat-groundnut',
              sku: p.sku || 'NPO-PROD',
              barcode: p.barcode || '890123456789',
              description: p.description || '',
              benefits: p.benefits ? (Array.isArray(p.benefits) ? p.benefits.join('. ') : p.benefits) : '',
              ingredients: p.ingredients || '100% Cold Pressed Seeds',
              storageInstructions: p.storageInstructions || 'Store in cool, dry place away from sunlight',
              images: p.images && p.images.length > 0 ? p.images : [p.primaryImage || 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80'],
              primaryImage: p.primaryImage || (p.images?.[0] || 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80'),
              status: (p.status || (totalStock > 0 ? ProductStatus.ACTIVE : ProductStatus.OUT_OF_STOCK)) as ProductStatus,
              variants,
              totalStock,
              minPrice: prices.length > 0 ? Math.min(...prices) : Number(p.basePrice || 0),
              maxPrice: prices.length > 0 ? Math.max(...prices) : Number(p.basePrice || 0),
              createdAt: p.createdAt ? String(p.createdAt).split('T')[0] : '2025-01-01',
              updatedAt: p.updatedAt ? String(p.updatedAt).split('T')[0] : '2025-01-01'
            };
          });

          // Keep user's locally edited products, updating only backend-tracked products
          const currentProdMap = new Map(this.productsSignal().map(p => [p.id, p]));
          liveProds.forEach(lp => {
            // If user hasn't edited this product locally (or it's a new backend item), accept backend
            if (!currentProdMap.has(lp.id)) {
              currentProdMap.set(lp.id, lp);
            }
          });
          const mergedProds = Array.from(currentProdMap.values());
          this.productsSignal.set(mergedProds);
          this.persistProducts(mergedProds);
        }
      }
    } catch (err) {
      console.warn('Could not sync products/categories from backend, using persisted state:', err);
    }
  }

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

    this.productsSignal.update(list => {
      const updated = [newProduct, ...list];
      this.persistProducts(updated);
      return updated;
    });

    // Asynchronously try to create on backend
    this.sendProductToBackend('POST', '/products', newProduct);

    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): void {
    this.productsSignal.update(list => {
      const updated = list.map(p => {
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
      });
      this.persistProducts(updated);
      return updated;
    });

    // Asynchronously try to update on backend
    const updatedProd = this.getProductById(id);
    if (updatedProd) {
      this.sendProductToBackend('PUT', `/products/${id}`, updatedProd);
    }
  }

  deleteProduct(id: string): void {
    this.productsSignal.update(list => {
      const updated = list.filter(p => p.id !== id);
      this.persistProducts(updated);
      return updated;
    });

    // Asynchronously delete on backend if UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('nisha_admin_token') : null;
      if (token) {
        fetchWithTimeout(getApiUrl(`/products/${id}`), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }, 1500).catch(() => {});
      }
    }
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
    this.categoriesSignal.update(list => {
      const updated = [newCat, ...list];
      this.persistCategories(updated);
      return updated;
    });
  }

  updateCategory(id: string, updates: Partial<Category>): void {
    this.categoriesSignal.update(list => {
      const updated = list.map(c => c.id === id ? { ...c, ...updates } : c);
      this.persistCategories(updated);
      return updated;
    });
  }

  deleteCategory(id: string): void {
    this.categoriesSignal.update(list => {
      const updated = list.filter(c => c.id !== id);
      this.persistCategories(updated);
      return updated;
    });
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
    this.brandsSignal.update(list => {
      const updated = [newBrand, ...list];
      this.persistBrands(updated);
      return updated;
    });
  }

  updateBrand(id: string, updates: Partial<Brand>): void {
    this.brandsSignal.update(list => {
      const updated = list.map(b => b.id === id ? { ...b, ...updates } : b);
      this.persistBrands(updated);
      return updated;
    });
  }

  deleteBrand(id: string): void {
    this.brandsSignal.update(list => {
      const updated = list.filter(b => b.id !== id);
      this.persistBrands(updated);
      return updated;
    });
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
      isEnabled: ['200ml', '500ml', '1L', '5L'].includes(size)
    }));
  }

  updateVariantStock(productId: string, sku: string, newStock: number): void {
    this.productsSignal.update(products => {
      const updated = products.map(p => {
        if (p.id === productId) {
          const variants = p.variants.map(v => v.sku === sku ? { ...v, stockQuantity: newStock } : v);
          const totalStock = variants.reduce((sum, v) => sum + (v.isEnabled ? v.stockQuantity : 0), 0);
          return { ...p, variants, totalStock, updatedAt: new Date().toISOString().split('T')[0] };
        }
        return p;
      });
      this.persistProducts(updated);
      return updated;
    });
  }

  updateVariantPriceAndStock(productId: string, sku: string, sellingPrice: number, mrp: number, stock: number): void {
    this.productsSignal.update(products => {
      const updated = products.map(p => {
        if (p.id === productId) {
          const variants = p.variants.map(v => v.sku === sku ? { ...v, sellingPrice, mrp, stockQuantity: stock } : v);
          const totalStock = variants.reduce((sum, v) => sum + (v.isEnabled ? v.stockQuantity : 0), 0);
          const enabledPrices = variants.filter(v => v.isEnabled).map(v => v.sellingPrice);
          const minPrice = enabledPrices.length > 0 ? Math.min(...enabledPrices) : p.minPrice;
          const maxPrice = enabledPrices.length > 0 ? Math.max(...enabledPrices) : p.maxPrice;
          return { ...p, variants, totalStock, minPrice, maxPrice, updatedAt: new Date().toISOString().split('T')[0] };
        }
        return p;
      });
      this.persistProducts(updated);
      return updated;
    });
  }

  private sendProductToBackend(method: 'POST' | 'PUT', path: string, product: Product): void {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('nisha_admin_token');
    if (!token) return;

    fetchWithTimeout(getApiUrl(path), {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: product.name,
        brand: product.brand,
        categoryId: product.categoryId,
        sku: product.sku,
        description: product.description,
        primaryImage: product.primaryImage,
        images: product.images,
        status: product.status,
        variants: product.variants
      })
    }, 1500).catch(() => {
      // Gracefully handled; local state is preserved
    });
  }
}
