import { Roles, type Role } from "./roles";

export interface SessionContext {
  user_id: string;
  tenant_id: string;
  company_id?: string;
  location_id: string;
  role: Role;
  department_id: string;
  token?: string;
  permissions: string[];
}

import { useAuth } from "@/contexts/AuthContext";

const FALLBACK_SESSION: SessionContext = {
  user_id: "",
  tenant_id: "",
  location_id: "",
  role: Roles.SYSTEM,
  department_id: "",
  permissions: [],
};

export function useSession(): SessionContext {
  const { session } = useAuth();

  // Return a safe empty session if not loaded to prevent crashes
  // (App.tsx routing handles actual redirection for unauthorized users)
  if (!session) {
    return FALLBACK_SESSION;
  }

  return session;
}

export function ensureTenant(tenantId: string, session: SessionContext): void {
  if (session.role === Roles.SUPERADMIN) return;
  if (tenantId !== session.tenant_id) {
    throw new Error("Tenant access denied");
  }
}
