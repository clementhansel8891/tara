import { TenantContext } from '../../gateway/tenant-context.interface';

/**
 * Multi-Tenancy Utility
 * Provides helpers for scoping queries based on TenantContext
 */
export class MultiTenancyUtil {
  /**
   * Returns a Prisma 'where' object scoped to the current context
   * @param context The current tenant context
   * @param extra Extra filters to merge
   */
  static getScope(context: TenantContext, extra: any = {}) {
    const scope: any = {
      tenant_id: context.tenant_id,
    };

    if (context.ecommerce_id) {
      scope.ecommerce_id = context.ecommerce_id;
    }

    return {
      ...scope,
      ...extra,
    };
  }

  /**
   * Standardizes creation data with multi-tenancy IDs
   */
  static wrapCreate(context: TenantContext, data: any) {
    return {
      ...data,
      tenant_id: context.tenant_id,
      ecommerce_id: context.ecommerce_id || data.ecommerce_id,
    };
  }
}
