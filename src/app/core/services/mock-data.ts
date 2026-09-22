import { Category, Brand, Product, Order, StockMovement, Tenant, SubscriptionPlan, Customer, PaymentTransaction, AuditLogItem, SheetDiffItem } from '../models/app.models';
import { OrderStatus, ProductStatus, StockMovementType, TenantStatus, SubscriptionTier } from '../enums/app.enums';
import { Role } from '../enums/role.enum';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-groundnut', name: 'Groundnut Oil', slug: 'groundnut-oil', description: 'Traditional wood-pressed Kadalai Ennai', isActive: true, productCount: 4 },
  { id: 'cat-coconut', name: 'Coconut Oil', slug: 'coconut-oil', description: 'Pure virgin cold-pressed Thengai Ennai', isActive: true, productCount: 3 },
  { id: 'cat-sesame', name: 'Sesame Oil (Gingelly Oil)', slug: 'sesame-oil', description: 'Traditional Nalla Ennai with palm jaggery', isActive: true, productCount: 3 },
  { id: 'cat-castor', name: 'Castor Oil', slug: 'castor-oil', description: 'Pure thick cold-pressed Amanakku Ennai', isActive: true, productCount: 2 },
  { id: 'cat-lamp', name: 'Lamp Oil (Puja Oil)', slug: 'lamp-oil', description: 'Pancha Deepa sacred divine puja oil', isActive: true, productCount: 3 },
  { id: 'cat-neem', name: 'Neem Oil', slug: 'neem-oil', description: 'Organic botanical cold-pressed neem seed oil', isActive: true, productCount: 1 },
  { id: 'cat-mahua', name: 'Mahua Oil', slug: 'mahua-oil', description: 'Heritage Iluppai Ennai for temple lamps & massage', isActive: true, productCount: 1 },
  { id: 'cat-palm', name: 'Palm Oil', slug: 'palm-oil', description: 'Refined palm oil for high-heat culinary uses', isActive: true, productCount: 1 },
  { id: 'cat-sunflower', name: 'Sunflower Oil', slug: 'sunflower-oil', description: 'Pure cold-pressed organic sunflower seed oil rich in Vitamin E', isActive: true, productCount: 1 },
  { id: 'cat-edible', name: 'Edible Oil', slug: 'edible-oil', description: 'Premium multi-seed traditional cold-pressed edible cooking oils', isActive: true, productCount: 1 },
  { id: 'cat-burfi', name: 'Burfi', slug: 'burfi', description: 'Pure jaggery peanut chikki & traditional burfi', isActive: true, productCount: 2 },
  { id: 'cat-oil-cake', name: 'Oil Cake', slug: 'oil-cake', description: 'High-protein livestock cattle feed cake', isActive: true, productCount: 2 }
];

export const INITIAL_BRANDS: Brand[] = [
  { id: 'br-nisha', name: 'Nisha Pure Oils', description: '100% Traditional Vaagai Wood Churned Cold-Pressed Oils', isActive: true, productCount: 12 },
  { id: 'br-roshini', name: 'Roshini Gold', description: 'Premium wood-churned pure traditional cooking oils', isActive: true, productCount: 2 },
  { id: 'br-rosi', name: 'Rosi Gold', description: 'Pure wood-pressed cooking oils and healthy kitchen commodities', isActive: true, productCount: 1 },
  { id: 'br-varshini', name: 'Varshini Gold', description: 'Premium Filtered & Puja Oil Speciality Line', isActive: true, productCount: 6 },
  { id: 'br-other', name: 'Other Brands', description: 'Third-party agro partner commodities', isActive: true, productCount: 2 }
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
    sku: 'NPO-GNO-1L',
    productName: 'Wood Pressed Groundnut Oil',
    variantSize: '1L',
    currentMrp: 380,
    newMrp: 395,
    currentSellingPrice: 340,
    newSellingPrice: 355,
    currentStock: 45,
    newStock: 75,
    priceDelta: 15,
    stockDelta: 30,
    isApproved: true
  },
  {
    sku: 'NPO-SES-1L',
    productName: 'Wood Pressed Sesame Oil (Gingelly)',
    variantSize: '1L',
    currentMrp: 520,
    newMrp: 540,
    currentSellingPrice: 460,
    newSellingPrice: 480,
    currentStock: 28,
    newStock: 50,
    priceDelta: 20,
    stockDelta: 22,
    isApproved: true
  },
  {
    sku: 'NPO-COC-500ML',
    productName: 'Virgin Coconut Oil',
    variantSize: '500ml',
    currentMrp: 280,
    newMrp: 270,
    currentSellingPrice: 240,
    newSellingPrice: 230,
    currentStock: 35,
    newStock: 35,
    priceDelta: -10,
    stockDelta: 0,
    isApproved: false
  },
  {
    sku: 'NPO-GNO-5L',
    productName: 'Wood Pressed Groundnut Oil (Tin)',
    variantSize: '5L',
    currentMrp: 1850,
    newMrp: 1920,
    currentSellingPrice: 1650,
    newSellingPrice: 1710,
    currentStock: 14,
    newStock: 25,
    priceDelta: 60,
    stockDelta: 11,
    isApproved: true
  }
];
