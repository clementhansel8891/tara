/**
 * TARA System Roles
 */
export enum SystemRole {
  SUPER_ADMIN = 'SuperAdmin',
  HR_ADMIN = 'HR_Admin',
  SUPERVISOR = 'Supervisor',
  EMPLOYEE = 'Employee',
  // Legacy aliases from project-hug
  ADMIN = 'SuperAdmin',
  MANAGER = 'Supervisor',
  MEMBER = 'Employee',
}

// Alias for backward compatibility
export const UserRole = SystemRole;
export type UserRole = SystemRole;

export const HR_ROLES = [SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN];
export const SUPERVISOR_ROLES = [...HR_ROLES, SystemRole.SUPERVISOR];
export const ALL_ROLES = [...SUPERVISOR_ROLES, SystemRole.EMPLOYEE];
