export class MovementRequest {
  id: string;
  tenant_id: string;
  type: "PO" | "TRANSFER";
  status: "PENDING" | "APPROVED" | "REJECTED" | "FULFILLED";
  requestingLocationId: string;
  requestingAddress?: string;
  sourceType: "EXTERNAL" | "INTERNAL";
  sourceLocationId?: string; // If INTERNAL
  supplierReference?: string; // If EXTERNAL
  lines: MovementRequestLine[];
  reason: string;
  expectedDate?: Date;
  requestedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MovementRequestLine {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  uom: string;
  note?: string;
}
