import { Role } from '../enums/role.enum';
import { OrderStatus, ProductStatus, StockMovementType, TenantStatus, SubscriptionTier } from '../enums/app.enums';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId?: string;
  avatar?: string;
  phone?: string;
  permissions?: string[];
  lastLoginAt?: string;
}

export interface Tenant {
  id: string;
  name: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  status: TenantStatus;
  subscriptionPlanId: string;
  subscriptionPlanName?: string;
  planTier: SubscriptionTier;
  createdAt: string;
  mrr: number;
  totalOrders: number;
  productCount: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  priceMonthly: number;
  priceAnnual: number;
  maxProducts: number;
  maxUsers: number;
  maxOrdersPerMonth: number;
  features: string[];
  isActive: boolean;
}

export type VariantSize = '100ml' | '200ml' | '500ml' | '1L' | '2L' | '5L' | '15L' | '5Kg' | '15Kg';

export interface ProductVariant {
  id: string;
  size: VariantSize;
  sku: string;
  barcode: string;
  mrp: number;
  sellingPrice: number;
  gstRate: number; // percentage, e.g. 5
  stockQuantity: number;
  reorderLevel: number;
  variantImage?: string;
  imageUrl?: string;
  isEnabled: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
  isActive: boolean;
  productCount?: number;
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
  description: string;
  isActive: boolean;
  productCount?: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  categoryId: string;
  sku: string;
  barcode: string;
  description: string;
  benefits?: string;
  ingredients?: string;
  storageInstructions?: string;
  images: string[];
  primaryImage: string;
  status: ProductStatus;
  variants: ProductVariant[];
  totalStock: number;
  minPrice: number;
  maxPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  variantSize: VariantSize;
  type: StockMovementType;
  quantity: number; // positive for IN, negative for OUT
  previousStock: number;
  newStock: number;
  warehouseLocation: string;
  reason?: string;
  referenceId?: string; // Order #, Churn Batch #
  performedBy: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  variantSize: VariantSize;
  sku: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  subtotal: number;
  taxTotal: number;
  shippingFee: number;
  discountTotal: number;
  grandTotal: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED' | 'FAILED';
  trackingNumber?: string;
  carrier?: string;
  invoiceUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  totalOrders: number;
  lifetimeSpend: number;
  lastOrderDate?: string;
  supportNotes?: string;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  paymentMethod: string;
  gatewayTransactionId: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';
  settlementStatus: 'SETTLED' | 'PENDING' | 'PROCESSING';
  createdAt: string;
}

export interface SheetDiffItem {
  sku: string;
  productName: string;
  variantSize: VariantSize;
  currentMrp: number;
  newMrp: number;
  currentSellingPrice: number;
  newSellingPrice: number;
  currentStock: number;
  newStock: number;
  priceDelta: number;
  stockDelta: number;
  isApproved: boolean;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userName: string;
  role: Role;
  action: string;
  entity: string;
  entityId: string;
  ipAddress: string;
  details: string;
}
