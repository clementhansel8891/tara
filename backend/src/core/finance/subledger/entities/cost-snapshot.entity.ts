import { Prisma } from '@prisma/client';

export class CostSnapshot {
  id: string;
  tenantId: string;
  skuId: string;
  locationId: string;
  totalQty: Prisma.Decimal;
  totalValuation: Prisma.Decimal;
  avgUnitCost: Prisma.Decimal;
  currency: string;
  snapshotDate: Date;
  layersUsed?: { layerId: string; qty: Prisma.Decimal }[];
  
  // Enhanced Traceability
  inventoryTransactionIds?: string[];
  subledgerEntryIds?: string[];
  
}
