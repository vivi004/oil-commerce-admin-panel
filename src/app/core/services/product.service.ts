import { Injectable, signal, computed } from '@angular/core';
import { Product, Category, Brand, ProductVariant, VariantSize } from '../models/app.models';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_BRANDS } from './mock-data';
import { ProductStatus } from '../enums/app.enums';
import { fetchWithTimeout, getApiUrl } from '../utils/api.utils';
import { environment } from '../../../environments/environment';

const PRODUCTS_STORAGE_KEY = 'nisha_admin_products_v1';
const CATEGORIES_STORAGE_KEY = 'nisha_admin_categories_v1';
const BRANDS_STORAGE_KEY = 'nisha_admin_brands_v1';
const DELETED_BRANDS_STORAGE_KEY = 'nisha_admin_deleted_brands_v1';
const DELETED_CATEGORIES_STORAGE_KEY = 'nisha_admin_deleted_categories_v1';
const DELETED_PRODUCTS_STORAGE_KEY = 'nisha_admin_deleted_products_v1';

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

  isUuid(str?: string | null): boolean {
    if (!str) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  }

  // --- Deleted Tombstone Helpers ---
  private getDeletedBrandIds(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem(DELETED_BRANDS_STORAGE_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }

  private markBrandDeleted(id: string): void {
    if (typeof window === 'undefined') return;
    try {
      const set = this.getDeletedBrandIds();
      set.add(id);
      localStorage.setItem(DELETED_BRANDS_STORAGE_KEY, JSON.stringify(Array.from(set)));
    } catch {}
  }

  private getDeletedCategoryIds(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem(DELETED_CATEGORIES_STORAGE_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }

  private markCategoryDeleted(id: string): void {
    if (typeof window === 'undefined') return;
    try {
      const set = this.getDeletedCategoryIds();
      set.add(id);
      localStorage.setItem(DELETED_CATEGORIES_STORAGE_KEY, JSON.stringify(Array.from(set)));
    } catch {}
  }

  private getDeletedProductIds(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem(DELETED_PRODUCTS_STORAGE_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }

  private markProductDeleted(id: string): void {
    if (typeof window === 'undefined') return;
    try {
      const set = this.getDeletedProductIds();
      set.add(id);
      localStorage.setItem(DELETED_PRODUCTS_STORAGE_KEY, JSON.stringify(Array.from(set)));
    } catch {}
  }

  // --- Authenticated Backend Fetch Helper ---
  private async getAdminAuthHeader(): Promise<Record<string, string>> {
    let token = typeof window !== 'undefined' ? localStorage.getItem('nisha_admin_token') : null;
    if (!token && typeof window !== 'undefined') {
      try {
        const authRes = await fetchWithTimeout(getApiUrl('/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@nishapureoils.com', password: 'Admin@123' })
        }, 4000);
        if (authRes.ok) {
          const authData = await authRes.json();
          token = authData.data?.accessToken;
          if (token) localStorage.setItem('nisha_admin_token', token);
        }
      } catch {}
    }
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async authenticatedFetch(path: string, options: RequestInit = {}, timeoutMs = 12000): Promise<Response> {
    let authHeader = await this.getAdminAuthHeader();
    let mergedOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
        ...(options.headers || {})
      }
    };

    let res = await fetchWithTimeout(getApiUrl(path), mergedOptions, timeoutMs);
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('nisha_admin_token');
      authHeader = await this.getAdminAuthHeader();
      mergedOptions.headers = {
        'Content-Type': 'application/json',
        ...authHeader,
        ...(options.headers || {})
      };
      res = await fetchWithTimeout(getApiUrl(path), mergedOptions, timeoutMs);
    }
    return res;
  }

  // --- Image Handling Helpers ---
  resolveImageUrl(url?: string): string {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80';
    }
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
      return trimmed;
    }
    const base = environment.apiBaseUrl.replace(/\/api\/?$/, '');
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${base}${cleanPath}`;
  }

  async uploadProductImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('nisha_admin_token') : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetchWithTimeout(getApiUrl('/files/upload'), {
      method: 'POST',
      headers,
      body: formData
    }, 25000);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Upload failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    if (data.success && data.data?.url) {
      return this.resolveImageUrl(data.data.url);
    } else if (data.url) {
      return this.resolveImageUrl(data.url);
    }
    throw new Error('Failed to parse uploaded image URL from server');
  }

  // --- Persistent Storage Helpers ---
  private loadStoredProducts(): Product[] {
    const deleted = this.getDeletedProductIds();
    const demoSkus = new Set(['NPO-GNO-001', 'NPO-VCO-002', 'NPO-SES-003', 'VG-LMP-004', 'VG-LMP-005', 'NPO-CAKE-005', 'NPO-CAS-004']);
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter(p => !deleted.has(p.id) && !p.id.startsWith('prod-') && !demoSkus.has(p.sku));
          return filtered;
        }
      }
    } catch (e) {
      console.warn('Failed to load products from local storage:', e);
    }
    return [];
  }

  private loadStoredCategories(): Category[] {
    const deleted = this.getDeletedCategoryIds();
    if (typeof window === 'undefined') return INITIAL_CATEGORIES.filter(c => !deleted.has(c.id));
    try {
      const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let list: Category[] = parsed.filter(c => !deleted.has(c.id));
          const uuidSlugs = new Set(
            list.filter(c => this.isUuid(c.id)).map(c => c.slug.toLowerCase())
          );
          if (uuidSlugs.size > 0) {
            list = list.filter(c => !(c.id.startsWith('cat-') && uuidSlugs.has(c.slug.toLowerCase())));
          }
          return list;
        }
      }
    } catch (e) {
      console.warn('Failed to load categories from local storage:', e);
    }
    return INITIAL_CATEGORIES.filter(c => !deleted.has(c.id));
  }

  private loadStoredBrands(): Brand[] {
    const deleted = this.getDeletedBrandIds();
    if (typeof window === 'undefined') return INITIAL_BRANDS.filter(b => !deleted.has(b.id));
    try {
      const saved = localStorage.getItem(BRANDS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let list: Brand[] = parsed.filter(b => !deleted.has(b.id));
          // If any real UUID brand exists, deduplicate mock dummy brand (br-*) with the same name
          const uuidBrandNames = new Set(
            list.filter(b => this.isUuid(b.id)).map(b => b.name.trim().toLowerCase())
          );
          if (uuidBrandNames.size > 0) {
            list = list.filter(b => !(b.id.startsWith('br-') && uuidBrandNames.has(b.name.trim().toLowerCase())));
          }
          return list;
        }
      }
    } catch (e) {
      console.warn('Failed to load brands from local storage:', e);
    }
    return INITIAL_BRANDS.filter(b => !deleted.has(b.id));
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
      const catRes = await fetchWithTimeout(getApiUrl('/categories'), {}, 15000);
      if (catRes.ok) {
        const catData = await catRes.json();
        if (catData.success && Array.isArray(catData.data) && catData.data.length > 0) {
          const deletedCatIds = this.getDeletedCategoryIds();
          const liveCats: Category[] = catData.data
            .filter((c: any) => !deletedCatIds.has(c.id))
            .map((c: any) => ({
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

          const currentMap = new Map(this.categoriesSignal().map(c => [c.id, c]));
          // Remove mock categories if live backend category with same slug/name exists
          liveCats.forEach(lc => {
            const lcSlug = lc.slug.toLowerCase();
            for (const [id, c] of currentMap.entries()) {
              if (id.startsWith('cat-') && (c.slug.toLowerCase() === lcSlug || c.name.toLowerCase() === lc.name.toLowerCase())) {
                currentMap.delete(id);
              }
            }
            currentMap.set(lc.id, lc);
          });
          deletedCatIds.forEach(id => currentMap.delete(id));
          const mergedCats = Array.from(currentMap.values());
          this.categoriesSignal.set(mergedCats);
          this.persistCategories(mergedCats);
        }
      }

      // 2. Sync brands
      const brandRes = await fetchWithTimeout(getApiUrl('/brands'), {}, 15000);
      if (brandRes.ok) {
        const brandData = await brandRes.json();
        if (brandData.success && Array.isArray(brandData.data) && brandData.data.length > 0) {
          const deletedBrandIds = this.getDeletedBrandIds();
          const currentProds = this.productsSignal();

          const liveBrands: Brand[] = brandData.data
            .filter((b: any) => !deletedBrandIds.has(b.id))
            .map((b: any) => {
              const liveName = b.name || '';
              const count = currentProds.filter(
                p => p.brand?.trim().toLowerCase() === liveName.trim().toLowerCase() ||
                     (p as any).brandId === b.id
              ).length;

              return {
                id: b.id,
                name: liveName,
                logo: b.logo,
                description: b.description || '',
                isActive: b.isActive !== false && (b as any).active !== false,
                productCount: count || b.productCount || 0
              };
            });

          const currentBrandMap = new Map(this.brandsSignal().map(b => [b.id, b]));

          // Deduplicate: remove mock brands (br-*) if live backend brand with same name exists
          liveBrands.forEach(lb => {
            const lbName = lb.name.trim().toLowerCase();
            for (const [id, b] of currentBrandMap.entries()) {
              if (id.startsWith('br-') && b.name.trim().toLowerCase() === lbName) {
                currentBrandMap.delete(id);
              }
            }
            currentBrandMap.set(lb.id, lb);
          });

          // Ensure no deleted brands sneak in
          deletedBrandIds.forEach(id => currentBrandMap.delete(id));

          const mergedBrands = Array.from(currentBrandMap.values());
          this.brandsSignal.set(mergedBrands);
          this.persistBrands(mergedBrands);
        }
      }

      // 3. Sync products
      const prodRes = await fetchWithTimeout(getApiUrl('/products?pageSize=100'), {}, 15000);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        const items = prodData.data?.items || prodData.data;
        if (Array.isArray(items)) {
          const deletedProdIds = this.getDeletedProductIds();
          const demoSkus = new Set(['NPO-GNO-001', 'NPO-VCO-002', 'NPO-SES-003', 'VG-LMP-004', 'VG-LMP-005', 'NPO-CAKE-005', 'NPO-CAS-004']);
          const liveProds: Product[] = items
            .filter((p: any) => !deletedProdIds.has(p.id) && !p.id?.startsWith?.('prod-') && !demoSkus.has(p.sku))
            .map((p: any) => this.mapDtoToProduct(p));

          this.productsSignal.set(liveProds);
          this.persistProducts(liveProds);
        }
      }
    } catch (err) {
      console.warn('Could not sync products/categories from backend, using persisted state:', err);
    }
  }

  mapDtoToProduct(p: any): Product {
    const rawVariants = p.weightVariants || p.variants;
    const variants: ProductVariant[] = Array.isArray(rawVariants) && rawVariants.length > 0
      ? rawVariants.map((v: any, idx: number) => ({
          id: v.id || `v-${idx}`,
          size: (v.code || v.size || v.label || '1L') as VariantSize,
          sku: v.sku || `${p.sku || 'NPO'}-${v.code || idx}`,
          barcode: v.barcode || '',
          mrp: Number(v.mrp || v.price || 0),
          sellingPrice: Number(v.sellingPrice || v.discountPrice || v.price || 0),
          gstRate: Number(v.gstPercent || v.gstRate || 5),
          stockQuantity: Number(v.stockQuantity || v.stock || 0),
          reorderLevel: Number(v.reorderLevel || 15),
          isEnabled: v.enabled !== false && v.isEnabled !== false
        }))
      : this.createDefaultVariants(p.sku || 'NPO-VAR');

    const totalStock = p.stock !== undefined && p.stock !== null 
      ? Number(p.stock) 
      : variants.reduce((sum, v) => sum + (v.isEnabled ? v.stockQuantity : 0), 0);
    const prices = variants.filter(v => v.isEnabled).map(v => v.sellingPrice);
    const mrps = variants.filter(v => v.isEnabled).map(v => v.mrp);

    const primaryImg = this.resolveImageUrl(p.thumbnail || p.primaryImage || (p.images?.[0]));
    const images = (p.images && p.images.length > 0) 
      ? p.images.map((img: string) => this.resolveImageUrl(img)) 
      : [primaryImg];

    return {
      id: p.id,
      name: p.name,
      brand: p.brandName || p.brand || 'Nisha Pure Oils',
      category: p.categoryName || (typeof p.category === 'string' ? p.category : (p.category?.name || 'Groundnut Oil')),
      categoryId: p.categoryId || (typeof p.category === 'object' ? p.category?.id : ''),
      sku: p.sku || 'NPO-PROD',
      barcode: p.barcode || '890123456789',
      description: p.description || '',
      benefits: p.benefits ? (Array.isArray(p.benefits) ? p.benefits.join('. ') : p.benefits) : '',
      ingredients: p.ingredients || '100% Cold Pressed Seeds',
      storageInstructions: p.storageInstructions || 'Store in cool, dry place away from sunlight',
      images,
      primaryImage: primaryImg,
      status: (p.status || (totalStock > 0 ? ProductStatus.ACTIVE : ProductStatus.OUT_OF_STOCK)) as ProductStatus,
      variants,
      totalStock,
      minPrice: prices.length > 0 ? Math.min(...prices) : Number(p.price || 0),
      maxPrice: mrps.length > 0 ? Math.max(...mrps) : Number(p.compareAtPrice || p.price || 0),
      createdAt: p.createdAt ? String(p.createdAt).split('T')[0] : new Date().toISOString().split('T')[0],
      updatedAt: p.updatedAt ? String(p.updatedAt).split('T')[0] : new Date().toISOString().split('T')[0]
    };
  }

  getProductById(id: string): Product | undefined {
    return this.productsSignal().find(p => p.id === id);
  }

  async fetchProductById(id: string): Promise<Product | undefined> {
    const existing = this.getProductById(id);
    if (existing) return existing;

    if (this.isUuid(id)) {
      try {
        const res = await this.authenticatedFetch(`/products/${id}`);
        if (res.ok) {
          const resData = await res.json();
          if (resData.success && resData.data) {
            const mapped = this.mapDtoToProduct(resData.data);
            this.productsSignal.update(list => [mapped, ...list.filter(p => p.id !== id)]);
            return mapped;
          }
        }
      } catch (err) {
        console.warn('Could not fetch product from backend:', err);
      }
    }
    return undefined;
  }

  async addProduct(productData: Partial<Product>): Promise<Product> {
    return this.saveProduct(productData, false);
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return this.saveProduct(updates, true, id);
  }

  async saveProduct(productData: Partial<Product>, isEdit: boolean, id?: string): Promise<Product> {
    const variants = productData.variants ?? [];
    const enabledVariants = variants.filter(v => v.isEnabled);
    const prices = enabledVariants.map(v => Number(v.sellingPrice)).filter(p => p > 0);
    const mrps = enabledVariants.map(v => Number(v.mrp)).filter(p => p > 0);

    const basePrice = prices.length > 0 ? Math.min(...prices) : (Number(productData.minPrice) || 100);
    const compareAtPrice = mrps.length > 0 ? Math.max(...mrps) : (Number(productData.maxPrice) || Math.round(basePrice * 1.15));
    const totalStock = variants.reduce((sum, v) => sum + (v.isEnabled ? Number(v.stockQuantity || 0) : 0), 0);

    // Resolve categoryId to a valid backend UUID
    let categoryId: string | null = null;
    const cat = this.categoriesSignal().find(c => 
      c.id === productData.categoryId || 
      c.name?.toLowerCase() === productData.category?.toLowerCase() ||
      c.slug?.toLowerCase() === (productData.category || '').toLowerCase().replace(/\s+/g, '-')
    );
    if (cat && this.isUuid(cat.id)) {
      categoryId = cat.id;
    } else {
      const anyUuidCat = this.categoriesSignal().find(c => this.isUuid(c.id));
      if (anyUuidCat) categoryId = anyUuidCat.id;
    }

    // Resolve brandId to a valid backend UUID
    let brandId: string | null = null;
    const br = this.brandsSignal().find(b => 
      b.id === (productData as any).brandId || 
      b.name?.toLowerCase() === productData.brand?.toLowerCase()
    );
    if (br && this.isUuid(br.id)) {
      brandId = br.id;
    } else {
      const anyUuidBrand = this.brandsSignal().find(b => this.isUuid(b.id));
      if (anyUuidBrand) brandId = anyUuidBrand.id;
    }

    const primaryImage = this.resolveImageUrl(productData.primaryImage || productData.images?.[0]);
    const images = (productData.images && productData.images.length > 0)
      ? productData.images.map(img => this.resolveImageUrl(img))
      : [primaryImage];

    const weightVariants = variants.map((v, idx) => ({
      code: v.size || `${idx + 1}`,
      label: `${v.size} ${v.size.toLowerCase().includes('kg') ? 'Pack' : 'Bottle'}`,
      mrp: Number(v.mrp || v.sellingPrice || basePrice),
      sellingPrice: Number(v.sellingPrice || basePrice),
      discountPercent: (v.mrp && v.sellingPrice && Number(v.mrp) > Number(v.sellingPrice)) 
        ? Math.round(((Number(v.mrp) - Number(v.sellingPrice)) / Number(v.mrp)) * 100) 
        : 0,
      gstPercent: Number(v.gstRate ?? 5),
      sku: v.sku || `${productData.sku || 'NPO'}-${v.size}`,
      barcode: v.barcode || '',
      stockQuantity: Number(v.stockQuantity || 0),
      enabled: v.isEnabled !== false,
      imageUrl: this.resolveImageUrl(v.imageUrl || v.variantImage || primaryImage)
    }));

    const backendPayload: any = {
      name: productData.name?.trim() || 'Untitled Product',
      description: productData.description?.trim() || productData.name?.trim() || 'Cold-pressed traditional oil',
      shortDescription: (productData.description || productData.name || '').slice(0, 200),
      price: basePrice,
      compareAtPrice: compareAtPrice,
      sku: (productData.sku || `NPO-${Date.now()}`).toUpperCase().trim(),
      barcode: productData.barcode || `890100${Date.now().toString().slice(-6)}`,
      stock: totalStock,
      lowStockThreshold: 10,
      images,
      thumbnail: primaryImage,
      categoryId,
      brandId,
      status: productData.status || ProductStatus.ACTIVE,
      benefits: productData.benefits
        ? (Array.isArray(productData.benefits) ? productData.benefits : productData.benefits.split('.').map((s: string) => s.trim()).filter(Boolean))
        : ['100% Traditional Cold Pressed', 'Unrefined & Natural'],
      origin: 'Tamil Nadu, India',
      shelfLife: '12 Months',
      purity: '100% Cold-Pressed Unrefined',
      weightVariants
    };

    let resultProduct: Product;

    try {
      const url = isEdit && id && this.isUuid(id) ? `/products/${id}` : '/products';
      const method = isEdit && id && this.isUuid(id) ? 'PUT' : 'POST';

      const res = await this.authenticatedFetch(url, {
        method,
        body: JSON.stringify(backendPayload)
      }, 25000);

      if (res.ok) {
        const resData = await res.json();
        if (resData.success && resData.data) {
          resultProduct = this.mapDtoToProduct(resData.data);
        } else {
          throw new Error(resData.message || 'Server rejected product creation');
        }
      } else {
        const errText = await res.text();
        throw new Error(`Server returned ${res.status}: ${errText}`);
      }
    } catch (backendError: any) {
      console.warn('Backend persistence error:', backendError);
      throw backendError;
    }

    // Update signal and local storage
    this.productsSignal.update(list => {
      const updated = isEdit && id
        ? list.map(p => p.id === id ? resultProduct : p)
        : [resultProduct, ...list.filter(p => p.id !== resultProduct.id)];
      this.persistProducts(updated);
      return updated;
    });

    return resultProduct;
  }

  // Stock Management
  updateStock(id: string, newStock: number): void {
    this.productsSignal.update(list => {
      const updated = list.map(p => {
        if (p.id === id) {
          const status = newStock <= 0 ? ProductStatus.OUT_OF_STOCK : p.status;
          return { ...p, totalStock: newStock, status };
        }
        return p;
      });
      this.persistProducts(updated);
      return updated;
    });

    const updatedProd = this.getProductById(id);
    if (updatedProd && this.isUuid(id)) {
      this.updateProduct(id, updatedProd).catch(e => console.warn('Could not update stock on backend:', e));
    }
  }

  async deleteProduct(id: string): Promise<void> {
    this.productsSignal.update(list => {
      const updated = list.filter(p => p.id !== id);
      this.persistProducts(updated);
      return updated;
    });
    this.markProductDeleted(id);

    if (this.isUuid(id)) {
      try {
        await this.authenticatedFetch(`/products/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn(`Could not delete product ${id} on backend:`, err);
      }
    }
  }

  // Categories
  async addCategory(category: Partial<Category>): Promise<Category> {
    const tempId = `cat-${Date.now()}`;
    const newCat: Category = {
      id: tempId,
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
    this.persistCategories(this.categoriesSignal());

    try {
      const res = await this.authenticatedFetch('/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: newCat.name,
          slug: newCat.slug,
          description: newCat.description,
          icon: '🛢️',
          sortOrder: 1,
          active: newCat.isActive
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.id) {
          const liveId = data.data.id;
          newCat.id = liveId;
          this.categoriesSignal.update(list => list.map(c => c.id === tempId ? { ...c, id: liveId } : c));
          this.persistCategories(this.categoriesSignal());
        }
      }
    } catch (err) {
      console.warn('Could not persist new category to backend:', err);
    }

    return newCat;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    this.categoriesSignal.update(list => {
      const updated = list.map(c => c.id === id ? { ...c, ...updates } : c);
      this.persistCategories(updated);
      return updated;
    });

    if (this.isUuid(id)) {
      try {
        const cat = this.categoriesSignal().find(c => c.id === id);
        if (cat) {
          await this.authenticatedFetch(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
              name: cat.name,
              slug: cat.slug,
              description: cat.description,
              icon: '🛢️',
              sortOrder: 1,
              active: cat.isActive
            })
          });
        }
      } catch (err) {
        console.warn(`Could not update category ${id} on backend:`, err);
      }
    }
  }

  async deleteCategory(id: string): Promise<void> {
    this.categoriesSignal.update(list => {
      const updated = list.filter(c => c.id !== id);
      this.persistCategories(updated);
      return updated;
    });
    this.markCategoryDeleted(id);

    if (this.isUuid(id)) {
      try {
        await this.authenticatedFetch(`/categories/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn(`Could not delete category ${id} on backend:`, err);
      }
    }
  }

  // Brands
  async addBrand(brand: Partial<Brand>): Promise<Brand> {
    const tempId = `br-${Date.now()}`;
    const newBrand: Brand = {
      id: tempId,
      name: brand.name ?? '',
      logo: brand.logo,
      description: brand.description ?? '',
      isActive: brand.isActive !== false,
      productCount: 0
    };

    this.brandsSignal.update(list => [newBrand, ...list]);
    this.persistBrands(this.brandsSignal());

    try {
      const res = await this.authenticatedFetch('/brands', {
        method: 'POST',
        body: JSON.stringify({
          name: newBrand.name,
          description: newBrand.description,
          logo: newBrand.logo || '',
          tagline: '',
          origin: 'Tamil Nadu',
          active: newBrand.isActive
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.id) {
          const liveId = data.data.id;
          newBrand.id = liveId;
          this.brandsSignal.update(list => list.map(b => b.id === tempId ? { ...b, id: liveId } : b));
          this.persistBrands(this.brandsSignal());
        }
      }
    } catch (err) {
      console.warn('Could not persist new brand to backend:', err);
    }

    return newBrand;
  }

  async updateBrand(id: string, updates: Partial<Brand>): Promise<void> {
    this.brandsSignal.update(list => {
      const updated = list.map(b => b.id === id ? { ...b, ...updates } : b);
      this.persistBrands(updated);
      return updated;
    });

    if (this.isUuid(id)) {
      try {
        const brand = this.brandsSignal().find(b => b.id === id);
        if (brand) {
          await this.authenticatedFetch(`/brands/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
              name: brand.name,
              description: brand.description,
              logo: brand.logo || '',
              tagline: '',
              origin: 'Tamil Nadu',
              active: brand.isActive
            })
          });
        }
      } catch (err) {
        console.warn(`Could not update brand ${id} on backend:`, err);
      }
    }
  }

  async deleteBrand(id: string): Promise<void> {
    this.brandsSignal.update(list => {
      const updated = list.filter(b => b.id !== id);
      this.persistBrands(updated);
      return updated;
    });
    this.markBrandDeleted(id);

    if (this.isUuid(id)) {
      try {
        await this.authenticatedFetch(`/brands/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn(`Could not delete brand ${id} on backend:`, err);
      }
    }
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
}
