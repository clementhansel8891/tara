export class InventoryReservation {
  id: string;
  tenantId: string;
  locationId: string;
  skuId: string;
  qty: number;
  status: 'RESERVED' | 'COMMITTED' | 'EXPIRED' | 'RELEASED';
  expiryAt: Date;
  estCost?: number;
  priceSnapshot?: any; // JSON containing rule and price at time of reservation
  createdAt: Date;
  updatedAt: Date;
}
