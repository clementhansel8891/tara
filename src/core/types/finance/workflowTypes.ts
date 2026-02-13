export type WorkflowRequest = {
  id: string;
  tenantId: string;
  entityType: "PAYROLL" | "PURCHASE" | "PAYMENT" | "OTHER";
  entityId: string;
  makerDept: string;
  destinationDept: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowAction = {
  requestId: string;
  actorId: string;
  action: "approve" | "reject" | "delegate";
  notes?: string;
  createdAt: string;
};
