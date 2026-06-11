import type { PageEntry } from "./color-report-types";

/**
 * PAGES — complete registry of all 45 application pages audited by the
 * UI Color Consistency Test Suite (15_ui_color_consistency.spec.ts).
 *
 * Pages are grouped into three module categories:
 *   - "core"                  : Core_Module_Pages (31 pages)
 *   - "retail-management"     : Retail_Management_Pages (7 pages)
 *   - "retail-operational"    : Retail_Operational_Pages (7 pages)
 *
 * Routes are relative paths; the base URL (http://150.109.15.108:3010) is
 * configured in playwright.config.ts and is NOT included here.
 *
 * Requirements: 1.1, 1.2
 */
export const PAGES: PageEntry[] = [
  // ─── Core_Module_Pages (31) ────────────────────────────────────────────────

  // Dashboard
  {
    route: "/core/dashboard",
    name: "core-dashboard",
    group: "core",
  },

  // Finance sub-pages (8)
  {
    route: "/core/finance",
    name: "core-finance",
    group: "core",
  },
  {
    route: "/core/finance/moneydesk",
    name: "core-finance-moneydesk",
    group: "core",
  },
  {
    route: "/core/finance/ledger",
    name: "core-finance-ledger",
    group: "core",
  },
  {
    route: "/core/finance/payflow",
    name: "core-finance-payflow",
    group: "core",
  },
  {
    route: "/core/finance/receivables",
    name: "core-finance-receivables",
    group: "core",
  },
  {
    route: "/core/finance/payables",
    name: "core-finance-payables",
    group: "core",
  },
  {
    route: "/core/finance/jv",
    name: "core-finance-jv",
    group: "core",
  },
  {
    route: "/core/finance/invoices",
    name: "core-finance-invoices",
    group: "core",
  },

  // HR sub-pages (6)
  {
    route: "/core/hr",
    name: "core-hr",
    group: "core",
  },
  {
    route: "/core/hr/pulse",
    name: "core-hr-pulse",
    group: "core",
  },
  {
    route: "/core/hr/roster",
    name: "core-hr-roster",
    group: "core",
  },
  {
    route: "/core/hr/payroll",
    name: "core-hr-payroll",
    group: "core",
  },
  {
    route: "/core/hr/talent",
    name: "core-hr-talent",
    group: "core",
  },
  {
    route: "/core/hr/leave",
    name: "core-hr-leave",
    group: "core",
  },

  // IT
  {
    route: "/core/it",
    name: "core-it",
    group: "core",
  },

  // Sales
  {
    route: "/core/sales",
    name: "core-sales",
    group: "core",
  },
  {
    route: "/core/sales/overview",
    name: "core-sales-overview",
    group: "core",
  },
  {
    route: "/core/sales/pipeline",
    name: "core-sales-pipeline",
    group: "core",
  },

  // Marketing
  {
    route: "/core/marketing",
    name: "core-marketing",
    group: "core",
  },
  {
    route: "/core/marketing/campaigns",
    name: "core-marketing-campaigns",
    group: "core",
  },

  // Procurement
  {
    route: "/core/procurement",
    name: "core-procurement",
    group: "core",
  },
  {
    route: "/core/procurement/suppliers",
    name: "core-procurement-suppliers",
    group: "core",
  },

  // Inventory
  {
    route: "/core/inventory",
    name: "core-inventory",
    group: "core",
  },
  {
    route: "/core/inventory/stock",
    name: "core-inventory-stock",
    group: "core",
  },

  // Payment
  {
    route: "/core/payment",
    name: "core-payment",
    group: "core",
  },

  // Settings
  {
    route: "/core/settings",
    name: "core-settings",
    group: "core",
  },

  // Security
  {
    route: "/core/security",
    name: "core-security",
    group: "core",
  },

  // Audit
  {
    route: "/core/audit",
    name: "core-audit",
    group: "core",
  },

  // Logs
  {
    route: "/core/logs",
    name: "core-logs",
    group: "core",
  },

  // Tools
  {
    route: "/core/tools",
    name: "core-tools",
    group: "core",
  },

  // ─── Retail_Management_Pages (7) ──────────────────────────────────────────

  {
    route: "/m/retail/management/store-dashboard",
    name: "retail-mgmt-store-dashboard",
    group: "retail-management",
  },
  {
    route: "/m/retail/management/inventory",
    name: "retail-mgmt-inventory",
    group: "retail-management",
  },
  {
    route: "/m/retail/management/order-fulfillment",
    name: "retail-mgmt-order-fulfillment",
    group: "retail-management",
  },
  {
    route: "/m/retail/management/pricing-promo",
    name: "retail-mgmt-pricing-promo",
    group: "retail-management",
  },
  {
    route: "/m/retail/management/channels",
    name: "retail-mgmt-channels",
    group: "retail-management",
  },
  {
    route: "/m/retail/management/shift-control",
    name: "retail-mgmt-shift-control",
    group: "retail-management",
  },
  {
    route: "/m/retail/management/device-control",
    name: "retail-mgmt-device-control",
    group: "retail-management",
  },

  // ─── Retail_Operational_Pages (7) ─────────────────────────────────────────

  {
    route: "/m/retail/operational/pos",
    name: "retail-ops-pos",
    group: "retail-operational",
  },
  {
    route: "/m/retail/operational/shift-open",
    name: "retail-ops-shift-open",
    group: "retail-operational",
  },
  {
    route: "/m/retail/operational/shift-close",
    name: "retail-ops-shift-close",
    group: "retail-operational",
  },
  {
    route: "/m/retail/operational/receiving",
    name: "retail-ops-receiving",
    group: "retail-operational",
  },
  {
    route: "/m/retail/operational/refund-return",
    name: "retail-ops-refund-return",
    group: "retail-operational",
  },
  {
    route: "/m/retail/operational/stock-opname",
    name: "retail-ops-stock-opname",
    group: "retail-operational",
  },
  {
    route: "/m/retail/operational/cash-movement",
    name: "retail-ops-cash-movement",
    group: "retail-operational",
  },
];

// Sanity check: 31 core + 7 retail-management + 7 retail-operational = 45
// (evaluated at module load time in development)
if (process.env.NODE_ENV !== "production") {
  const core = PAGES.filter((p) => p.group === "core").length;
  const mgmt = PAGES.filter((p) => p.group === "retail-management").length;
  const ops = PAGES.filter((p) => p.group === "retail-operational").length;
  if (core + mgmt + ops !== 45) {
    console.warn(
      `[color-pages] Expected 45 pages, got ${core + mgmt + ops} (core=${core}, mgmt=${mgmt}, ops=${ops})`
    );
  }
}
