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
   * @param options Scoping options (default: all enabled)
   */
  static getScope(
    context: TenantContext, 
    extra: any = {}, 
    options: { branch?: boolean; ecommerce?: boolean } = { branch: true, ecommerce: true }
  ) {
    const scope: any = {
      tenant_id: context.tenant_id,
    };

    if (options.branch !== false && context.branch_id) {
      scope.branch_id = context.branch_id;
    }

    if (options.ecommerce !== false && context.ecommerce_id) {
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
  static wrapCreate(
    context: TenantContext, 
    data: any,
    options: { branch?: boolean; ecommerce?: boolean } = { branch: true, ecommerce: true }
  ) {
    const wrapped: any = {
      ...data,
      tenant_id: context.tenant_id,
    };

    if (options.branch !== false) {
      wrapped.branch_id = context.branch_id || data.branch_id;
    }

    if (options.ecommerce !== false) {
      wrapped.ecommerce_id = context.ecommerce_id || data.ecommerce_id;
    }

    return wrapped;
  }
}
