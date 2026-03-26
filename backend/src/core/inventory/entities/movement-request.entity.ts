export class MovementRequest {
  id: string;
  tenant_id: string;
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "APPROVED" | "REJECTED" | "FULFILLED";
  requestedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
