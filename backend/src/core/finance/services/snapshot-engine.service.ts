import { Injectable, Logger, Inject } from '@nestjs/common';
import { IAccountBalanceRepository } from '../repositories/interfaces/account-balance.repository.interface';
import { IJournalRepository } from '../repositories/interfaces/journal.repository.interface';
import { PostingSide } from '../domain/finance.constants';

@Injectable()
export class SnapshotEngineService {
  private readonly logger = new Logger(SnapshotEngineService.name);

  constructor(
    @Inject('IAccountBalanceRepository')
    private readonly accountBalanceRepo: IAccountBalanceRepository,
    @Inject('IJournalRepository')
    private readonly journalRepo: IJournalRepository,
  ) {}

  // Scheduled nightly via @Cron 
  async generateDailySnapshots(tenantId: string, fiscalPeriodId: string) {
    this.logger.log(`Generating DAILY_EOD snapshot for tenant ${tenantId}, period ${fiscalPeriodId}`);
    // Query repository and compress active dimensional balances into a reporting JSON blob
  }

  // Immutable HARD_LOCK snapshot for rapid reporting
  async generatePeriodCloseSnapshot(tenantId: string, fiscalPeriodId: string) {
    this.logger.log(`Generating PERIOD_CLOSE snapshot for tenant ${tenantId}, period ${fiscalPeriodId}`);
    // Immutable HARD_LOCK snapshot for rapid reporting
  }

  /**
   * Phase 6: Snapshot Rebuild Support
   * Recomputes AccountBalance from journal history.
   */
  async rebuildSnapshotFromJournals(tenantId: string, companyId: string): Promise<void> {
    this.logger.log(`Rebuilding snapshots from journal history for tenant ${tenantId}, company ${companyId}...`);

    const journals = await this.journalRepo.findAllOrderedByDate(tenantId, companyId);
    
    // Clear existing balances (In real DB: BEGIN; DELETE FROM finance_account_balances WHERE tenant_id = $1)
    // For mock, we'll just re-aggregate.

    const balanceMap = new Map<string, any>();

    for (const journal of journals) {
      const lines = await this.journalRepo.findLines(journal.id);
      for (const line of lines) {
        const key = `${line.accountId}-${journal.fiscalPeriodId}-${line.branchId}-${line.locationId}`;
        let bal = balanceMap.get(key) || {
          tenantId,
          companyId,
          fiscalPeriodId: journal.fiscalPeriodId,
          accountId: line.accountId,
          branchId: line.branchId,
          locationId: line.locationId,
          debitTotal: 0,
          creditTotal: 0,
          netBalance: 0,
          version: 1,
          updatedAt: new Date(),
        };

        if (line.side === PostingSide.DEBIT) bal.debitTotal += line.amount;
        else bal.creditTotal += line.amount;

        bal.netBalance = bal.debitTotal - bal.creditTotal;
        balanceMap.set(key, bal);
      }
    }

    // Persist recomputed balances
    for (const bal of balanceMap.values()) {
      await this.accountBalanceRepo.updateBalance(tenantId, companyId, bal);
    }

    this.logger.log(`Snapshot rebuild completed for tenant ${tenantId} company ${companyId}.`);
  }
}
