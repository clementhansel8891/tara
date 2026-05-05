import { useMemo } from "react";
import { useIdentity } from "@/core/identity/context";
import { useSession } from "@/core/security/session";

export interface GovernanceContext {
  /** Can manage personnel/staffing/attendance across all departments */
  canManagePersonnel: boolean;
  /** Can manage budgets/limits/financial policies across all departments */
  canManageFiscal: boolean;
  /** Can manage accounts/devices/security across all departments */
  canManageInfrastructure: boolean;
  /** The department the user is currently assigned to */
  userDepartmentId: string | null;
  /** Whether the user is restricted to their own department's view */
  isLockedToDepartment: boolean;
}

/**
 * useDepartmentalGovernance
 * Centralized hook for cross-departmental authority and permission gating.
 * HR, Finance, and IT maintain global oversight within their domains.
 */
export function useDepartmentalGovernance(): GovernanceContext {
  const { state: identity } = useIdentity();
  const session = useSession();

  return useMemo(() => {
    const userDeptId = session.department_id || identity.user?.departmentId || null;

    // Personnel Authority (HR or Admin)
    const canManagePersonnel = identity.roles.some(role => 
      role.permissions.some(p => p.resource === "*" || p.resource === "HR")
    );

    // Fiscal Authority (Finance or Admin)
    const canManageFiscal = identity.roles.some(role => 
      role.permissions.some(p => p.resource === "*" || p.resource === "FINANCE")
    );

    // Infrastructure Authority (IT or Admin)
    const canManageInfrastructure = identity.roles.some(role => 
      role.permissions.some(p => p.resource === "*" || p.resource === "IT")
    );

    // A user is locked if they aren't a global manager in any relevant domain for the current view
    // (This part is context-dependent, but we provide the base flags here)
    const isLockedToDepartment = !canManagePersonnel && !canManageFiscal && !canManageInfrastructure;

    return {
      canManagePersonnel,
      canManageFiscal,
      canManageInfrastructure,
      userDepartmentId: userDeptId,
      isLockedToDepartment
    };
  }, [identity, session]);
}
