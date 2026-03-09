export type GovernancePhase = "Draft" | "Pending" | "Quorum" | "Executed";
export type DepartmentRole =
  | "Sales"
  | "Marketing"
  | "Retail HOD"
  | "Finance"
  | "Office HOD"
  | "Superadmin";

export interface Signature {
  id: string;
  department: DepartmentRole;
  signedBy: string;
  signedAt: string;
  comment?: string;
  isBypass?: boolean;
}

export interface AuditEntry {
  id: string;
  promoId: string;
  version: number;
  timestamp: string;
  actor: string;
  role: DepartmentRole;
  action: "Created" | "Signed" | "Executed" | "Bypassed" | "Archived";
  details: string;
}

export interface GovernanceState {
  phase: GovernancePhase;
  signatures: Signature[];
  quorumReached: boolean;
  requiredSignatures: number;
  isBypassMode: boolean;
  bypassReason: string;
}
