import { UserRole } from "../../../shared/roles";

/**
 * TenantScope value object.
 *
 * The validated set of identifiers used to filter every HR data-access query so
 * that a caller only reads or writes records belonging to their own tenant and
 * permitted scope.
 *
 * Invariants enforced by the resolver (see {@link TenantScopeResolver}):
 * - `tenant_id` is ALWAYS sourced from the verified TenantContext, never from
 *   client-supplied headers or request body fields (Requirement 2.3).
 * - `tenant_id` and `company_id` are distinct identifiers; a `company_id` is
 *   never substituted by `tenant_id` (no `company_id = tenant_id` fallback)
 *   (Requirement 2.4).
 * - `company_id` / `location_id` are only present once validated to belong to
 *   the caller's `tenant_id` (Requirement 2.5).
 */
export interface TenantScope {
  /** SaaS Tenant ID (Root level). Always sourced from the verified context. */
  tenant_id: string;
  /** Company ID (Legal Entity level), only when it belongs to `tenant_id`. */
  company_id?: string;
  /** Location ID (Physical location), only when it belongs to `tenant_id`. */
  location_id?: string;
}

/** A scope filter the caller requested explicitly (e.g. via query params). */
export interface RequestedScope {
  location_id?: string;
  company_id?: string;
}

/**
 * Roles permitted to widen scope beyond their own context (cross-location /
 * cross-company / global), still validated against their `tenant_id`.
 */
export const PRIVILEGED_ROLES: ReadonlySet<string> = new Set<string>([
  UserRole.SUPERADMIN,
  UserRole.OWNER,
  UserRole.ADMIN,
]);

/**
 * Returns true when the supplied role may widen scope.
 * Unknown / missing roles are treated as non-privileged (least privilege).
 */
export function isPrivilegedRole(role?: string | null): boolean {
  return !!role && PRIVILEGED_ROLES.has(role);
}
