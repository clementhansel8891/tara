/**
 * Tenant Context Interface
 * Represents the multi-tenant context extracted from request headers
 */
export interface TenantContext {
  /**
   * SaaS Tenant ID
   * Required for all operations
   */
  tenantId: string;

  /**
   * Company ID (Legal Entity)
   * Required for finance/HR operations
   */
  companyId: string;

  /**
   * Location ID (optional)
   * Used for location-specific operations
   */
  locationId?: string;

  /**
   * User ID (optional, from x-actor-id)
   */
  userId?: string;

  /**
   * User Role (optional, from x-user-role)
   */
  role?: string;
}
