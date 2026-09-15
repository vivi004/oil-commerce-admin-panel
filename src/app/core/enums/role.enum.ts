export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  PRODUCT_MANAGER = 'PRODUCT_MANAGER',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  ORDER_MANAGER = 'ORDER_MANAGER',
  ACCOUNTANT = 'ACCOUNTANT',
  CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT'
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'Super Administrator',
  [Role.TENANT_ADMIN]: 'Tenant Administrator',
  [Role.PRODUCT_MANAGER]: 'Product Catalog Manager',
  [Role.INVENTORY_MANAGER]: 'Inventory Manager',
  [Role.ORDER_MANAGER]: 'Order Manager',
  [Role.ACCOUNTANT]: 'Financial Accountant',
  [Role.CUSTOMER_SUPPORT]: 'Customer Support Representative'
};
