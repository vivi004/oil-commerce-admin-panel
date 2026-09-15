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
  { id: 'cat-burfi', name: 'Burfi', slug: 'burfi', description: 'Pure jaggery peanut chikki & traditional burfi', isActive: true, productCount: 2 },
  { id: 'cat-oil-cake', name: 'Oil Cake', slug: 'oil-cake', description: 'High-protein livestock cattle feed cake', isActive: true, productCount: 2 }
];

export const INITIAL_BRANDS: Brand[] = [
  { id: 'br-nisha', name: 'Nisha Pure Oils', description: '100% Traditional Vaagai Wood Churned Cold-Pressed Oils', isActive: true, productCount: 12 },
  { id: 'br-varshini', name: 'Varshini Gold', description: 'Premium Filtered & Puja Oil Speciality Line', isActive: true, productCount: 6 },
  { id: 'br-other', name: 'Other Brands', description: 'Third-party agro partner commodities', isActive: true, productCount: 2 }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Wood Pressed Groundnut Oil (Marachekku Kadalai Ennai)',
    brand: 'Nisha Pure Oils',
    category: 'Groundnut Oil',
    categoryId: 'cat-groundnut',
    sku: 'NPO-GNO-001',
    barcode: '8901234560011',
    description: 'Extracted using traditional Vaagai wood churners under 40°C. Zero chemical refining, natural golden color with rich peanut aroma.',
    benefits: 'High in natural Vitamin E, heart-healthy monounsaturated fats, and zero trans-fats.',
    ingredients: '100% Sun-dried Raw Groundnut Kernels',
    storageInstructions: 'Store in a cool, dry place away from direct sunlight.',
    images: [
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80'
    ],
    primaryImage: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
    status: ProductStatus.ACTIVE,
    totalStock: 345,
    minPrice: 95,
    maxPrice: 3850,
    createdAt: '2025-01-10',
    updatedAt: '2025-02-14',
    variants: [
      { id: 'v-1', size: '200ml', sku: 'NPO-GNO-200ML', barcode: '890123456011', mrp: 110, sellingPrice: 95, gstRate: 5, stockQuantity: 80, reorderLevel: 25, isEnabled: true },
      { id: 'v-2', size: '500ml', sku: 'NPO-GNO-500ML', barcode: '890123456012', mrp: 210, sellingPrice: 185, gstRate: 5, stockQuantity: 95, reorderLevel: 30, isEnabled: true },
      { id: 'v-3', size: '1L', sku: 'NPO-GNO-1L', barcode: '890123456013', mrp: 390, sellingPrice: 340, gstRate: 5, stockQuantity: 120, reorderLevel: 40, isEnabled: true },
      { id: 'v-4', size: '5L', sku: 'NPO-GNO-5L', barcode: '890123456014', mrp: 1850, sellingPrice: 1650, gstRate: 5, stockQuantity: 40, reorderLevel: 15, isEnabled: true },
      { id: 'v-5', size: '15L', sku: 'NPO-GNO-15L', barcode: '890123456015', mrp: 4200, sellingPrice: 3850, gstRate: 5, stockQuantity: 10, reorderLevel: 5, isEnabled: true }
    ]
  },
  {
    id: 'prod-2',
    name: 'Cold Pressed Virgin Coconut Oil (Thengai Ennai)',
    brand: 'Nisha Pure Oils',
    category: 'Coconut Oil',
    categoryId: 'cat-coconut',
    sku: 'NPO-VCO-002',
    barcode: '8901234560028',
    description: 'Crafted from sulfur-free naturally dried copra. Excellent for authentic South Indian cooking, skin hydration, and baby massage.',
    benefits: 'Rich in Lauric acid and Medium Chain Triglycerides (MCTs) to boost metabolism.',
    ingredients: '100% Sulfur-free Sun-Dried Coconut Copra',
    storageInstructions: 'May solidify below 24°C, which is a hallmark of pure unadulterated coconut oil.',
    images: [
      'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop&q=80'
    ],
    primaryImage: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop&q=80',
    status: ProductStatus.ACTIVE,
    totalStock: 190,
    minPrice: 130,
    maxPrice: 2200,
    createdAt: '2025-01-12',
    updatedAt: '2025-02-12',
    variants: [
      { id: 'v-6', size: '200ml', sku: 'NPO-VCO-200ML', barcode: '890123456021', mrp: 145, sellingPrice: 130, gstRate: 5, stockQuantity: 50, reorderLevel: 20, isEnabled: true },
      { id: 'v-7', size: '500ml', sku: 'NPO-VCO-500ML', barcode: '890123456022', mrp: 280, sellingPrice: 250, gstRate: 5, stockQuantity: 65, reorderLevel: 25, isEnabled: true },
      { id: 'v-8', size: '1L', sku: 'NPO-VCO-1L', barcode: '890123456023', mrp: 520, sellingPrice: 470, gstRate: 5, stockQuantity: 60, reorderLevel: 20, isEnabled: true },
      { id: 'v-9', size: '5L', sku: 'NPO-VCO-5L', barcode: '890123456024', mrp: 2450, sellingPrice: 2200, gstRate: 5, stockQuantity: 15, reorderLevel: 5, isEnabled: true }
    ]
  },
  {
    id: 'prod-3',
    name: 'Traditional Wood Pressed Sesame Oil (Gingelly / Nalla Ennai)',
    brand: 'Nisha Pure Oils',
    category: 'Sesame Oil (Gingelly Oil)',
    categoryId: 'cat-sesame',
    sku: 'NPO-SES-003',
    barcode: '8901234560035',
    description: 'Black sesame seeds slowly crushed with natural palm jaggery (Karupatti) to eliminate raw bitterness and impart authentic South Indian depth.',
    benefits: 'High smoke point, rich in sesamol antioxidants and zinc.',
    ingredients: 'Black Sesame Seeds (90%), Natural Palm Jaggery (10%)',
    storageInstructions: 'Keep bottle capped tightly in a cool shelf.',
    images: [
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80'
    ],
    primaryImage: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
    status: ProductStatus.ACTIVE,
    totalStock: 140,
    minPrice: 150,
    maxPrice: 2750,
    createdAt: '2025-01-14',
    updatedAt: '2025-02-15',
    variants: [
      { id: 'v-10', size: '200ml', sku: 'NPO-SES-200ML', barcode: '890123456031', mrp: 170, sellingPrice: 150, gstRate: 5, stockQuantity: 40, reorderLevel: 15, isEnabled: true },
      { id: 'v-11', size: '500ml', sku: 'NPO-SES-500ML', barcode: '890123456032', mrp: 340, sellingPrice: 310, gstRate: 5, stockQuantity: 50, reorderLevel: 20, isEnabled: true },
      { id: 'v-12', size: '1L', sku: 'NPO-SES-1L', barcode: '890123456033', mrp: 620, sellingPrice: 560, gstRate: 5, stockQuantity: 42, reorderLevel: 15, isEnabled: true },
      { id: 'v-13', size: '5L', sku: 'NPO-SES-5L', barcode: '890123456034', mrp: 2950, sellingPrice: 2750, gstRate: 5, stockQuantity: 8, reorderLevel: 4, isEnabled: true }
    ]
  },
  {
    id: 'prod-4',
    name: 'Varshini Gold Deepam Oil (Aromatic Pancha Deepa Lamp Oil)',
    brand: 'Varshini Gold',
    category: 'Lamp Oil (Puja Oil)',
    categoryId: 'cat-lamp',
    sku: 'VG-LMP-004',
    barcode: '8901234560042',
    description: 'Blended with 5 pure sacred oils (Gingelly, Mahua, Castor, Neem, and Pure Ghee) infused with fragrant natural camphor for auspicious temple poojas.',
    benefits: 'Produces clean, soot-free, long-burning bright flame with a divine soothing aroma.',
    ingredients: 'Sesame, Mahua, Castor, Neem, Cow Ghee, Sugandh Fragrance',
    storageInstructions: 'For lighting lamps and puja rituals only. Not for culinary use.',
    images: [
      'https://images.unsplash.com/photo-1608248597359-005cb2e1e355?w=600&auto=format&fit=crop&q=80'
    ],
    primaryImage: 'https://images.unsplash.com/photo-1608248597359-005cb2e1e355?w=600&auto=format&fit=crop&q=80',
    status: ProductStatus.ACTIVE,
    totalStock: 280,
    minPrice: 110,
    maxPrice: 950,
    createdAt: '2025-01-20',
    updatedAt: '2025-02-10',
    variants: [
      { id: 'v-14', size: '500ml', sku: 'VG-LMP-500ML', barcode: '890123456041', mrp: 130, sellingPrice: 110, gstRate: 12, stockQuantity: 120, reorderLevel: 30, isEnabled: true },
      { id: 'v-15', size: '1L', sku: 'VG-LMP-1L', barcode: '890123456042', mrp: 230, sellingPrice: 195, gstRate: 12, stockQuantity: 110, reorderLevel: 25, isEnabled: true },
      { id: 'v-16', size: '5L', sku: 'VG-LMP-5L', barcode: '890123456043', mrp: 1100, sellingPrice: 950, gstRate: 12, stockQuantity: 50, reorderLevel: 15, isEnabled: true }
    ]
  },
  {
    id: 'prod-5',
    name: 'High-Protein Groundnut Oil Cake (Kadalai Pinnakku)',
    brand: 'Nisha Pure Oils',
    category: 'Oil Cake',
    categoryId: 'cat-oil-cake',
    sku: 'NPO-CAKE-005',
    barcode: '8901234560059',
    description: 'Natural residual cake obtained after cold-pressing whole groundnut seeds. Prime nutrient-rich supplement for dairy cows and livestock cattle.',
    benefits: '45%+ Crude protein content, boosts cattle milk yield and health naturally.',
    ingredients: '100% Pressed Groundnut Meal Residue',
    storageInstructions: 'Store in dry moisture-free gunny sacks.',
    images: [
      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80'
    ],
    primaryImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80',
    status: ProductStatus.ACTIVE,
    totalStock: 65,
    minPrice: 280,
    maxPrice: 780,
    createdAt: '2025-01-22',
    updatedAt: '2025-02-14',
    variants: [
      { id: 'v-17', size: '5Kg', sku: 'NPO-CAKE-5KG', barcode: '890123456051', mrp: 320, sellingPrice: 280, gstRate: 0, stockQuantity: 40, reorderLevel: 15, isEnabled: true },
      { id: 'v-18', size: '15Kg', sku: 'NPO-CAKE-15KG', barcode: '890123456052', mrp: 890, sellingPrice: 780, gstRate: 0, stockQuantity: 25, reorderLevel: 10, isEnabled: true }
    ]
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-8841',
    orderNumber: 'NPO-2025-8841',
    customerName: 'Anandapadmanabhan R',
    customerEmail: 'anand.p@gmail.com',
    customerPhone: '+91 98421 77654',
    shippingAddress: '42, Perundurai Road, Near Collectorate, Erode 638011, Tamil Nadu',
    items: [
      { productId: 'prod-1', productName: 'Wood Pressed Groundnut Oil', variantSize: '5L', sku: 'NPO-GNO-5L', quantity: 1, unitPrice: 1650, taxAmount: 82.5, totalPrice: 1650 },
      { productId: 'prod-4', productName: 'Varshini Gold Deepam Oil', variantSize: '1L', sku: 'VG-LMP-1L', quantity: 1, unitPrice: 195, taxAmount: 23.4, totalPrice: 195 }
    ],
    subtotal: 1845,
    taxTotal: 105.9,
    shippingFee: 0,
    discountTotal: 0,
    grandTotal: 1845,
    status: OrderStatus.SHIPPED,
    paymentMethod: 'UPI (PhonePe)',
    paymentStatus: 'PAID',
    carrier: 'Blue Dart Express',
    trackingNumber: 'BLD-849201948',
    createdAt: '2025-02-15 09:30 AM',
    updatedAt: '2025-02-15 02:45 PM'
  },
  {
    id: 'ord-8842',
    orderNumber: 'NPO-2025-8842',
    customerName: 'Deepa Meenakshi',
    customerEmail: 'deepa.m@yahoo.com',
    customerPhone: '+91 94432 99012',
    shippingAddress: '15, Anna Nagar 2nd Street, Tirupur 641602, Tamil Nadu',
    items: [
      { productId: 'prod-2', productName: 'Cold Pressed Virgin Coconut Oil', variantSize: '1L', sku: 'NPO-VCO-1L', quantity: 2, unitPrice: 470, taxAmount: 47, totalPrice: 940 }
    ],
    subtotal: 940,
    taxTotal: 47,
    shippingFee: 50,
    discountTotal: 50,
    grandTotal: 940,
    status: OrderStatus.CONFIRMED,
    paymentMethod: 'Razorpay (Card)',
    paymentStatus: 'PAID',
    createdAt: '2025-02-15 11:15 AM',
    updatedAt: '2025-02-15 11:45 AM'
  },
  {
    id: 'ord-8843',
    orderNumber: 'NPO-2025-8843',
    customerName: 'Karthikeyan Subramanian',
    customerEmail: 'karthik.sub@outlook.com',
    customerPhone: '+91 98944 11223',
    shippingAddress: '8B, Lakshmi Mills Colony, Coimbatore 641037, Tamil Nadu',
    items: [
      { productId: 'prod-3', productName: 'Wood Pressed Sesame Oil', variantSize: '5L', sku: 'NPO-SES-5L', quantity: 1, unitPrice: 2750, taxAmount: 137.5, totalPrice: 2750 },
      { productId: 'prod-5', productName: 'Groundnut Oil Cake', variantSize: '15Kg', sku: 'NPO-CAKE-15KG', quantity: 1, unitPrice: 780, taxAmount: 0, totalPrice: 780 }
    ],
    subtotal: 3530,
    taxTotal: 137.5,
    shippingFee: 0,
    discountTotal: 100,
    grandTotal: 3430,
    status: OrderStatus.PENDING,
    paymentMethod: 'Cash On Delivery',
    paymentStatus: 'PENDING',
    createdAt: '2025-02-15 01:20 PM',
    updatedAt: '2025-02-15 01:20 PM'
  }
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov-1',
    productId: 'prod-1',
    productName: 'Wood Pressed Groundnut Oil',
    sku: 'NPO-GNO-1L',
    variantSize: '1L',
    type: StockMovementType.STOCK_IN,
    quantity: 150,
    previousStock: 0,
    newStock: 150,
    warehouseLocation: 'Kangeyam Mill - Silo Bay 1',
    reason: 'Fresh Morning Wood Churn Milling Batch #409',
    performedBy: 'Muruganathan S',
    createdAt: '2025-02-14 08:30 AM'
  },
  {
    id: 'mov-2',
    productId: 'prod-1',
    productName: 'Wood Pressed Groundnut Oil',
    sku: 'NPO-GNO-5L',
    variantSize: '5L',
    type: StockMovementType.STOCK_OUT,
    quantity: -1,
    previousStock: 41,
    newStock: 40,
    warehouseLocation: 'Kangeyam Mill - Dispatch Bay',
    reason: 'Fulfillment for Order #NPO-2025-8841',
    referenceId: 'NPO-2025-8841',
    performedBy: 'Selvi Anand',
    createdAt: '2025-02-15 02:30 PM'
  },
  {
    id: 'mov-3',
    productId: 'prod-2',
    productName: 'Cold Pressed Virgin Coconut Oil',
    sku: 'NPO-VCO-500ML',
    variantSize: '500ml',
    type: StockMovementType.ADJUSTMENT_DAMAGE,
    quantity: -2,
    previousStock: 67,
    newStock: 65,
    warehouseLocation: 'Erode Storage Bay B',
    reason: 'Glass container cap breakage during pallet transit',
    performedBy: 'Muruganathan S',
    createdAt: '2025-02-13 04:15 PM'
  }
];

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

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    fullName: 'Anandapadmanabhan R',
    email: 'anand.p@gmail.com',
    phone: '+91 98421 77654',
    address: '42, Perundurai Road',
    city: 'Erode',
    state: 'Tamil Nadu',
    pincode: '638011',
    totalOrders: 6,
    lifetimeSpend: 11450,
    lastOrderDate: '2025-02-15',
    supportNotes: 'Prefers 5L tin packaging for groundnut oil.',
    createdAt: '2024-08-10'
  },
  {
    id: 'cust-2',
    fullName: 'Deepa Meenakshi',
    email: 'deepa.m@yahoo.com',
    phone: '+91 94432 99012',
    address: '15, Anna Nagar 2nd Street',
    city: 'Tirupur',
    state: 'Tamil Nadu',
    pincode: '641602',
    totalOrders: 3,
    lifetimeSpend: 4200,
    lastOrderDate: '2025-02-15',
    createdAt: '2024-10-05'
  },
  {
    id: 'cust-3',
    fullName: 'Karthikeyan Subramanian',
    email: 'karthik.sub@outlook.com',
    phone: '+91 98944 11223',
    address: '8B, Lakshmi Mills Colony',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641037',
    totalOrders: 12,
    lifetimeSpend: 38900,
    lastOrderDate: '2025-02-15',
    supportNotes: 'Wholesale retail buyer for Kovai organic store.',
    createdAt: '2024-04-12'
  }
];

export const INITIAL_PAYMENTS: PaymentTransaction[] = [
  {
    id: 'pay-1',
    orderId: 'ord-8841',
    orderNumber: 'NPO-2025-8841',
    customerName: 'Anandapadmanabhan R',
    amount: 1845,
    paymentMethod: 'UPI (PhonePe)',
    gatewayTransactionId: 'pay_rzp_89492819',
    status: 'SUCCESS',
    settlementStatus: 'SETTLED',
    createdAt: '2025-02-15 09:32 AM'
  },
  {
    id: 'pay-2',
    orderId: 'ord-8842',
    orderNumber: 'NPO-2025-8842',
    customerName: 'Deepa Meenakshi',
    amount: 940,
    paymentMethod: 'Credit Card (HDFC)',
    gatewayTransactionId: 'pay_rzp_99182341',
    status: 'SUCCESS',
    settlementStatus: 'PROCESSING',
    createdAt: '2025-02-15 11:17 AM'
  }
];

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
