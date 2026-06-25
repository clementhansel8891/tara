import { Injectable } from '@nestjs/common';

/**
 * Context-based query filtering service.
 * Applies data access restrictions based on user context.
 */
@Injectable()
export class TaraContextQueryService {
  /**
   * Build a Prisma where clause based on context.
   */
  buildWhereClause(taraContext: any): any {
    return this.buildContextWhere(taraContext);
  }

  buildContextWhere(...args: any[]): any {
    const taraContext = args[0];
    if (taraContext?.isAdministrative) {
      return {};
    }
    return { employee_id: taraContext?.userId || taraContext?.sub };
  }

  /**
   * Validate that the user can access data in the given context.
   */
  validateContextAccess(...args: any[]): boolean {
    const user = args[0];
    const targetEmployeeId = args[1];
    if (!user) return false;
    if (user.role === 'SuperAdmin' || user.role === 'HR_Admin') return true;
    if (user.role === 'Supervisor') return true;
    return user.sub === targetEmployeeId;
  }

  /**
   * Sanitize employee data based on context.
   */
  sanitizeEmployeeData(data: any, ...args: any[]): any {
    const taraContext = args[0];
    if (taraContext?.isAdministrative) return data;
    const { password_hash, biometric_token_hash, ...safe } = data || {};
    return safe;
  }

  isAdministrative(taraContext: any): boolean {
    return taraContext?.isAdministrative === true;
  }
}
