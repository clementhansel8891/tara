import type { Role } from "./roles";
import type { SessionContext } from "./session";

type DelegationRecord = {
  userId: string;
  tenantId: string;
  roles: Role[];
  expiresAt?: string;
};

const KEY = "core.role.delegations";

const read = (): DelegationRecord[] => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as DelegationRecord[]) : [];
};

export function getDelegatedRoles(session: SessionContext): Role[] {
  const now = new Date().toISOString();
  return read()
    .filter(
      (record) =>
        record.tenantId === session.tenant_id &&
        record.userId === session.user_id &&
        (!record.expiresAt || record.expiresAt >= now),
    )
    .flatMap((record) => record.roles);
}
