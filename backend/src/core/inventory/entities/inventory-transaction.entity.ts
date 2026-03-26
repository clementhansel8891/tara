export class InventoryTransaction {
  id: string;
  tenantId: string;
  locationId: string;
  skuId: string;
  type: 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT' | 'RETURN' | 'TRANSFER';
  qty: number;
  uom: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  sourceId: string; // Operational source (PO Receipt ID, Order ID)
  createdAt: Date;
  updatedAt: Date;
}
