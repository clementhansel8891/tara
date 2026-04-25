import { Injectable, Logger, Inject } from '@nestjs/common';
import { IInventorySubledgerRepository } from './repositories/interfaces/inventory-subledger.repository.interface';
import { InventorySubledgerEntry } from './entities/inventory-subledger-entry.entity';
import { IInventorySubledgerService } from './inventory-subledger.service.interface';
import { AccountingMappingService } from '../services/accounting-mapping.service';
import { SubledgerEntryType, SubledgerEntryStatus } from '../entities/finance-subledger.entity';
import { TenantContext } from '../../../gateway/tenant-context.interface';

@Injectable()
export class InventorySubledgerService implements IInventorySubledgerService {
  private readonly logger = new Logger(InventorySubledgerService.name);

  constructor(
    @Inject('IInventorySubledgerRepository')
    private readonly repository: IInventorySubledgerRepository,
    private readonly mappingService: AccountingMappingService,
  ) {}

  /**
   * Records a subledger entry with standardized lifecycle and account resolution.
   * Lifecycle: PENDING -> VALIDATED -> POSTING -> POSTED
   */
  async recordEntry(ctx: TenantContext, data: Partial<InventorySubledgerEntry>): Promise<InventorySubledgerEntry> {
    this.logger.log(`Recording inventory subledger entry for transaction ${data.inventoryTransactionId}`);

    // 1. Map entryType to unified SubledgerEntryType
    let unifiedType: SubledgerEntryType;
    switch (data.entryType) {
        case 'INVENTORY_ISSUE': unifiedType = SubledgerEntryType.INV_ISSUE; break;
        case 'COGS_RECOGNITION': unifiedType = SubledgerEntryType.INV_ISSUE; break; // COGS is part of ISSUE flow
        case 'INVENTORY_REVALUATION': unifiedType = SubledgerEntryType.INV_ADJUSTMENT; break;
        default: unifiedType = SubledgerEntryType.INV_ADJUSTMENT;
    }

    // 2. Resolve Accounting Mapping
    const mapping = await this.mappingService.resolveAccounts(
        ctx.tenant_id,
        ctx.company_id || 'COMP-001', // Use company from context
        unifiedType,
        'INV_TRANSACTION'
    );

    // 3. Enrich with specialized mapping
    data.debitAccountId = mapping.debitAccountId;
    data.creditAccountId = mapping.creditAccountId;
    data.status = 'VALIDATED' as any; // Standardized state

    return this.repository.createEntry(ctx, data);
  }

  async getSkuValuation(ctx: TenantContext, skuId: string, location_id: string) {
    const valuation = await this.repository.getCurrentValuation(ctx, skuId, location_id);
    return {
      ...valuation,
      unitCost: Number(valuation.unitCost),
    };
  }
}
