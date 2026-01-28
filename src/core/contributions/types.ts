// ============================================================================
// CORE CONTRIBUTION TYPES (CANONICAL)
// ============================================================================
//
// Core-owned.
// Industry-agnostic.
// Modules may ONLY emit these shapes.
//
// ============================================================================

import type { TenantId, ModuleId } from "@/modules/shared/contract";

/* ============================================================================ */
/* CONTRIBUTION CATEGORY                                                        */
/* ============================================================================ */

export type ContributionType =
  | "financial_transaction"
  | "inventory_movement"
  | "work_log"
  | "device_event";

/* ============================================================================ */
/* BASE CONTRIBUTION ENVELOPE (GENERIC)                                         */
/* ============================================================================ */

/**
 * Generic contribution envelope.
 * NOTE:
 * - Does NOT declare a union
 * - Type is injected by discriminated union below
 */
export interface ContributionEnvelope<
  TType extends ContributionType,
  TPayload,
> {
  tenantId: TenantId;
  moduleId: ModuleId;
  type: TType;
  payload: TPayload;
  occurredAt: string; // ISO-8601
}

/* ============================================================================ */
/* CONTRIBUTION PAYLOADS                                                        */
/* ============================================================================ */

/**
 * Financial transaction (revenue, cost, adjustment).
 */
export interface FinancialTransactionPayload {
  amount: number;
  currency: string;
  direction: "in" | "out";
  reference?: string;
}

/**
 * Inventory movement (increase/decrease/adjustment).
 */
export interface InventoryMovementPayload {
  itemId: string;
  quantity: number;
  reason: string;
  siteId?: string;
}

/**
 * Human resource work log.
 */
export interface WorkLogPayload {
  staffId: string;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  role?: string;
}

/**
 * Device-originated events.
 */
export interface DeviceEventPayload {
  deviceId: string;
  eventType: string;
  data?: unknown;
}

/* ============================================================================ */
/* CONTRIBUTION PAYLOAD MAP                                                     */
/* ============================================================================ */

export interface ContributionPayloadMap {
  financial_transaction: FinancialTransactionPayload;
  inventory_movement: InventoryMovementPayload;
  work_log: WorkLogPayload;
  device_event: DeviceEventPayload;
}

/* ============================================================================ */
/* DISCRIMINATED ENVELOPE UNION (CANONICAL)                                     */
/* ============================================================================ */

/**
 * Canonical envelope type used by Core.
 * Guarantees:
 * - `type` and `payload` are always aligned
 * - Type narrowing works everywhere
 */
export type AnyContributionEnvelope = {
  [K in ContributionType]: ContributionEnvelope<K, ContributionPayloadMap[K]>;
}[ContributionType];
