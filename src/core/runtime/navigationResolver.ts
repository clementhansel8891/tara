// ============================================================================
// NAVIGATION RESOLVER
// ============================================================================
//
// Builds navigation structure for the UI.
//
// Responsibilities:
// - Merge Core + Module pages
// - Enforce permissions
// - Respect module activation state
// - Keep inactive modules visible but non-navigable
//
// Non-responsibilities:
// - License validation
// - Routing
// - UI rendering
//
// ============================================================================

import type {
  Permission,
  DeviceType,
  ModuleInstance,
  LayoutProfile,
} from "@/core/types";

import type { ModuleId, ModulePageDefinition } from "@/modules/shared/contract";

import { resolveCorePages } from "./corePageResolver";
import { resolveModules } from "./moduleResolver";

/* ============================================================================ */
/* NAVIGATION TYPES                                                             */
/* ============================================================================ */

export interface NavigationItem {
  id: string;
  label: string;
  path?: string; // undefined when inactive / inaccessible
  icon?: string;
  moduleId: ModuleId;
  disabled?: boolean;
  menuGroup?: string;
}

/* ============================================================================ */
/* PERMISSION HELPERS                                                           */
/* ============================================================================ */

/**
 * Checks whether a user satisfies required permissions.
 *
 * Canonical enforcement:
 * - '*' resource grants access to everything
 * - 'manage' grants all actions
 */
function hasPermission(
  userPermissions: Permission[],
  required?: Permission[],
): boolean {
  if (!required || required.length === 0) return true;

  return required.every((req) =>
    userPermissions.some(
      (p) =>
        (p.resource === "*" || p.resource === req.resource) &&
        (p.actions.includes("manage") ||
          req.actions.every((a) => p.actions.includes(a))),
    ),
  );
}

/* ============================================================================ */
/* RESOLVER INPUT                                                               */
/* ============================================================================ */

export interface ResolveNavigationOptions {
  deviceType: DeviceType;
  userPermissions: Permission[];

  /**
   * Active module runtime instances
   * (comes from persistence / licensing layer)
   */
  activeModuleInstances: ModuleInstance[];

  /**
   * Runtime layout context
   */
  layoutProfile: LayoutProfile;
}

/* ============================================================================ */
/* NAVIGATION RESOLVER                                                          */
/* ============================================================================ */

export function resolveNavigation(
  options: ResolveNavigationOptions,
): NavigationItem[] {
  const { deviceType, userPermissions, activeModuleInstances, layoutProfile } =
    options;

  const navigation: NavigationItem[] = [];

  // ---------------------------------------------------------------------------
  // CORE PAGES (ALWAYS ACTIVE)
  // ---------------------------------------------------------------------------

  const corePages = resolveCorePages();

  for (const page of corePages) {
    if (!page.visible) continue;

    navigation.push({
      id: page.id,
      label: page.title,
      path: page.route,
      icon: page.icon,
      moduleId: "core",
      menuGroup: page.section,
    });
  }

  // ---------------------------------------------------------------------------
  // MODULE PAGES (RESOLVED VIA MODULE RESOLVER)
  // ---------------------------------------------------------------------------

  const resolvedModules = resolveModules({
    tenantId: "runtime", // navigation is tenant-scoped, id not needed here
    activeModuleInstances,
    deviceType,
    layoutProfile,
  });

  for (const module of resolvedModules) {
    for (const page of module.pages) {
      // Permission enforcement
      if (!hasPermission(userPermissions, page.requiredPermissions)) continue;

      navigation.push({
        id: `${module.id}:${page.id}`,
        label: page.title,
        path: module.isActive ? page.route : undefined,
        icon: undefined,
        moduleId: module.id,
        disabled: !module.isActive,
        menuGroup: page.menuGroup,
      });
    }
  }

  return navigation;
}
