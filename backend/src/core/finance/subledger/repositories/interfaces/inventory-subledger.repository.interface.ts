import { Prisma } from '@prisma/client';
import { InventorySubledgerEntry } from '../../entities/inventory-subledger-entry.entity';
import { CostLayer } from '../../entities/cost-layer.entity';
import { CostSnapshot } from '../../entities/cost-snapshot.entity';
import { TenantContext } from "../../../../../gateway/tenant-context.interface";

export interface IInventorySubledgerRepository {
  // Entry Management
  createEntry(ctx: TenantContext, data: Partial<InventorySubledgerEntry>, tx?: Prisma.TransactionClient): Promise<InventorySubledgerEntry>;
  getEntryById(ctx: TenantContext, id: string, tx?: Prisma.TransactionClient): Promise<InventorySubledgerEntry>;
  findEntryBySourceEvent(ctx: TenantContext, sourceEventId: string, entryType: string, tx?: Prisma.TransactionClient): Promise<InventorySubledgerEntry | null>;
  updateEntryStatus(ctx: TenantContext, id: string, status: string, metadata?: any, tx?: Prisma.TransactionClient): Promise<InventorySubledgerEntry>;
  lockEntry(ctx: TenantContext, id: string, tx?: Prisma.TransactionClient): Promise<InventorySubledgerEntry>;

  // Cost Layer Management
  getCostLayers(ctx: TenantContext, skuId: string, location_id: string, tx?: Prisma.TransactionClient): Promise<CostLayer[]>;
  createCostLayer(ctx: TenantContext, data: Partial<CostLayer>, tx?: Prisma.TransactionClient): Promise<CostLayer>;
  updateCostLayer(ctx: TenantContext, id: string, data: Partial<CostLayer>, tx?: Prisma.TransactionClient): Promise<CostLayer>;
  createCostSnapshot(ctx: TenantContext, data: Partial<CostSnapshot>, tx?: Prisma.TransactionClient): Promise<CostSnapshot>;
  
  // Valuation
  getCurrentValuation(ctx: TenantContext, skuId: string, location_id: string, tx?: Prisma.TransactionClient): Promise<{ unitCost: Prisma.Decimal; currency: string; method: string }>;
}
