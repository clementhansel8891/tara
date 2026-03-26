import { Injectable, Logger, Inject } from '@nestjs/common';
import { PostingGatewayService } from '../services/posting-gateway.service';
import { InventorySubledgerEntry } from './entities/inventory-subledger-entry.entity';
import { CostSnapshot } from './entities/cost-snapshot.entity';
import { IInventorySubledgerRepository } from './repositories/interfaces/inventory-subledger.repository.interface';
import { PrePostingValidator } from './validators/pre-posting.validator';
import { v4 as uuid } from 'uuid';

@Injectable()
export class InventoryAccountingIntegrationService {
  private readonly logger = new Logger(InventoryAccountingIntegrationService.name);

  constructor(
    private readonly gateway: PostingGatewayService,
    @Inject('IInventorySubledgerRepository')
    private readonly repository: IInventorySubledgerRepository,
    private readonly validator: PrePostingValidator,
  ) {}

  async handleCostFinalized(tenant_id: string, entry: InventorySubledgerEntry, snapshot: CostSnapshot, correlationId?: string): Promise<void> {
    this.logger.log(`Integrating subledger entry ${entry.id} with UFPG`);
    
    // 1. Pre-Posting Validation
    const valResult = await this.validator.validate(entry);
    if (!valResult.valid) {
      this.logger.error(`Audit Block: Entry ${entry.id} failed validation: ${valResult.error}`);
      await this.repository.updateEntryStatus(tenant_id, entry.id, 'FAILED', {
        failureType: 'VALIDATION_ERROR'
      });
      return;
    }

    const companyId = 'COMP-DEFAULT';
    const eventType = this.mapEntryTypeToFinancialEvent(entry.entryType);
    if (!eventType) return;

    const request = {
      requestId: entry.postingRequestId, // Use unique request ID for UFPG idempotency
      tenantId: tenant_id,
      companyId,
      sourceEventId: entry.id,
      eventType,
      eventVersion: '1.0.0',
      payload: {
        skuId: entry.skuId,
        locationId: entry.locationId,
        qty: entry.qty,
        amount: entry.amount,
        currency: entry.currency,
        fiscalPeriodId: entry.accountingPeriodId,
        inventoryTransactionId: entry.inventoryTransactionId,
      },
      metadata: {
        userId: 'SYSTEM',
        timestamp: new Date().toISOString(),
        correlationId,
      },
    };

    try {
      const result = await this.gateway.postEvent(request as any);
      
      if (result.status === 'FAILED') {
        this.logger.error(`UFPG posting failed for entry ${entry.id}: ${result.errorMessage}`);
        await this.repository.updateEntryStatus(tenant_id, entry.id, 'FAILED', {
          failureType: 'INTEGRATION_ERROR'
        });
      } else {
        this.logger.log(`UFPG posting successful for entry ${entry.id}: Journal ${result.journalId}`);
        // Lock the entry upon success
        await this.repository.lockEntry(tenant_id, entry.id);
        await this.repository.updateEntryStatus(tenant_id, entry.id, 'POSTED', {
          glJournalId: result.journalId,
          postedAt: new Date(),
          postedPeriodId: entry.accountingPeriodId
        });
      }
    } catch (error) {
      this.logger.error(`UFPG integration exception for ${entry.id}: ${error.message}`);
      await this.repository.updateEntryStatus(tenant_id, entry.id, 'FAILED', {
        failureType: 'SYSTEM_ERROR'
      });
    }
  }

  private mapEntryTypeToFinancialEvent(type: string): string | null {
    switch (type) {
      case 'INVENTORY_ISSUE': return 'INVENTORY_ISSUED';
      case 'PROVISIONAL_ADJUSTMENT': return 'INVENTORY_RECEIVED';
      case 'COGS_RECOGNITION': return 'COGS_RECORDED';
      case 'INVENTORY_REVALUATION': return 'INVENTORY_REVALUED';
      default: return null;
    }
  }
}
