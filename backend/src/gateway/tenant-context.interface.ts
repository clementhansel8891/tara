/**
 * Tenant context interface (stub for TARA single-tenant system).
 * Kept for backward compatibility with copied controllers.
 */
export interface TenantContext {
  tenant_id?: string;
  user_id: string;
  role: string;
  interface_origin?: 'web' | 'mobile';
}

export function extractTenantContext(req: any): TenantContext {
  return {
    user_id: req.user?.sub || '',
    role: req.user?.role || 'Employee',
    interface_origin: req.headers?.['x-interface-origin'] || 'web',
  };
}
