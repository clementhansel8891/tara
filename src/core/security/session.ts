import { Roles, type Role } from "./roles";

export interface SessionContext {
  userId: string;
  tenantId: string;
  role: Role;
  departmentId: string;
}

export const DEV_SESSION: SessionContext = Object.freeze({
  userId: "user-demo",
  tenantId: "comp-demo-a",

  // DEV ACCESS (so Finance renders)
  role: Roles.SUPERADMIN,

  departmentId: "dept-ops",
});

export function useSession(): SessionContext {
  return DEV_SESSION;
}

export function ensureTenant(tenantId: string, session: SessionContext): void {
  if (session.role === Roles.SUPERADMIN) return;
  if (tenantId !== session.tenantId) {
    throw new Error("Tenant access denied");
  }
}
