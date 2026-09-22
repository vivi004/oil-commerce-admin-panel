import { Category, Brand, Product, Order, StockMovement, Tenant, SubscriptionPlan, Customer, PaymentTransaction, AuditLogItem, SheetDiffItem } from '../models/app.models';
import { OrderStatus, ProductStatus, StockMovementType, TenantStatus, SubscriptionTier } from '../enums/app.enums';
import { Role } from '../enums/role.enum';

export const INITIAL_CATEGORIES: Category[] = [
  { id: '57c98031-de6f-4a17-9d72-711c9da67eb2', name: 'Groundnut Oil', slug: 'groundnut-oil', description: 'Traditional wood-pressed Kadalai Ennai', isActive: true, productCount: 1 },
  { id: '2f137c8c-f615-459f-8fe5-fb73138ca0a5', name: 'Coconut Oil', slug: 'coconut-oil', description: 'Pure virgin cold-pressed Thengai Ennai', isActive: true, productCount: 1 },
  { id: 'fdfa197f-56b5-427e-9551-720dc50fdb28', name: 'Sesame Oil (Gingelly)', slug: 'sesame-oil', description: 'Traditional Nalla Ennai with palm jaggery', isActive: true, productCount: 1 },
  { id: 'db8abdb3-00ea-4891-aa9c-5bf75450a68c', name: 'Castor Oil', slug: 'castor-oil', description: 'Pure thick cold-pressed Amanakku Ennai', isActive: true, productCount: 1 },
  { id: '995bbae7-ac91-4509-8aad-1bff2ee87476', name: 'Lamp Oil (Puja Oil)', slug: 'lamp-oil', description: 'Pancha Deepam sacred divine puja oil', isActive: true, productCount: 1 },
  { id: '86c7b428-cc73-4c81-815b-a6d425608769', name: 'Neem Oil', slug: 'neem-oil', description: 'Organic botanical cold-pressed neem seed oil', isActive: true, productCount: 1 },
  { id: '13cf0449-48a8-42b5-88ea-ffa8caf52af7', name: 'Mahua Oil (Iluppai)', slug: 'mahua-oil', description: 'Heritage Iluppai Ennai for temple lamps & massage', isActive: true, productCount: 1 },
  { id: '78a9f143-a3e0-4965-aa72-706f0c458d28', name: 'Palm Oil', slug: 'palm-oil', description: 'Refined culinary palm olein for high-heat cooking', isActive: true, productCount: 1 },
  { id: '2697bded-5084-429d-a6ac-f49116d4c80f', name: 'Sunflower Oil', slug: 'sunflower-oil', description: 'Pure cold-pressed organic sunflower seed oil rich in Vitamin E', isActive: true, productCount: 1 },
  { id: 'b56c1d04-c1b5-48f8-a026-54aea8cfefcc', name: 'Edible Oil', slug: 'edible-oil', description: 'Premium multi-seed traditional cold-pressed edible cooking oils', isActive: true, productCount: 1 }
];

export const INITIAL_BRANDS: Brand[] = [
  { id: 'be77a6d8-3045-476c-ab40-51d1d8fdd0f0', name: 'Nisha Pure Oils', description: '100% Traditional Vaagai Wood Churned & Cold-Pressed Virgin Oils (Groundnut, Coconut, Sesame, Castor, Neem, Mahua, Lamp)', isActive: true, productCount: 7 },
  { id: '6bd89be4-a7c9-4093-8991-3149f7e31886', name: 'Roshini Gold', description: 'High-Heat Culinary Cooking Label formulated for high heat stability (Sunflower Oil)', isActive: true, productCount: 1 },
  { id: '71a030aa-b37f-4a69-80a9-f88c2670cc3d', name: 'Rosi Gold', description: 'Wholesome Kitchen & Frying Commodities Label (Palm Oil)', isActive: true, productCount: 1 },
  { id: 'dc435e49-76ab-4be5-a8e2-47c5b0567a9d', name: 'Varshini Gold', description: 'Premium Multi-Seed Culinary & Gold Standard Blends (Edible Oil)', isActive: true, productCount: 1 },
  { id: 'br-other', name: 'Other Brands', description: 'Third-party agro partner commodities', isActive: true, productCount: 0 }
];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant-nisha-1',
    name: 'Nisha Pure Oils',
    businessName: 'Nisha Agro & Cold Pressed Oil Mills LLP',
    ownerName: 'Kaviarasu Murugesan',
    email: 'kaviarasu@nishapureoils.com',
    phone: '+91 98421 88990',
    status: TenantStatus.ACTIVE,
    subscriptionPlanId: 'sub-enterprise',
    subscriptionPlanName: 'Enterprise Mill Plan',
    planTier: SubscriptionTier.ENTERPRISE,
    createdAt: '2024-03-15',
    mrr: 14999,
    totalOrders: 1420,
    productCount: 18
  },
  {
    id: 'tenant-varshini-2',
    name: 'Varshini Gold Agro',
    businessName: 'Varshini Gold Oils & Puja Products Ltd',
    ownerName: 'Subramanian V',
    email: 'admin@varshinigold.in',
    phone: '+91 94432 10887',
    status: TenantStatus.ACTIVE,
    subscriptionPlanId: 'sub-premium',
    subscriptionPlanName: 'Business Premium',
    planTier: SubscriptionTier.PREMIUM,
    createdAt: '2024-06-20',
    mrr: 7999,
    totalOrders: 640,
    productCount: 9
  },
  {
    id: 'tenant-kavery-3',
    name: 'Kaveri Traditional Oils',
    businessName: 'Kaveri Ghani Mills Erode',
    ownerName: 'Palaniappan C',
    email: 'info@kaveriils.com',
    phone: '+91 98422 66778',
    status: TenantStatus.TRIAL,
    subscriptionPlanId: 'sub-basic',
    subscriptionPlanName: 'Starter Mill',
    planTier: SubscriptionTier.BASIC,
    createdAt: '2025-02-01',
    mrr: 2999,
    totalOrders: 85,
    productCount: 5
  },
  {
    id: 'tenant-sri-4',
    name: 'Sri Krishna Agro Producers',
    businessName: 'Sri Krishna Cattle Feed & Agro Mills',
    ownerName: 'Krishnakumar R',
    email: 'krishna@skmills.com',
    phone: '+91 98423 44556',
    status: TenantStatus.SUSPENDED,
    subscriptionPlanId: 'sub-basic',
    subscriptionPlanName: 'Starter Mill',
    planTier: SubscriptionTier.BASIC,
    createdAt: '2024-11-10',
    mrr: 0,
    totalOrders: 320,
    productCount: 8
  }
];

export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'sub-basic',
    name: 'Starter Mill',
    tier: SubscriptionTier.BASIC,
    priceMonthly: 2999,
    priceAnnual: 29990,
    maxProducts: 25,
    maxUsers: 3,
    maxOrdersPerMonth: 500,
    features: ['Standard Inventory', 'Product Variants', 'Basic Reports', 'Email Support'],
    isActive: true
  },
  {
    id: 'sub-premium',
    name: 'Business Premium',
    tier: SubscriptionTier.PREMIUM,
    priceMonthly: 7999,
    priceAnnual: 79990,
    maxProducts: 100,
    maxUsers: 10,
    maxOrdersPerMonth: 3000,
    features: ['Multi-Warehouse Tracking', 'Google Sheet Price Sync', 'GST Tax Invoices', 'Razorpay Integration', 'Priority Phone Support'],
    isActive: true
  },
  {
    id: 'sub-enterprise',
    name: 'Enterprise Mill',
    tier: SubscriptionTier.ENTERPRISE,
    priceMonthly: 14999,
    priceAnnual: 149990,
    maxProducts: 1000,
    maxUsers: 50,
    maxOrdersPerMonth: 20000,
    features: ['Unlimited Products & Orders', 'Custom ERP Webhooks', 'Automated Churn Batch Logging', 'Dedicated Account Manager', '24/7 SLA Support'],
    isActive: true
  }
];

export const INITIAL_SUBSCRIPTION_PLANS: SubscriptionPlan[] = INITIAL_PLANS;

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_PAYMENTS: PaymentTransaction[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'aud-1',
    timestamp: '2025-02-15 11:45 AM',
    userName: 'Kaviarasu M',
    role: Role.TENANT_ADMIN,
    action: 'ORDER_CONFIRMED',
    entity: 'Order',
    entityId: 'NPO-2025-8842',
    ipAddress: '122.178.44.12',
    details: 'Order verified and moved to Packing Queue'
  },
  {
    id: 'aud-2',
    timestamp: '2025-02-15 08:35 AM',
    userName: 'Muruganathan S',
    role: Role.INVENTORY_MANAGER,
    action: 'STOCK_ADDED',
    entity: 'ProductVariant',
    entityId: 'NPO-GNO-1L',
    ipAddress: '122.178.44.15',
    details: '+150 units added from Churn Batch #409'
  },
  {
    id: 'aud-3',
    timestamp: '2025-02-14 05:20 PM',
    userName: 'Gowtham Raj',
    role: Role.SUPER_ADMIN,
    action: 'TENANT_ACTIVATED',
    entity: 'Tenant',
    entityId: 'tenant-varshini-2',
    ipAddress: '106.51.10.88',
    details: 'Upgraded subscription tier to Business Premium'
  }
];

export const INITIAL_SHEET_DIFFS: SheetDiffItem[] = [
  {
    // Groundnut Oil 1L: sheet shows 210
    sku: 'NPO-GNO-1L',
    productName: 'Groundnut Oil',
    variantSize: '1L',
    currentMrp: 380,
    newMrp: 380,
    currentSellingPrice: 340,
    newSellingPrice: 210,
    currentStock: 45,
    newStock: 45,
    priceDelta: -130,
    stockDelta: 0,
    isApproved: true
  },
  {
    // Coconut Oil 1L: sheet shows 270
    sku: 'NPO-COC-1L',
    productName: 'Coconut Oil',
    variantSize: '1L',
    currentMrp: 520,
    newMrp: 520,
    currentSellingPrice: 460,
    newSellingPrice: 270,
    currentStock: 28,
    newStock: 28,
    priceDelta: -190,
    stockDelta: 0,
    isApproved: true
  },
  {
    // Palm Oil 1L: sheet shows 1470
    sku: 'RSG-PO-1L',
    productName: 'Palm Oil',
    variantSize: '1L',
    currentMrp: 1600,
    newMrp: 1600,
    currentSellingPrice: 1500,
    newSellingPrice: 1470,
    currentStock: 14,
    newStock: 14,
    priceDelta: -30,
    stockDelta: 0,
    isApproved: false
  },
  {
    // Groundnut Oil 500ml: sheet shows 115
    sku: 'NPO-GNO-500ML',
    productName: 'Groundnut Oil',
    variantSize: '500ml',
    currentMrp: 200,
    newMrp: 200,
    currentSellingPrice: 175,
    newSellingPrice: 115,
    currentStock: 32,
    newStock: 32,
    priceDelta: -60,
    stockDelta: 0,
    isApproved: true
  }
];

