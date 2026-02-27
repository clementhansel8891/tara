export class StockBalance {
  id: string;
  tenant_id: string;
  itemId: string;
  locationId: string;
  departmentId?: string;
  quantity: number;
  reservedQuantity: number;
  avgUnitCost: number;
  reorderPoint: number;
  safetyStock: number;
  updatedAt: Date;
}
