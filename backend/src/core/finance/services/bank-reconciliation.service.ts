import { Injectable, Logger } from '@nestjs/common';
import { BankReconciliation } from '../domain/cash.interfaces';
import { PostingGatewayService } from './posting-gateway.service';
import { FiscalPeriodService } from './fiscal-period.service';

@Injectable()
export class BankReconciliationService {
  private readonly logger = new Logger(BankReconciliationService.name);

  constructor(
    private readonly gateway: PostingGatewayService,
    private readonly fiscalPeriodService: FiscalPeriodService,
  ) {}

  /**
   * Reconciles a bank account based on a statement balance.
   * Enforces manual adjustment via subledger if a mismatch is found.
   */
  async reconcile(recon: BankReconciliation): Promise<void> {
    this.logger.log(`Starting reconciliation for Account ${recon.bankAccountId} on ${recon.statementDate}`);

    // Resolve Fiscal Period
    const currentPeriodId = await this.fiscalPeriodService.validatePeriodOpenForPosting(
      'TENANT-001', // Contextual lookup in real app
      'COMP-001',
      'SYS_AUTO',
      'SYS_USER'
    );

    if (recon.difference !== 0) {
      this.logger.warn(`Mismatch detected: ${recon.difference}. Status set to UNMATCHED.`);
      
      // ARCHITECTURAL CORRECTION: Remove auto-adjustment.
      // Adjustments must be triggered manually via a dedicated adjustment service 
      // which creates a SubledgerEntry before calling UFPG.
      
      recon.status = 'DRAFT'; // Keep in DRAFT or a new 'UNMATCHED' state
      this.logger.error(`Manual adjustment required for discrepancy of ${recon.difference}.`);
      
      // We block auto-completion if there is a difference
      throw new Error(`Reconciliation mismatch. Auto-adjustment is disabled. Please create a manual adjustment entry.`);
    } else {
      recon.status = 'COMPLETED';
      this.logger.log(`Reconciliation balanced successfully.`);
    }
  }
}
