import { TenantContext } from "../../../gateway/tenant-context.interface";
import { InventorySubledgerEntry } from './entities/inventory-subledger-entry.entity';

export abstract class IInventorySubledgerService {
  abstract recordEntry(ctx: TenantContext, data: Partial<InventorySubledgerEntry>): Promise<InventorySubledgerEntry>;
  abstract getSkuValuation(ctx: TenantContext, skuId: string, location_id: string): Promise<{ unitCost: number; currency: string; method: string }>;
}
