// ============================================================
// RETAIL MODULE
// Industry Module: Retail POS
// ============================================================

import type {
  ModuleContract,
  ModulePageDefinition,
  ModuleConfig,
  ModuleConfigValidationResult,
  ReadonlyModuleConfig,
  Permission,
} from "../shared/contract";

// ============================================================
// MODULE IDENTITY (LOCKED)
// ============================================================

const MODULE_ID = "retail" as const;
const MODULE_VERSION = "1.0.0" as const;

// ============================================================
// CONFIGURATION
// ============================================================

export interface RetailModuleConfig extends ModuleConfig {
  taxRate: number;

  features: {
    barcodeScanning: boolean;
    requireShiftStart: boolean;
  };
}

const DEFAULT_CONFIG: RetailModuleConfig = {
  taxRate: 8.5,
  features: {
    barcodeScanning: true,
    requireShiftStart: true,
  },
};

// ============================================================
// PERMISSIONS (CANONICAL)
// ============================================================

const PERMISSIONS = {
  SALES_READ: {
    resource: "sales",
    actions: ["read"],
  },
  SALES_CREATE: {
    resource: "sales",
    actions: ["create"],
  },
  INVENTORY_READ: {
    resource: "inventory",
    actions: ["read"],
  },
  SHIFTS_READ: {
    resource: "shifts",
    actions: ["read"],
  },
  SETTINGS_READ: {
    resource: "settings",
    actions: ["read"],
  },
} satisfies Record<string, Permission>;

// ============================================================
// PAGE DECLARATIONS
// ============================================================

const PAGES: ReadonlyArray<ModulePageDefinition> = [
  {
    id: "cashier",
    moduleId: MODULE_ID,
    title: "Cashier",
    route: "/retail",
    menuGroup: "cashier",
    requiredPermissions: [PERMISSIONS.SALES_CREATE],
  },
  {
    id: "inventory",
    moduleId: MODULE_ID,
    title: "Inventory",
    route: "/retail/inventory",
    menuGroup: "admin",
    requiredPermissions: [PERMISSIONS.INVENTORY_READ],
    hidden: (ctx) =>
      !(ctx.moduleConfig as RetailModuleConfig).features.barcodeScanning,
  },
  {
    id: "shifts",
    moduleId: MODULE_ID,
    title: "Shifts",
    route: "/retail/shifts",
    menuGroup: "ops",
    requiredPermissions: [PERMISSIONS.SHIFTS_READ],
    hidden: (ctx) =>
      !(ctx.moduleConfig as RetailModuleConfig).features.requireShiftStart,
  },
];

// ============================================================
// CONFIG VALIDATION (STRICT)
// ============================================================

function validateConfig(config: ModuleConfig): ModuleConfigValidationResult {
  const errors: string[] = [];
  const cfg = config as Partial<RetailModuleConfig>;

  if (typeof cfg.taxRate !== "number" || cfg.taxRate < 0) {
    errors.push("taxRate must be a non-negative number");
  }

  if (!cfg.features) {
    errors.push("features configuration is required");
  } else {
    if (typeof cfg.features.barcodeScanning !== "boolean") {
      errors.push("features.barcodeScanning must be a boolean");
    }
    if (typeof cfg.features.requireShiftStart !== "boolean") {
      errors.push("features.requireShiftStart must be a boolean");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================
// MODULE CONTRACT
// ============================================================

export const retailModule: ModuleContract = {
  id: MODULE_ID,
  name: "Retail Operations",
  description: "Retail sales and inventory",
  version: MODULE_VERSION,
  category: "industry",

  requiredCoreServices: ["inventory", "financial", "shift"],

  requiredPermissions: Object.values(PERMISSIONS),

  supportedDeviceTypes: ["desktop", "tablet", "kiosk"],

  getDefaultConfig: () => structuredClone(DEFAULT_CONFIG),

  validateConfig,

  getPages: (_config: ReadonlyModuleConfig) => PAGES,

  async onActivate(tenantId) {
    console.info(`[Retail] Activated for tenant ${tenantId}`);
  },

  async onDeactivate(tenantId) {
    console.info(`[Retail] Deactivated for tenant ${tenantId}`);
  },
};
