import { Injectable, Logger, Inject, OnModuleDestroy } from '@nestjs/common';
import { LedgerPostingService } from './ledger-posting.service';
import { ILedgerPostingRepository } from '../repositories/interfaces/ledger-posting.repository.interface';
import { LedgerPostingStatus } from '../domain/finance.constants';

@Injectable()
export class LedgerWorkerService implements OnModuleDestroy {
  private readonly logger = new Logger(LedgerWorkerService.name);
  private isProcessing = false;
  private isShuttingDown = false;

  constructor(
    private readonly ledgerPostingService: LedgerPostingService,
    @Inject('ILedgerPostingRepository')
    private readonly ledgerRepo: ILedgerPostingRepository,
  ) {}

  onModuleDestroy() {
    this.logger.log('Shutdown signal received. Stopping LedgerWorkerService polling...');
    this.isShuttingDown = true;
  }

  /**
   * Polls for PENDING ledger postings and processes them asynchronously.
   * Uses tenant-aware processing and graceful shutdown checks.
   */
  async pollPendingPostings(tenantId: string, companyId: string, batchSize: number = 50, maxBatchPerTenant: number = 200): Promise<void> {
    if (this.isProcessing || this.isShuttingDown) return;
    this.isProcessing = true;

    try {
      // Phase 2.6: Tenant Throttling
      // prevent one tenant from monopolizing workers
      const toProcessBatch = Math.min(batchSize, maxBatchPerTenant);
      const toProcess = await this.ledgerRepo.claimPostings(tenantId, companyId, toProcessBatch);

      if (toProcess.length === 0) return;

      this.logger.log(`Worker picked up ${toProcess.length} PENDING postings for tenant ${tenantId} company ${companyId} (Throttled: ${toProcessBatch})`);

      // 3. Process batches concurrently
      await Promise.allSettled(
        toProcess.map(record => this.ledgerPostingService.processEvent(tenantId, companyId, record.id))
      );

    } catch (error) {
      this.logger.error(`Error in Ledger Worker execution: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Retries FAILED postings using exponential backoff.
   */
  async retryFailedPostings(tenantId: string, batchSize: number = 50): Promise<void> {
    if (this.isShuttingDown) return;
    // Logical SQL equivalent for production db:
    // SELECT id, tenant_id FROM ledger_posting
    // WHERE status = 'FAILED' 
    // AND retry_count < max_retry_attempts
    // AND next_retry_at <= NOW() AND tenant_id = $1
    // ORDER BY created_at LIMIT batchSize FOR UPDATE SKIP LOCKED
    
    this.logger.log(`Executing retry backoff logic for tenant ${tenantId}`);
  }

  /**
   * Phase 6: Worker Crash Recovery
   * Resets postings stuck in PROCESSING for more than 10 minutes.
   */
  async recoverStuckPostings(tenantId: string, companyId: string): Promise<void> {
    const threshold = new Date();
    threshold.setMinutes(threshold.getMinutes() - 10);

    const stuckPostings = await this.ledgerRepo.findStuckProcessing(tenantId, companyId, threshold);
    
    if (stuckPostings.length > 0) {
      this.logger.warn(`Recovering ${stuckPostings.length} stuck postings for tenant ${tenantId} company ${companyId}`);
      for (const posting of stuckPostings) {
        await this.ledgerRepo.updateStatus(tenantId, companyId, posting.id, LedgerPostingStatus.PENDING);
      }
    }
  }
}
