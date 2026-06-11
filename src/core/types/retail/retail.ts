import type { HRAuditFields } from "@/core/types/hr/base";

// ============================================================
// PHYSICAL BRANCH (Store)
// ============================================================

export type RetailStoreStatus =
  | "active"
  | "inactive"
  | "maintenance"
  | "decommissioned";
export type RetailStoreType =
  | "flagship"
  | "express"
  | "kiosk"
  | "pop-up"
  | "warehouse";

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
  activation_date?: string;
  activation_source: "LAN-first" | "Cloud";
  compliance_level: number;
  audit_frequency_tier: "standard" | "high" | "critical";
  data_retention_policy?: string;
  decommission_trigger?: string;
}

export interface StoreConfigVersion {
  updatedBy: string;
  updatedAt: string;
  revisionNumber: number;
}

/**
 * Branch type for a {@link RetailStore}. Physical branches are `"flagship"`,
 * `"satellite"`, and `"warehouse"`. The `"ecommerce"` member represents a virtual
 * branch — an e-commerce presence that participates in the standard branch hierarchy
 * with the same configuration capabilities (operationalConfig, supplyConfig,
 * channelBinding) as a physical branch.
 */
export type RetailBranchType =
  | "flagship"
  | "satellite"
  | "warehouse"
  | "ecommerce";

export interface RetailStore extends HRAuditFields {
  id: string;
  tenantId: string;
  locationId: string;
  name: string;
  code: string;
  type: RetailBranchType;
  status: "active" | "frozen" | "archived" | "decommissioned";
  managerId?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  currency?: string;
  taxZone?: string;
  inventoryPoolId?: string;

  // Hierarchical Config
  operationalConfig?: StoreOperationalConfig;
  supplyConfig?: StoreSupplyConfig;
  infrastructureRegistry?: StoreInfrastructureRegistry;
  channelBinding?: StoreChannelBinding;
  governance?: StoreGovernanceData;

  // Versioning
  configVersion?: StoreConfigVersion;

  /** @deprecated use operationalConfig instead */
  operatingHours?: Record<string, unknown>;
  /** @deprecated use hierarchical blocks instead */
  settings?: Record<string, unknown>;
}

// ============================================================
// BRANCH TYPE HELPERS
// ============================================================

/** Human-readable labels for each retail branch type. */
const RETAIL_BRANCH_TYPE_LABELS: Record<RetailBranchType, string> = {
  flagship: "Flagship",
  satellite: "Satellite",
  warehouse: "Warehouse",
  ecommerce: "E-Commerce",
};

/**
 * Returns true when the given store is a virtual branch (an e-commerce presence that
 * lives inside the branch hierarchy) rather than a physical location. Accepts either a
 * full {@link RetailStore} or a partial object carrying a `type` field, so it can be used
 * for lightweight type-indicator checks in list/hierarchy views.
 */
export function isVirtualBranch(
  store: Pick<RetailStore, "type"> | { type?: string } | null | undefined,
): boolean {
  return store?.type === "ecommerce";
}

/**
 * Returns a human-readable label for a branch type, used to render a clear
 * physical-vs-virtual type indicator in the store/branch list. Unknown values fall back
 * to the raw type string so the UI never renders an empty indicator.
 */
export function getStoreTypeLabel(type: RetailBranchType | string): string {
  return RETAIL_BRANCH_TYPE_LABELS[type as RetailBranchType] ?? String(type);
}

// ============================================================
// ECOMMERCE STORE
// ============================================================

export type EcommercePlatform =
  | "shopify"
  | "woocommerce"
  | "tokopedia"
  | "shopee"
  | "lazada"
  | "tiktok"
  | "custom";

export interface EcommerceStore extends HRAuditFields {
  id: string;
  tenantId: string;
  name: string;
  platform: EcommercePlatform;
  domain: string;
  apiKey: string;
  status: "active" | "inactive" | "suspended";
  inventoryPoolId?: string; // null = private
  managerId?: string;
  /** IDs of physical Store branches this e-commerce store serves */
  branchIds?: string[];
  settings?: Record<string, unknown>;
}

// ============================================================
// INVENTORY POOL
// ============================================================

export interface InventoryPool extends HRAuditFields {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  /** shared = multiple stores from same pool | exclusive = dedicated to one store */
  type: "shared" | "exclusive";
}

export interface InventoryPoolStock {
  poolId: string;
  productId: string;
  onHand: number;
  reserved: number;
  available: number;
}

// ============================================================
// POS DEVICE (legacy — kept for backward compat)
// ============================================================

export type POSDeviceType =
  | "pos_terminal"
  | "kiosk"
  | "mobile_pos"
  | "scanner"
  | "refund_desk";

export interface POSDevice extends HRAuditFields {
  id: string;
  tenantId: string;
  storeId: string;
  name: string;
  type: POSDeviceType;
  isActive: boolean;
  macAddress?: string;
}

// ============================================================
// BRANCH DEVICE (Device Control Center)
// ============================================================

export type BranchDeviceType =
  | "pc"
  | "tablet"
  | "scanner"
  | "thermal_printer"
  | "dot_matrix_printer"
  | "kiosk"
  | "pos_terminal"
  | "mobile"
  | "other";

export type BranchDeviceStatus =
  | "online"
  | "offline"
  | "maintenance"
  | "unknown";

export interface BranchDeviceAssignment {
  role: string; // e.g. "Cashier", "Stock Counter", "Manager"
  operatorId?: string;
  shiftBound?: boolean;
}

export interface BranchDevice extends HRAuditFields {
  id: string;
  tenantId: string;
  locationId: string; // branch / store id
  name: string;
  type: BranchDeviceType;
  model?: string; // e.g. "Postek C168", "Epson M118D"
  serialNumber?: string;
  macAddress?: string;
  ipAddress?: string;
  status: BranchDeviceStatus;
  lastSeen?: string;
  assignment?: BranchDeviceAssignment;
  notes?: string;
  firmwareVersion?: string;
  driverVersion?: string;
  isActive: boolean;
}

// ============================================================
// CCTV CAMERA
// ============================================================

export type CCTVStatus =
  | "live"
  | "offline"
  | "recording"
  | "error"
  | "maintenance";
export type CCTVProvider =
  | "ezviz"
  | "dahua"
  | "hikvision"
  | "axis"
  | "reolink"
  | "custom"
  | "other";
export type CCTVIntegrationStatus =
  | "connected"
  | "not_configured"
  | "error"
  | "pending";

export interface CCTVCamera extends HRAuditFields {
  id: string;
  tenantId: string;
  locationId: string;
  name: string;
  model?: string;
  provider: CCTVProvider;
  /** HLS URL (browser-playable) */
  hlsUrl?: string;
  /** RTSP URL (needs server-side proxy) */
  rtspUrl?: string;
  snapshotUrl?: string;
  status: CCTVStatus;
  integrationStatus?: CCTVIntegrationStatus;
  cloudAccountId?: string;
  verificationCode?: string;
  streamToken?: string;
  location?: string;
  resolutionMp?: number;
  hasNightVision?: boolean;
  hasPtz?: boolean;
  ipAddress?: string;
  port?: number;
  username?: string;
  password?: string;
  isActive: boolean;
  lastPing?: string;
  notes?: string;
}

// ============================================================
// BRANCH SENSOR
// ============================================================

export type SensorType =
  | "temperature"
  | "humidity"
  | "fire_alarm"
  | "smoke"
  | "motion"
  | "door_contact"
  | "vibration"
  | "co2"
  | "other";

export type SensorStatus =
  | "normal"
  | "warning"
  | "critical"
  | "offline"
  | "unknown";

export interface BranchSensor extends HRAuditFields {
  id: string;
  tenantId: string;
  locationId: string; // branch / store id
  name: string;
  type: SensorType;
  model?: string;
  serialNumber?: string;
  status: SensorStatus;
  currentValue?: number;
  unit?: string; // e.g. "°C", "%", "ppm"
  thresholdMin?: number;
  thresholdMax?: number;
  lastReading?: string; // ISO timestamp
  placement?: string; // physical location note
  isActive: boolean;
  notes?: string;
}

// ============================================================
// ORDERS
// ============================================================

export type OrderStatus =
  | "draft"
  | "pending_payment"
  | "reserved"
  | "paid"
  | "processing"
  | "ready_for_pickup"
  | "shipped"
  | "complete"
  | "cancelled"
  | "refunded";

export interface RetailOrderItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
  taxRate?: number;
}

export interface RetailOrder extends HRAuditFields {
  id: string;
  tenantId: string;
  storeId: string;
  deviceId: string;
  cashierId: string;
  customerName?: string;
  status: OrderStatus;
  items: RetailOrderItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  paymentMethod?: "card" | "cash" | "qr" | "store_credit";
  paymentReference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// LICENSE
// ============================================================

export interface RetailLicense {
  tenantId: string;
  status: "active" | "expired" | "frozen";
  maxBranches: number;
  maxEcommerceStores: number;
  expiryDate: string;
}

// ============================================================
// PROMOTIONS
// ============================================================

export type PromotionType = "percentage" | "fixed_amount" | "bogo" | "bundle";
export type PromotionStatus = "draft" | "active" | "scheduled" | "expired";

export interface RetailPromotion extends HRAuditFields {
  id: string;
  tenantId: string;
  title: string;
  type: PromotionType;
  value: number;
  startDate: string;
  endDate: string;
  status: PromotionStatus;
  target?: "all" | "category" | "specific_items";
  targetIds?: string[];
}

// ============================================================
// CHANNELS (Legacy Ecommerce Hub)
// ============================================================

export type ChannelType = "DIRECT" | "OWNED" | "MARKETPLACE";
export type ChannelStatus = "active" | "inactive" | "warning";

export interface RetailChannel extends HRAuditFields {
  id: string;
  tenantId: string;
  branchId?: string;
  name: string;
  type: ChannelType;
  status: ChannelStatus;
  syncFrequency: string;
  lastSync?: string;
  channelId?: string;
  clientId?: string;
  clientSecret?: string;
  gatewayUrl?: string;
  connector?: string;
  settings?: Record<string, unknown>;
}

// ============================================================
// SHIFTS
// ============================================================

export interface RetailShift extends HRAuditFields {
  id: string;
  tenantId: string;
  storeId: string;
  employeeId: string;
  startTime: string;
  endTime?: string;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  status: "open" | "closed";
  notes?: string;
  closingNote?: string;
  cash_movements?: any[];
}

// ============================================================
// CUSTOMERS
// ============================================================

export interface RetailCustomer extends HRAuditFields {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tier: "regular" | "silver" | "gold" | "platinum";
  points: number;
}

// ============================================================
// GATEWAY INFRASTRUCTURE
// ============================================================

export type GatewayNodeStatus = "ACTIVE" | "STANDBY" | "DOWN";

export interface RetailGatewayNode extends HRAuditFields {
  id: string;
  tenantId: string;
  loadBalancerId?: string;
  nodeName: string;
  ipAddress?: string;
  port: number;
  status: GatewayNodeStatus;
  healthScore: number;
  lastHeartbeat?: string;
  version?: string;
  region?: string;
}

export interface RetailLoadBalancer extends HRAuditFields {
  id: string;
  tenantId: string;
  name: string;
  virtualIp?: string;
  algorithm: string;
  status: "ONLINE" | "OFFLINE";
  nodes?: RetailGatewayNode[];
}

// ============================================================
// PRODUCTS
// ============================================================

export interface RetailProduct extends HRAuditFields {
  id: string;
  tenantId: string;
  sku: string;
  barcode: string;
  name: string;
  description: string;
  categoryId: string;
  basePrice: number;
  currency: string;
  taxRate: number;
  unit: string;
  status: "active" | "discontinued" | "draft";
  /** Convenience field for legacy components */
  price: number;
  /** Current stock level (on-hand) */
  stock?: number;
  /** Category name for display */
  categoryName?: string;
  /** Product type (ITEM, SERVICE, etc) */
  type?: string;
  /** Custom metadata for stock levels, etc */
  metadata?: Record<string, any>;
}
