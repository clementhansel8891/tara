// ============================================================================
// MODULE REGISTRY (STATIC, CORE-OWNED)
// ============================================================================
//
// Purpose:
// - Canonical registry of all available modules in the system
// - Enforces uniqueness and immutability
//
// Rules:
// - Core-owned
// - Static registration only
// - No tenant logic
// - No runtime mutation
//
// ============================================================================

import type { ModuleContract, ModuleId } from "@/modules/shared/contract";

/* ============================================================================ */
/* REGISTRY INTERNAL STATE                                                      */
/* ============================================================================ */

/**
 * Internal module map.
 * Keyed by ModuleId.
 *
 * NEVER expose directly.
 */
const registry = new Map<ModuleId, ModuleContract>();

/* ============================================================================ */
/* REGISTRATION API (CORE ONLY)                                                 */
/* ============================================================================ */

/**
 * Register a module contract.
 *
 * This must be called exactly once per module
 * during application bootstrap.
 */
export function registerModule(contract: ModuleContract): void {
  if (registry.has(contract.id)) {
    throw new Error(`Module with id "${contract.id}" is already registered`);
  }

  registry.set(contract.id, Object.freeze(contract));
}

/* ============================================================================ */
/* READ-ONLY ACCESS API                                                         */
/* ============================================================================ */

/**
 * Returns a module contract by id.
 */
export function getModuleContract(
  moduleId: ModuleId,
): ModuleContract | undefined {
  return registry.get(moduleId);
}

/**
 * Returns all registered module contracts.
 */
export function getAllModuleContracts(): readonly ModuleContract[] {
  return Array.from(registry.values());
}

/**
 * Returns whether a module exists.
 */
export function hasModule(moduleId: ModuleId): boolean {
  return registry.has(moduleId);
}
