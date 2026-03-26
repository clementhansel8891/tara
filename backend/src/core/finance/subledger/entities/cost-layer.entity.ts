import { Prisma } from '@prisma/client';

export class CostLayer {
  id: string;
  tenantId: string;
  skuId: string;
  locationId: string;
  qty: Prisma.Decimal;
  remainingQty: Prisma.Decimal;
  unitCost: Prisma.Decimal;
  currency: string;
  method: 'FIFO' | 'LIFO' | 'AVERAGE';
  sourceEventId: string;
  createdAt: Date;
}
