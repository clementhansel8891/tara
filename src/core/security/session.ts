import { Roles, type Role } from "./roles";

export interface SessionContext {
  userId: string;
  tenantId: string;
  role: Role;
  departmentId: string;
}

const DEV_SESSION: SessionContext = Object.freeze({
  userId: "user-demo",
  tenantId: "tenant-demo",

  // DEV ACCESS (so Finance renders)
  role: Roles.SUPERADMIN,

  departmentId: "dept-ops",
});

export function useSession(): SessionContext {
  return DEV_SESSION;
}
