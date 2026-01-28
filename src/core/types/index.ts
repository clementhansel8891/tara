// ============================================================
// CORE TYPES — Enterprise Platform Domain Models
// ============================================================
//
// RULES FOR THIS FILE
// -------------------
// - Canonical system-wide types only
// - NO React
// - NO routing libraries
// - NO navigation logic
// - NO permission enforcement
// - Used by Core, Platform, and Modules
//
// ============================================================

/* ============================================================================ */
/* IDENTITY & ACCESS                                                            */
/* ============================================================================ */

export interface Organization {
  id: string;
  name: string;
  legalName: string;
  taxId: string;
  status: "active" | "suspended" | "trial";
  createdAt: string;
  settings: OrganizationSettings;
}

export interface OrganizationSettings {
  timezone: string;
  currency: string;
  dateFormat: string;
  language: string;
}

export interface Site {
  id: string;
  organizationId: string;
  name: string;
  type: "headquarters" | "branch" | "warehouse" | "store" | "restaurant";
  address: Address;
  phone: string;
  email: string;
  isMain: boolean;
  status: "active" | "inactive";
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface User {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  phone?: string;
  status: "active" | "inactive" | "pending";
  roleIds: string[];
  roles: string[];
  siteIds: string[];
  pin?: string;
  createdAt: string;
  lastLoginAt?: string;
}

/* ============================================================================ */
/* PERMISSIONS & ROLES (CANONICAL MODEL)                                        */
/* ============================================================================ */

/**
 * Canonical permission action set.
 * MUST stay aligned with module contracts.
 */
export type PermissionAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "manage";

/**
 * Canonical permission descriptor.
 * Enforcement is handled elsewhere.
 */
export interface Permission {
  resource: string;
  actions: PermissionAction[];
}

export interface Role {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  permissions: Permission[];
  moduleAccess: ModuleAccess[];
  isSystem: boolean;
  isSuperAdmin?: boolean;
}

export interface ModuleAccess {
  moduleId: string;
  pages: string[];
  features: string[];
}

/* ============================================================================ */
/* DEVICE & LAYOUT                                                              */
/* ============================================================================ */

/**
 * Physical / runtime device classification.
 */
export type DeviceType = "desktop" | "tablet" | "mobile" | "kiosk" | "display";

/**
 * Layout intent — UX-level abstraction.
 */
export type LayoutProfile = "desktop" | "tablet" | "kiosk" | "any";

export type DeviceOrientation = "portrait" | "landscape";

export type DeviceCapability =
  | "pos"
  | "printer"
  | "scanner"
  | "cash_drawer"
  | "card_reader"
  | "kds_display"
  | "customer_display";

/**
 * Registered physical device.
 */
export interface Device {
  id: string;
  organizationId: string;
  siteId: string;
  name: string;
  type: DeviceType;
  capabilities: DeviceCapability[];
  status: "online" | "offline" | "maintenance";
  lastSeenAt: string;
  registeredAt: string;
}

/**
 * Runtime-detected device snapshot.
 * Used by platform layer.
 */
export interface DetectedDevice {
  type: DeviceType;
  capabilities: DeviceCapability[];
  screenWidth: number;
  screenHeight: number;
  isTouch: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isKiosk: boolean;
  orientation: DeviceOrientation;
}

/* ============================================================================ */
/* LICENSING & MODULE INSTANCES                                                  */
/* ============================================================================ */

export interface LicenseLimits {
  maxUsers: number;
  maxDevices: number;
  maxSites: number;
  concurrentSessions: number;
}

export interface License {
  id: string;
  organizationId: string;
  moduleId: string;
  type: "trial" | "standard" | "professional" | "enterprise";
  status: "active" | "expired" | "suspended";
  startDate: string;
  endDate: string;
  limits: LicenseLimits;
  features: string[];
}

/**
 * Runtime-enabled module instance.
 * Configuration is persisted by Core.
 */
export interface ModuleInstance {
  id: string;
  organizationId: string;
  moduleId: string;
  licenseId: string;
  status: "active" | "inactive" | "configuring";
  config: Record<string, unknown>;
  presetId?: string;
  activatedAt: string;
}

export type ModuleInstanceMap = Record<string, ModuleInstance>;

/* ============================================================================ */
/* MASTER DATA                                                                  */
/* ============================================================================ */

export interface Staff {
  id: string;
  organizationId: string;
  userId?: string;
  employeeId: string;
  name: string;
  email?: string;
  phone?: string;
  siteId: string;
  departmentId?: string;
  position: string;
  status: "active" | "inactive" | "terminated";
  hireDate: string;
  terminationDate?: string;
  hourlyRate?: number;
  salaryType: "hourly" | "salary";
}

export interface Shift {
  id: string;
  organizationId: string;
  siteId: string;
  staffId: string;
  status: "open" | "closed";
  startTime: string;
  endTime?: string;
  openingCash: number;
  closingCash?: number;
  totalSales: number;
  transactionCount: number;
  expectedCash?: number;
  variance?: number;
}

export interface Task {
  id: string;
  organizationId: string;
  title: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  createdBy: string;
  createdAt: string;
  dueDate?: string;
  assignedTo?: string;
  description?: string;
}

export interface Product {
  id: string;
  organizationId: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId: string;
  basePrice: number;
  costPrice?: number;
  taxable: boolean;
  taxRate?: number;
  unit: string;
  status: "active" | "inactive" | "discontinued";
  imageUrl?: string;
  attributes: Record<string, unknown>;
  moduleExtensions?: Record<string, Record<string, unknown>>;
}

export interface ProductCategory {
  id: string;
  organizationId: string;
  parentId?: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface Customer {
  id: string;
  organizationId: string;
  type: "individual" | "business";
  name: string;
  email?: string;
  phone?: string;
  address?: Address;
  taxId?: string;
  status: "active" | "inactive";
  createdAt: string;
  moduleExtensions?: Record<string, Record<string, unknown>>;
}

export interface InventoryEntry {
  id: string;
  organizationId: string;
  siteId: string;
  productId: string;
  quantity: number;
  reservedQuantity?: number;
  reorderLevel?: number;
  reorderQuantity?: number;
}

export interface InventoryMovement {
  id: string;
  organizationId: string;
  siteId: string;
  productId: string;
  type: "inbound" | "outbound" | "adjustment" | "reservation" | "release";
  quantity: number;
  reason: string;
  referenceType?: string;
  referenceId?: string;
  performedBy: string;
  timestamp: string;
}

export interface Supplier {
  id: string;
  organizationId: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  paymentTerms?: string;
  status: "active" | "inactive";
}

export interface Transaction {
  id: string;
  organizationId: string;
  siteId: string;
  moduleId: string;
  type: "sale" | "refund" | "expense" | "income";
  amount: number;
  currency: string;
  paymentMethod: string;
  status: "pending" | "completed" | "failed";
  referenceType: string;
  referenceId: string;
  performedBy: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Notification {
  id: string;
  organizationId: string;
  userId: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  channel: "in_app" | "email" | "sms";
  status: "sent" | "pending" | "failed";
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  organizationId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  timestamp: string;
}

/* ============================================================================ */
/* RUNTIME UI TYPES (PLATFORM CONSUMED, CORE OWNED)                              */
/* ============================================================================ */

/**
 * Runtime UI context snapshot.
 * Used by platform layer only.
 */
export interface UIContext {
  organization: Organization;
  user: User;
  roles: Role[];
  device: Device;
  site: Site;
  activeModules: ModuleInstance[];
  licenses: License[];
}

/**
 * Canonical layout identifiers.
 */
export type LayoutType = "dashboard" | "pos" | "minimal";

/**
 * Fully resolved runtime page definition.
 * Produced by platform resolver.
 */
export interface PageDefinition {
  id: string;
  moduleId: string;
  path: string;
  title: string;
  component: string;
  supportedDevices: DeviceType[];
  requiredPermissions?: string[];
  hidden?: boolean;
  menuGroup?: string;
  layout?: LayoutType | string;
}

/**
 * Navigation-safe projection of a page.
 */
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  moduleId: string;
  icon: string;
  permission?: string;
  menuGroup?: string;
}
