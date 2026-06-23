

/**
 * Structural scope input accepted by {@link MultiTenancyUtil.getScope}.
 *
 * Both the verified {@link TenantContext} and the resolved `TenantScope` value
 * object (`{ tenant_id, company_id?, location_id?, branch_id? }`) satisfy this
 * shape, so the same scoping helper can build a Prisma `where` clause from
 * either. This lets the core operational modules pass a resolved `TenantScope`
 * straight through their service/repository layers without re-deriving scope
 * from raw context.
 */
export interface ScopeLike {
  tenant_id: string;
  company_id?: string;
  branch_id?: string;
  ecommerce_id?: string;
  location_id?: string;
}

/**
 * Multi-Tenancy Utility
 * Provides helpers for scoping queries based on TenantContext
 */
export class MultiTenancyUtil {
  /**
   * Returns a Prisma 'where' object scoped to the current context.
   *
   * **Default behaviour (safe for all core business tables):**
   * Only `tenant_id` and `company_id` are included.  `location_id` and
   * `branch_id` are **excluded by default** because the vast majority of core
   * business tables (finance, sales, marketing, payment, pricing, procurement,
   * HR, etc.) do not have those columns. Including them in a Prisma `where`
   * clause for a table that lacks the column causes Prisma to throw an internal
   * error (HTTP 500).
   *
   * **When to opt in:**
   * Pass `{ includeBranch: true }` only for tables that physically have both
   * `location_id` AND `branch_id` columns (e.g. stock_levels, stock_movements,
   * inventory_* tables, retail_* tables, supplier_products, warehouse_bins).
   *
   * @param context   The current tenant context or resolved tenant scope.
   * @param extra     Extra filters to merge into the returned where object.
   * @param options   Scoping options.
   */
  static getScope(
    context: ScopeLike,
    extra: any = {},
    options: {
      /**
       * When `true`, include `branch_id` and `location_id` in the where clause.
       * Only use for tables that have both columns in the schema.
       * @default false
       */
      includeBranch?: boolean;
      /**
       * @deprecated Use `includeBranch: true` instead of `excludeBranch: false`.
       * Kept for backward-compatibility; has no effect when `includeBranch` is set.
       */
      excludeBranch?: boolean;
      excludeEcommerce?: boolean;
    } = {},
  ) {
    const scope: any = {
      tenant_id: context.tenant_id,
    };

    if (context.company_id) {
      scope.company_id = context.company_id;
    }

    // Include branch/location ONLY when explicitly requested.
    // The old `excludeBranch` option defaulted to false (include by default),
    // which was the source of 500 errors.  The new `includeBranch` option is
    // opt-in, making the safe behaviour the default.
    const shouldIncludeBranch =
      options.includeBranch === true ||
      (options.excludeBranch === false);

    if (shouldIncludeBranch) {
      if (context.branch_id) {
        scope.branch_id = context.branch_id;
      }
      if (context.location_id) {
        scope.location_id = context.location_id;
      }
    }

    if (context.ecommerce_id && !options.excludeEcommerce) {
      scope.ecommerce_id = context.ecommerce_id;
    }

    return {
      ...scope,
      ...extra,
    };
  }

  /**
   * Standardizes creation data with multi-tenancy IDs.
   *
   * Accepts any {@link ScopeLike} input (the verified `TenantContext` or a
   * resolved `TenantScope`), so the core operational modules can persist using
   * a scope resolved from the verified context rather than a raw context.
   */
  static wrapCreate(context: ScopeLike, data: any) {
    return {
      ...data,
      tenant_id: context.tenant_id,
      branch_id: context.branch_id || data.branch_id,
      ecommerce_id: context.ecommerce_id || data.ecommerce_id,
    };
  }
}
