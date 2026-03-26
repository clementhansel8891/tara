import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../roles';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }

    const { tenantContext } = context.switchToHttp().getRequest();
    
    if (!tenantContext || !tenantContext.role) {
      throw new ForbiddenException('Tenant context or role missing');
    }

    const hasRole = requiredRoles.includes(tenantContext.role as UserRole);
    
    if (!hasRole) {
      throw new ForbiddenException(`Access Denied: Required roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
