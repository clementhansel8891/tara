// ============================================================
// CAFE MODULE (F&B)
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
// PAGE COMPONENT IMPORTS (MODULE OWNED)
// ============================================================

import CafeCashier from "@/pages/fnb/Cashier";
import CafeTables from "@/pages/fnb/Tables";
import CafeKitchen from "@/pages/fnb/Kitchen";
import CafeInventory from "@/pages/fnb/Inventory";
import CafeSettings from "@/pages/fnb/Settings";

// ============================================================
// MODULE IDENTITY (LOCKED)
// ============================================================

const MODULE_ID = "fnb" as const;
const MODULE_VERSION = "1.0.0" as const;

/**
 * Canonical module route prefix.
 * ALL module routes MUST live under this base.
 */
const BASE_ROUTE = `/m/${MODULE_ID}` as const;

// ============================================================
// CONFIGURATION
// ============================================================

export interface fnbModuleConfig extends ModuleConfig {
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

const DEFAULT_CONFIG: fnbModuleConfig = {
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
// PAGE DECLARATIONS (PHASE 3 COMPLIANT)
// ============================================================

const PAGES: ReadonlyArray<ModulePageDefinition> = [
  {
    id: "cashier",
    moduleId: MODULE_ID,
    title: "Cashier",

    route: "/m/fnb/cashier",
    menuGroup: "operations",

    requiredPermissions: [PERMISSIONS.ORDERS_CREATE],

    component: CafeCashier,
  },

  {
    id: "tables",
    moduleId: MODULE_ID,
    title: "Tables",

    route: `${BASE_ROUTE}/tables`,
    menuGroup: "operations",

    requiredPermissions: [PERMISSIONS.TABLES_READ],

    component: CafeTables,

    hidden: (ctx) => (ctx.moduleConfig as fnbModuleConfig).tableCount === 0,
  },

  {
    id: "kitchen",
    moduleId: MODULE_ID,
    title: "Kitchen Display",

    route: `${BASE_ROUTE}/kitchen`,
    menuGroup: "operations",

    requiredPermissions: [PERMISSIONS.ORDERS_READ],

    component: CafeKitchen,

    hidden: (ctx) => !(ctx.moduleConfig as fnbModuleConfig).features.kds,
  },

  {
    id: "inventory",
    moduleId: MODULE_ID,
    title: "Inventory",

    route: `${BASE_ROUTE}/inventory`,
    menuGroup: "management",

    requiredPermissions: [PERMISSIONS.INVENTORY_READ],

    component: CafeInventory,
  },

  {
    id: "settings",
    moduleId: MODULE_ID,
    title: "Cafe Settings",

    route: `${BASE_ROUTE}/settings`,
    menuGroup: "management",

    requiredPermissions: [PERMISSIONS.SETTINGS_READ],

    component: CafeSettings,

    hidden: true,
  },
];

// ============================================================
// CONFIG VALIDATION (STRICT)
// ============================================================

function validateConfig(config: ModuleConfig): ModuleConfigValidationResult {
  const errors: string[] = [];
  const cfg = config as Partial<fnbModuleConfig>;

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
// MODULE CONTRACT (FINAL)
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

  /**
   * Single source of truth for module routing + navigation.
   */
  getPages: (_config: ReadonlyModuleConfig) => PAGES,

  async onActivate(tenantId) {
    console.info(`[Cafe] Activated for tenant ${tenantId}`);
  },

  async onDeactivate(tenantId) {
    console.info(`[Cafe] Deactivated for tenant ${tenantId}`);
  },
};
