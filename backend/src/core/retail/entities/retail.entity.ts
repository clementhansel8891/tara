export class RetailStore {
  id: string;
  tenant_id: string;
  location_id: string;
  name: string;
  code: string;
  type: 'flagship' | 'express' | 'kiosk' | 'pop-up' | 'warehouse';
  status: 'active' | 'inactive' | 'maintenance' | 'decommissioned';
  address: string;
  phone?: string;
  email?: string;
  timezone: string;
  currency: string;
  manager_id?: string;
  inventory_pool_id?: string;
  operating_hours?: any;
  settings?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export class InventoryPool {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  type: 'shared' | 'exclusive';
  stock?: InventoryPoolStock[];
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export class InventoryPoolStock {
  id: string;
  pool_id: string;
  product_id: string;
  quantity: number;
  reserved: number;
  available: number;
  created_at: Date;
  updated_at: Date;
}

export interface SEOData {
  title: string;
  metaDescription: string;
  keywords: string[];
}

export interface MultiCurrencyPrice {
  amount: number;
  currency: string;
}

export interface ProductVariant {
  id: string;
  sku_suffix: string;
  name: string;
  price_adjustment: number;
  attributes: Record<string, string>; // e.g., { "color": "red", "size": "XL" }
}

export class RetailProduct {
  id: string;
  tenant_id: string;
  sku: string;
  barcode: string;
  name: string;
  description: string;
  category_id: string;
  base_price: number;
  currency: string;
  prices: MultiCurrencyPrice[];
  tax_rate: number;
  unit: string;
  status: 'active' | 'discontinued' | 'draft';
  variants: ProductVariant[];
  seo?: SEOData;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export type OrderStatus = 'pending' | 'reserved' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refunded';

export class RetailOrder {
  id: string;
  tenant_id: string;
  location_id: string;
  store_id: string;
  terminal_id: string;
  cashier_id: string;
  customer_id?: string;
  status: OrderStatus;
  items: RetailOrderItem[];
  subtotal: number;
  tax_total: number;
  discount_total: number;
  grand_total: number;
  currency: string;
  payment_method: 'cash' | 'card' | 'qr' | 'wallet';
  payment_status: 'unpaid' | 'paid' | 'partial';
  reservation_expires_at?: Date;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export class RetailOrderItem {
  product_id: string;
  variant_id?: string;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  tax_amount: number;
  discount_amount: number;
  total_price: number;
}

export class RetailShift {
  id: string;
  tenant_id: string;
  location_id: string;
  store_id: string;
  employee_id: string;
  terminal_id: string;
  start_time: Date;
  end_time?: Date;
  opening_cash: number;
  closing_cash?: number;
  expected_cash?: number;
  status: 'open' | 'closed' | 'reconciled';
  notes?: string;
}

export class RetailGatewayNode {
  id: string;
  tenant_id: string;
  load_balancer_id?: string;
  node_name: string;
  ip_address?: string;
  port: number;
  status: 'ACTIVE' | 'STANDBY' | 'DOWN';
  health_score: number;
  last_heartbeat?: Date;
  version?: string;
  region?: string;
  created_at: Date;
  updated_at: Date;
}

export class RetailLoadBalancer {
  id: string;
  tenant_id: string;
  name: string;
  virtual_ip?: string;
  algorithm: string;
  status: 'ONLINE' | 'OFFLINE';
  created_at: Date;
  updated_at: Date;
  nodes?: RetailGatewayNode[];
}
