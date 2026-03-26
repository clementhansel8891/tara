import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InventoryRole, INVENTORY_ROLE_KEY } from "./inventory-role.decorator";
import { UserRole } from "../../../shared/roles";

@Injectable()
export class InventoryRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRole = this.reflector.getAllAndOverride<InventoryRole>(
      INVENTORY_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRole) {
      return true;
    }

    const { tenantContext } = context.switchToHttp().getRequest();
    const userRole = tenantContext.role;

    // 1. SUPERADMIN/OWNER/COMPANY_ADMIN bypass
    if (
      userRole === UserRole.SUPERADMIN ||
      userRole === UserRole.OWNER ||
      userRole === "COMPANY_ADMIN"
    ) {
      return true;
    }

    // 2. Map core roles to inventory hierarchy if specific inventory roles aren't set
    // For now, we assume if you are a DEPT_HEAD you are at least a MANAGER
    const isDeptHead = userRole === "DEPT_HEAD";

    if (requiredRole === InventoryRole.MANAGER) {
      return isDeptHead;
    }

    if (requiredRole === InventoryRole.SUPERVISOR) {
      return isDeptHead || userRole === "SUPERVISOR";
    }

    if (requiredRole === InventoryRole.CLERK) {
      return true; // All authenticated users can be clerks for now
    }

    return false;
  }
}
