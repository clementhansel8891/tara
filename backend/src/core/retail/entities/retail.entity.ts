export interface StoreOperationalConfig {
  business_hours_template?: string;
  default_shift_model?: string;
  enabled_modules?: string[];
  pos_device_limit?: number;
  self_checkout_enabled?: boolean;
  payment_methods_allowed?: string[];
  refund_policy_mode?: "strict" | "flexible" | "manager_only";
  auto_close_shift_setting?: boolean;
}

export interface StoreSupplyConfig {
  default_inbound_warehouse_id?: string;
  transfer_priority_policy?: "speed" | "cost" | "balanced";
  replenishment_rule_set?: string;
  safety_stock_policy?: string;
  auto_reorder_threshold_template?: string;
  fulfillment_fallback_routing?: string[];
}

export interface StoreInfrastructureRegistry {
  registered_device_ids?: string[];
  pos_clusters?: string[];
  scanner_pools?: string[];
  local_server_binding?: string;
  sync_interval?: number;
  offline_tolerance_threshold?: number;
}

export interface StoreChannelBinding {
  linked_ecommerce_store_id?: string;
  marketplace_integrations?: string[];
  channel_priority?: string[];
  order_routing_logic?: string;
  online_to_offline_sync_policy?: string;
}

export interface StoreGovernanceData {
  license_status: "active" | "expired" | "frozen";
  activation_date?: Date;
  activation_source: "LAN-first" | "Cloud";
  compliance_level: number;
  audit_frequency_tier: "standard" | "high" | "critical";
  data_retention_policy?: string;
  decommission_trigger?: string;
}

export interface StoreConfigVersion {
  updated_by: string;
  updated_at: Date;
  revision_number: number;
}

export class RetailStore {
  id: string;
  tenantId: string;
  locationId: string;
  name: string;
  code: string;
  type: "flagship" | "satellite" | "warehouse";
  status: "active" | "frozen" | "archived" | "decommissioned";
  address: string;
  phone?: string;
  email?: string;
  timezone: string;
  currency: string;
  taxZone?: string;
  managerId?: string;
  inventoryPoolId?: string;

  // Hierarchical Config
  operationalConfig?: StoreOperationalConfig;
  supplyConfig?: StoreSupplyConfig;
  infrastructureRegistry?: StoreInfrastructureRegistry;
  channelBinding?: StoreChannelBinding;
  governance?: StoreGovernanceData;

  // Versioning
  configVersion?: StoreConfigVersion;

  createdAt: Date;
  updatedAt: Date;
}

export class InventoryPool {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  type: "shared" | "exclusive";
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
  category_name?: string;
  base_price: number;
  currency: string;
  prices: MultiCurrencyPrice[];
  tax_rate: number;
  unit: string;
  type: "ITEM" | "SERVICE" | "RAW_MATERIAL";
  status: "active" | "discontinued" | "draft";
  variants: ProductVariant[];
  seo?: SEOData;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export type OrderStatus =
  | "pending"
  | "reserved"
  | "paid"
  | "shipped"
  | "completed"
  | "cancelled"
  | "refunded";

export class RetailOrder {
  id: string;
  tenantId: string;
  locationId: string;
  storeId: string;
  terminalId: string;
  cashierId: string;
  customerId?: string;
  customerName?: string;
  status: OrderStatus;
  items: RetailOrderItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  currency: string;
  paymentMethod: "cash" | "card" | "qr" | "wallet";
  paymentStatus: "unpaid" | "paid" | "partial";
  reservationExpiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class RetailOrderItem {
  productId: string;
  variantId?: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  discountAmount: number;
  totalPrice: number;
}

export class RetailShift {
  id: string;
  tenantId: string;
  locationId: string;
  storeId: string;
  employeeId: string;
  terminalId: string;
  startTime: Date;
  endTime?: Date;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  status: "open" | "closed" | "reconciled";
  notes?: string;
}

export class RetailGatewayNode {
  id: string;
  tenant_id: string;
  load_balancer_id?: string;
  node_name: string;
  ip_address?: string;
  port: number;
  status: "ACTIVE" | "STANDBY" | "DOWN";
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
  status: "ONLINE" | "OFFLINE";
  created_at: Date;
  updated_at: Date;
  nodes?: RetailGatewayNode[];
}

export class ProductProjection {
  id: string;
  item_master_id: string;
  tenant_id: string;
  location_id?: string;
  module_type: string;
  custom_name?: string;
  custom_description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class LabelConfig {
  id: string;
  tenant_id: string;
  location_id?: string;
  module_type: string;
  field_key: string;
  display_label: string;
  created_at: Date;
  updated_at: Date;
}
