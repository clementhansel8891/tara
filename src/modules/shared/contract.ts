// ============================================================================
// MODULE CONTRACT (LOCKED)
// ============================================================================
//
// SYSTEM-LEVEL API — DO NOT MODIFY CASUALLY
//
// This file defines the ONLY allowed contract between:
// - Core
// - Platform
// - Industry Modules
//
// Violations here WILL cause systemic breakage.
//
// ============================================================================

import type { DeviceType, LayoutProfile } from "@/core/types";

/* ============================================================================ */
/* CORE IDENTIFIERS                                                             */
/* ============================================================================ */

/**
 * Every module MUST belong to exactly one category.
 */
export type ModuleCategory = "core" | "industry";

/**
 * Canonical module identifier.
 * Must be globally unique.
 */
export type ModuleId = string;

/**
 * Tenant identifier (organization-level).
 */
export type TenantId = string;

/* ============================================================================ */
/* PERMISSIONS (CANONICAL)                                                      */
/* ============================================================================ */

/**
 * Canonical permission action set.
 */
export type PermissionAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "manage";

/**
 * Canonical permission model.
 *
 * IMPORTANT:
 * - This is the ONLY permission shape allowed system-wide
 * - Enforcement is owned by Core
 */
export interface Permission {
  resource: string;
  actions: PermissionAction[];
}

/* ============================================================================ */
/* PAGE DEFINITION (CANONICAL)                                                   */
/* ============================================================================ */

/**
 * Canonical page declaration shared across the platform.
 *
 * RULES:
 * - Declarative only
 * - No data access
 * - No authorization enforcement
 */
export interface PageDefinition {
  id: string;
  moduleId: ModuleId;
  title: string;

  /**
   * Canonical absolute route.
   * Example: /pos/cafe/orders
   */
  route: string;

  /**
   * Icon identifier for navigation UI.
   * Interpretation is owned by the UI layer.
   */
  icon?: string;

  /**
   * Permissions required to access this page.
   */
  requiredPermissions?: Permission[];

  /**
   * Navigation grouping (POS, Admin, Ops, etc).
   */
  menuGroup?: string;

  /**
   * Static visibility flag.
   * Dynamic logic is NOT allowed here.
   */
  hidden?: boolean;
}

/* ============================================================================ */
/* MODULE CONFIGURATION                                                         */
/* ============================================================================ */

export type ModuleConfig = Record<string, unknown>;

export interface ModuleConfigValidationResult {
  valid: boolean;
  errors: string[];
}

export type ReadonlyModuleConfig = Readonly<ModuleConfig>;

/* ============================================================================ */
/* PAGE CONTEXT                                                                 */
/* ============================================================================ */

export interface ModulePageContext {
  moduleConfig: ReadonlyModuleConfig;
  deviceType: DeviceType;
  layoutProfile: LayoutProfile;
}

/* ============================================================================ */
/* MODULE PAGE DECLARATION                                                       */
/* ============================================================================ */

/**
 * Module-owned page declaration.
 *
 * Safe extension of PageDefinition.
 */
export interface ModulePageDefinition extends Omit<PageDefinition, "hidden"> {
  supportedDeviceTypes?: DeviceType[];

  hidden?: boolean | ((ctx: ModulePageContext) => boolean);
}

/* ============================================================================ */
/* MODULE OUTPUT EVENTS                                                         */
/* ============================================================================ */

export interface ModuleOutputEvent<TPayload = unknown> {
  tenantId: TenantId;
  moduleId: ModuleId;
  type: string;
  payload: TPayload;
  occurredAt: string;
}

/* ============================================================================ */
/* MODULE CONTRACT (PRIMARY INTERFACE)                                           */
/* ============================================================================ */

export interface ModuleContract {
  // --------------------------------------------------------------------------
  // Identity
  // --------------------------------------------------------------------------

  id: ModuleId;
  name: string;
  description: string;
  version: string;
  category: ModuleCategory;

  // --------------------------------------------------------------------------
  // Runtime Requirements
  // --------------------------------------------------------------------------

  requiredCoreServices: string[];
  requiredPermissions: Permission[];
  supportedDeviceTypes: DeviceType[];
  preferredLayoutProfile?: LayoutProfile;

  // --------------------------------------------------------------------------
  // Configuration
  // --------------------------------------------------------------------------

  getDefaultConfig(): ModuleConfig;

  validateConfig(config: ModuleConfig): ModuleConfigValidationResult;

  // --------------------------------------------------------------------------
  // Pages
  // --------------------------------------------------------------------------

  /**
   * Static page declarations.
   *
   * Used by:
   * - Navigation resolver
   * - Licensing UI
   * - Visibility checks
   *
   * MUST be declarative.
   */
  pages?: ReadonlyArray<ModulePageDefinition>;

  /**
   * Dynamic page resolver.
   *
   * Used when page visibility depends on tenant config.
   */
  getPages?(config: ReadonlyModuleConfig): ReadonlyArray<ModulePageDefinition>;

  // --------------------------------------------------------------------------
  // Lifecycle Hooks (OPTIONAL)
  // --------------------------------------------------------------------------

  onActivate?(tenantId: TenantId, config: ModuleConfig): Promise<void>;

  onDeactivate?(tenantId: TenantId): Promise<void>;

  onConfigChange?(
    tenantId: TenantId,
    oldConfig: ModuleConfig,
    newConfig: ModuleConfig,
  ): Promise<void>;
}

/* ============================================================================ */
/* DATA SCOPING & ISOLATION                                                      */
/* ============================================================================ */

export interface ScopedData<T> {
  tenantId: TenantId;
  moduleId: ModuleId;
  siteId?: string;
  data: T;
}

export function scopeData<T>(
  tenantId: TenantId,
  moduleId: ModuleId,
  data: T,
  siteId?: string,
): ScopedData<T> {
  return { tenantId, moduleId, siteId, data };
}

export function filterByScope<
  T extends {
    tenantId: TenantId;
    moduleId?: ModuleId;
    siteId?: string;
  },
>(
  items: readonly T[],
  tenantId: TenantId,
  moduleId?: ModuleId,
  siteId?: string,
): T[] {
  return items.filter((item) => {
    if (item.tenantId !== tenantId) return false;
    if (moduleId && item.moduleId !== moduleId) return false;
    if (siteId && item.siteId !== siteId) return false;
    return true;
  });
}

/* ============================================================================ */
/* MODULE DATA CONTRIBUTIONS                                                    */
/* ============================================================================ */

import type { ContributionType } from "@/core/contributions/types";

export interface ModuleContract {
  /**
   * Contribution types this module may emit.
   * Declarative only.
   */
  contributions?: ContributionType[];
}
