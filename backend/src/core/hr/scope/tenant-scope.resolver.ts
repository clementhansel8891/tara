import { Injectable } from '@nestjs/common';

export interface ResolvedScope {
  tenant_id: string;
  context: 'administrative' | 'personal_employee';
  user_id: string;
}

/**
 * TenantScopeResolver (TARA single-tenant system).
 * Provides context resolution for data access filtering.
 */
@Injectable()
export class TenantScopeResolver {
  /**
   * Resolve scope from request/user info.
   */
  resolve(userOrRole: any, interfaceOrigin?: string): ResolvedScope {
    const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role;
    const userId = typeof userOrRole === 'string' ? '' : userOrRole?.sub || userOrRole?.user_id || '';
    const origin = interfaceOrigin || userOrRole?.interface_origin || 'web';

    const isAdmin = (role === 'HR_Admin' || role === 'SuperAdmin') && origin === 'web';

    return {
      tenant_id: 'tara-default', // Single tenant
      context: isAdmin ? 'administrative' : 'personal_employee',
      user_id: userId,
    };
  }

  resolveContext(role: string, interfaceOrigin: string): 'administrative' | 'personal_employee' {
    if ((role === 'HR_Admin' || role === 'SuperAdmin') && interfaceOrigin === 'web') {
      return 'administrative';
    }
    return 'personal_employee';
  }

  applyDataFilter(context: 'administrative' | 'personal_employee', userId: string): any {
    if (context === 'personal_employee') {
      return { employee_id: userId };
    }
    return {};
  }
}
