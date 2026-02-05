// ============================================================================
// MODULE PAGE RESOLVER
// ============================================================================
//
// Purpose:
// - Resolve pages contributed by modules
// - Respect module activation state
// - Expose inactive modules as visible but disabled
//
// This resolver does NOT:
// - Validate licenses
// - Activate modules
// - Enforce permissions
//
// Phase 3 Rule:
// - Modules no longer expose `pages`
// - Pages MUST come from `getPages(config)`
//
// ============================================================================

import { getAllModuleContracts } from "./moduleRegistry";

import type { ModuleId, ModulePageDefinition } from "@/modules/shared/contract";

/* ============================================================================ */
/* TYPES                                                                        */
/* ============================================================================ */

export interface ModulePage {
  id: string;
  title: string;
  route: string;
  icon?: string;

  moduleId: ModuleId;
  section: "module";

  /**
   * Enabled = module active for tenant
   */
  enabled: boolean;

  /**
   * Visible = always true (locked UX allowed)
   */
  visible: boolean;
}

/**
 * Tenant-specific module runtime state.
 * MUST come from persistence/licensing layer.
 */
export interface TenantModuleState {
  moduleId: ModuleId;
  active: boolean;

  /**
   * Optional stored module config
   * (future-proof for dynamic pages)
   */
  config?: Record<string, unknown>;
}

/* ============================================================================ */
/* RESOLVER                                                                     */
/* ============================================================================ */

/**
 * Resolve all module pages for tenant navigation display.
 *
 * Rules:
 * - All registered modules are visible
 * - Only active modules are enabled
 * - Inactive modules still appear (locked UX)
 *
 * Important:
 * - Uses getPages() contract (Phase 3 canonical source)
 * - No permission enforcement here
 */
export function resolveModulePages(
  tenantModules: readonly TenantModuleState[],
): readonly ModulePage[] {
  const contracts = getAllModuleContracts();

  // Active lookup table
  const activeMap = new Map<ModuleId, TenantModuleState>();
  for (const entry of tenantModules) {
    activeMap.set(entry.moduleId, entry);
  }

  const pages: ModulePage[] = [];

  for (const contract of contracts) {
    const tenantState = activeMap.get(contract.id);

    const isActive = tenantState?.active ?? false;

    // Config fallback:
    // - Use stored config if available
    // - Otherwise module default config
    const config = tenantState?.config ?? contract.getDefaultConfig();

    // Phase 3 canonical page source
    const declaredPages: ReadonlyArray<ModulePageDefinition> =
      contract.getPages(config);

    for (const page of declaredPages) {
      pages.push({
        id: `${contract.id}:${page.id}`,
        title: page.title,
        route: page.route,
        icon: page.icon,
        moduleId: contract.id,
        section: "module",
        visible: true,
        enabled: isActive,
      });
    }
  }

  return pages;
}
