export class ProvisioningRequest {
  id: string;
  tenantId: string;
  employeeId?: string;
  supplierId?: string;
  supplierBranchId?: string;
  scope: "quote" | "invoice" | "delivery_proof" | "full_portal";
  priority: string;
  description?: string;
  reason: string;
  status: "requested" | "provisioned" | "revoked";
  requestedBy: string;
  provisionedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
