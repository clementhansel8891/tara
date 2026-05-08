export class StockMovement {
  id: string;
  tenant_id: string;
  item_id: string;
  movement_type:
    | "intake"
    | "deduction"
    | "transfer_out"
    | "transfer_in"
    | "adjustment_plus"
    | "adjustment_minus";
  quantity: number;
  unit_cost: number;
  reason: string;
  source_location_id?: string;
  source_department_id?: string;
  destination_location_id?: string;
  destination_department_id?: string;
  reference_type?: string;
  reference_id?: string;
  created_by: string;
  created_at: Date;
}
