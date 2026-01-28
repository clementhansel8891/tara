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
// ============================================================================

import { getAllModuleContracts } from "./moduleRegistry";
import type { ModuleId } from "@/modules/shared/contract";

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

  enabled: boolean;
  visible: boolean;
}

/**
 * Tenant-specific module runtime state.
 * This MUST come from persistence.
 */
export interface TenantModuleState {
  moduleId: ModuleId;
  active: boolean;
}

/* ============================================================================ */
/* RESOLVER                                                                     */
/* ============================================================================ */

/**
 * Resolve all module pages for a tenant.
 *
 * Rules:
 * - All registered modules are visible
 * - Only active modules are enabled
 * - Inactive modules still appear (locked UX)
 */
export function resolveModulePages(
  tenantModules: readonly TenantModuleState[],
): readonly ModulePage[] {
  const contracts = getAllModuleContracts();

  const activeMap = new Map<ModuleId, boolean>();
  for (const entry of tenantModules) {
    activeMap.set(entry.moduleId, entry.active);
  }

  const pages: ModulePage[] = [];

  for (const contract of contracts) {
    const isActive = activeMap.get(contract.id) ?? false;

    for (const page of contract.pages) {
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
