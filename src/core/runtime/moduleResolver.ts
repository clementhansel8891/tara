// ============================================================================
// MODULE RESOLVER (CORE RUNTIME)
// ============================================================================
//
// Resolves module visibility, activation state, and pages
// for a given tenant + runtime context.
//
// PURE FUNCTION.
// NO SIDE EFFECTS.
// NO UI.
// NO PERMISSION ENFORCEMENT.
//
// ============================================================================

import type {
  ModuleContract,
  ModulePageDefinition,
  ModulePageContext,
  ModuleId,
} from "@/modules/shared/contract";

import type { ModuleInstance, DeviceType, LayoutProfile } from "@/core/types";

import { getAllModuleContracts } from "@/core/runtime/moduleRegistry";

/* ============================================================================ */
/* RESOLVED OUTPUT TYPES                                                        */
/* ============================================================================ */

export interface ResolvedModule {
  id: ModuleId;
  name: string;
  description: string;
  category: "core" | "industry";

  /**
   * License / activation state
   */
  isActive: boolean;

  /**
   * Pages resolved for runtime navigation
   * (empty if inactive)
   */
  pages: ReadonlyArray<ModulePageDefinition>;
}

/* ============================================================================ */
/* RESOLVER INPUT                                                               */
/* ============================================================================ */

export interface ModuleResolutionInput {
  tenantId: string;

  /**
   * Enabled module instances for tenant
   * (only ACTIVE ones appear here)
   */
  activeModuleInstances: ModuleInstance[];

  /**
   * Runtime device context
   */
  deviceType: DeviceType;
  layoutProfile: LayoutProfile;
}

/* ============================================================================ */
/* MODULE RESOLUTION                                                            */
/* ============================================================================ */

export function resolveModules(
  input: ModuleResolutionInput,
): ReadonlyArray<ResolvedModule> {
  const { activeModuleInstances, deviceType, layoutProfile } = input;

  const activeModuleMap = new Map<ModuleId, ModuleInstance>(
    activeModuleInstances.map((m) => [m.moduleId, m]),
  );

  const resolved: ResolvedModule[] = [];

  const moduleContracts = getAllModuleContracts();

  for (const module of moduleContracts) {
    const instance = activeModuleMap.get(module.id);
    const isActive = Boolean(instance);

    let pages: ModulePageDefinition[] = [];

    if (isActive && instance) {
      const ctx: ModulePageContext = {
        moduleConfig: instance.config,
        deviceType,
        layoutProfile,
      };

      pages = module.getPages(instance.config).filter((page) => {
        // Device compatibility
        if (
          page.supportedDeviceTypes &&
          !page.supportedDeviceTypes.includes(deviceType)
        ) {
          return false;
        }

        // Declarative visibility
        if (typeof page.hidden === "function") {
          return !page.hidden(ctx);
        }

        return page.hidden !== true;
      });
    }

    resolved.push({
      id: module.id,
      name: module.name,
      description: module.description,
      category: module.category,
      isActive,
      pages,
    });
  }

  return resolved;
}
