export interface InventoryAdjustment {
  id: string;
  tenant_id: string;
  item_id: string;
  location_id: string;
  department_id?: string;
  requested_delta: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requested_by: string;
  approved_by?: string;
  approved_at?: Date;
  created_at: Date;
  updated_at: Date;
}
