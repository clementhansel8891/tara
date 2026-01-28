// ============================================================
// CAFE MODULE
// Industry Module: Food & Beverage (Cafe / Restaurant)
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

const MODULE_ID = "cafe" as const;
const MODULE_VERSION = "1.0.0" as const;

// ============================================================
// CONFIGURATION
// ============================================================

export interface CafeModuleConfig extends ModuleConfig {
  tableCount: number;
  serviceChargeRate: number;

  features: {
    kds: boolean;
    reservations: boolean;
    waitlist: boolean;
    tableMerge: boolean;
    orderModifiers: boolean;
    courses: boolean;
  };

  kitchen: {
    stations: string[];
  };
}

const DEFAULT_CONFIG: CafeModuleConfig = {
  tableCount: 10,
  serviceChargeRate: 0,
  features: {
    kds: true,
    reservations: false,
    waitlist: false,
    tableMerge: true,
    orderModifiers: true,
    courses: false,
  },
  kitchen: {
    stations: ["kitchen", "bar"],
  },
};

// ============================================================
// PERMISSIONS (CANONICAL)
// ============================================================

const PERMISSIONS = {
  ORDERS_READ: {
    resource: "orders",
    actions: ["read"],
  },
  ORDERS_CREATE: {
    resource: "orders",
    actions: ["create"],
  },
  TABLES_READ: {
    resource: "tables",
    actions: ["read"],
  },
  INVENTORY_READ: {
    resource: "inventory",
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
    route: "/pos/cashier",
    menuGroup: "cashier",
    requiredPermissions: [PERMISSIONS.ORDERS_CREATE],
  },
  {
    id: "tables",
    moduleId: MODULE_ID,
    title: "Tables",
    route: "/pos/tables",
    menuGroup: "cashier",
    requiredPermissions: [PERMISSIONS.TABLES_READ],
    hidden: (ctx) => (ctx.moduleConfig as CafeModuleConfig).tableCount === 0,
  },
  {
    id: "kitchen",
    moduleId: MODULE_ID,
    title: "Kitchen Display",
    route: "/pos/kitchen",
    menuGroup: "ops",
    requiredPermissions: [PERMISSIONS.ORDERS_READ],
    hidden: (ctx) => !(ctx.moduleConfig as CafeModuleConfig).features.kds,
  },
  {
    id: "inventory",
    moduleId: MODULE_ID,
    title: "Inventory",
    route: "/admin/inventory",
    menuGroup: "admin",
    requiredPermissions: [PERMISSIONS.INVENTORY_READ],
  },
  {
    id: "settings",
    moduleId: MODULE_ID,
    title: "Cafe Settings",
    route: "/admin/settings",
    menuGroup: "admin",
    requiredPermissions: [PERMISSIONS.SETTINGS_READ],
    hidden: true,
  },
];

// ============================================================
// CONFIG VALIDATION (STRICT)
// ============================================================

function validateConfig(config: ModuleConfig): ModuleConfigValidationResult {
  const errors: string[] = [];
  const cfg = config as Partial<CafeModuleConfig>;

  if (typeof cfg.tableCount !== "number" || cfg.tableCount < 0) {
    errors.push("tableCount must be a non-negative number");
  }

  if (
    typeof cfg.serviceChargeRate !== "number" ||
    cfg.serviceChargeRate < 0 ||
    cfg.serviceChargeRate > 100
  ) {
    errors.push("serviceChargeRate must be between 0 and 100");
  }

  if (!cfg.features) {
    errors.push("features configuration is required");
  } else {
    for (const key of [
      "kds",
      "reservations",
      "waitlist",
      "tableMerge",
      "orderModifiers",
      "courses",
    ] as const) {
      if (typeof cfg.features[key] !== "boolean") {
        errors.push(`features.${key} must be a boolean`);
      }
    }
  }

  if (!cfg.kitchen || !Array.isArray(cfg.kitchen.stations)) {
    errors.push("kitchen.stations must be a string array");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================
// MODULE CONTRACT
// ============================================================

export const cafeModule: ModuleContract = {
  id: MODULE_ID,
  name: "Cafe Operations",
  description: "Cafe and restaurant operations",
  version: MODULE_VERSION,
  category: "industry",

  requiredCoreServices: ["inventory", "financial", "shift", "audit"],

  requiredPermissions: Object.values(PERMISSIONS),

  supportedDeviceTypes: ["desktop", "tablet", "kiosk"],

  getDefaultConfig: () => structuredClone(DEFAULT_CONFIG),

  validateConfig,

  getPages: (_config: ReadonlyModuleConfig) => PAGES,

  async onActivate(tenantId) {
    console.info(`[Cafe] Activated for tenant ${tenantId}`);
  },

  async onDeactivate(tenantId) {
    console.info(`[Cafe] Deactivated for tenant ${tenantId}`);
  },
};
