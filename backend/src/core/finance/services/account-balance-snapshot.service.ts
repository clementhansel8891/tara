import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IAccountBalanceSnapshotRepository } from '../repositories/interfaces/account-balance-snapshot.repository.interface';
import { IFiscalPeriodRepository } from '../repositories/interfaces/fiscal.repository.interface';
import { IJournalRepository } from '../repositories/interfaces/journal.repository.interface';
import { JournalEntry, AccountBalanceSnapshot } from '../domain/finance.interfaces';
import { FiscalPeriodStatus, PostingSide } from '../domain/finance.constants';

@Injectable()
export class AccountBalanceSnapshotService {
  private readonly logger = new Logger(AccountBalanceSnapshotService.name);

  constructor(
    private readonly snapshotRepo: IAccountBalanceSnapshotRepository,
    private readonly fiscalRepo: IFiscalPeriodRepository,
    private readonly journalRepo: IJournalRepository,
  ) {}

  /**
   * Resilience: Sequence Buffer & Atomic Propagation
   * Processes all lines of a journal in a single sequence-aware execution.
   */
  async handleJournalEntry(tenantId: string, companyId: string, entry: JournalEntry): Promise<void> {
    const periodId = entry.fiscalPeriodId;
    const ledgerSequence = entry.ledgerSequence || 0;

    // 1. Sequence Gap Detection & Buffering
    const lastSeq = await this.snapshotRepo.getLastAppliedSequence(tenantId, companyId, periodId);
    
    if (ledgerSequence > lastSeq + 1) {
      this.logger.warn(`Sequence Gap: Expected ${lastSeq + 1}, got ${ledgerSequence}. Buffering entry ${entry.id}.`);
      await this.snapshotRepo.saveToBuffer(tenantId, companyId, entry);
      return; 
    }

    if (ledgerSequence <= lastSeq && ledgerSequence !== 0) {
      this.logger.warn(`Duplicate Sequence: Entry ${entry.id} (Seq: ${ledgerSequence}) already surpassed by ${lastSeq}. Skipping.`);
      return;
    }

    // 2. BEGIN ATOMIC PROCESSING (Journal + Propagation)
    try {
      await this.processJournalAtomically(tenantId, companyId, entry);
      
      // 3. Update Sequence
      await this.snapshotRepo.updateLastAppliedSequence(tenantId, companyId, periodId, ledgerSequence);
      
      // 4. Clear from buffer if it was there
      await this.snapshotRepo.clearFromBuffer(tenantId, companyId, entry.id);

      // 5. Recursive Buffer Drain (Process next in sequence if buffered)
      const nextBuffered = await this.snapshotRepo.getFromBuffer(tenantId, companyId, periodId, ledgerSequence + 1);
      if (nextBuffered) {
        this.logger.log(`Gap Fixed: Processing buffered entry ${nextBuffered.id} (Seq: ${ledgerSequence + 1})`);
        await this.handleJournalEntry(tenantId, companyId, nextBuffered);
      }

    } catch (error) {
      this.logger.error(`Processing Error: Failed to apply entry ${entry.id}. ${error.message}`);
      throw error;
    }
  }

  private async processJournalAtomically(tenantId: string, companyId: string, entry: JournalEntry): Promise<void> {
    const lines = await this.journalRepo.findLines(entry.id);
    const periodId = entry.fiscalPeriodId;

    // Period State Enforcement
    const period = await this.fiscalRepo.findById(tenantId, companyId, periodId);
    if (!period) throw new BadRequestException('Period not found');
    if (period.status === FiscalPeriodStatus.CLOSED || period.status === FiscalPeriodStatus.HARD_LOCK) {
      throw new BadRequestException(`Immutability Violation: Cannot update snapshots for ${period.status} period.`);
    }

    for (const line of lines) {
      const netDelta = line.side === PostingSide.DEBIT ? line.amount : line.amount.negated();
      const currency = line.currency || 'USD';
      
      // Row Lock Current Period
      await this.snapshotRepo.acquireRowLock(tenantId, companyId, line.accountId, currency, periodId);

      let snapshot = await this.snapshotRepo.findByAccount(tenantId, companyId, line.accountId, currency, periodId);
      if (!snapshot) snapshot = await this.initializeSnapshot(tenantId, companyId, line.accountId, periodId, currency);

      if (line.side === PostingSide.DEBIT) {
        snapshot.debitTotal = (snapshot.debitTotal || new Prisma.Decimal(0)).plus(line.amount);
      } else {
        snapshot.creditTotal = (snapshot.creditTotal || new Prisma.Decimal(0)).plus(line.amount);
      }
      
      snapshot.closingBalance = (snapshot.openingBalance || new Prisma.Decimal(0)).plus(snapshot.debitTotal || 0).minus(snapshot.creditTotal || 0);
      snapshot.snapshotSequence = (snapshot.snapshotSequence || 0) + 1;
      snapshot.lastUpdatedAt = new Date();

      await this.snapshotRepo.upsert(tenantId, companyId, snapshot);

      // UNIFIED TRANSACTIONAL PROPAGATION
      await this.propagateForwardResilient(tenantId, companyId, line.accountId, period.fiscalYearId, period.periodNumber, netDelta, currency);
      
      await this.snapshotRepo.addLog({ 
        snapshotId: snapshot.id,
        ledgerEntryId: entry.id, 
        accountId: line.accountId, 
        periodId, 
        appliedAt: new Date() 
      });
    }
  }

  private async propagateForwardResilient(tenantId: string, companyId: string, accountId: string, yearId: string, startPeriod: number, delta: Prisma.Decimal, currency: string): Promise<void> {
    const futurePeriods = await this.snapshotRepo.findPeriodsAfter(tenantId, companyId, startPeriod, yearId);
    
    for (const periodId of futurePeriods) {
      await this.snapshotRepo.acquireRowLock(tenantId, companyId, accountId, currency, periodId);
      
      const snapshot = await this.snapshotRepo.findByAccount(tenantId, companyId, accountId, currency, periodId);
      if (snapshot) {
        snapshot.openingBalance = (snapshot.openingBalance || new Prisma.Decimal(0)).plus(delta);
        snapshot.closingBalance = (snapshot.closingBalance || new Prisma.Decimal(0)).plus(delta);
        snapshot.snapshotSequence = (snapshot.snapshotSequence || 0) + 1;
        snapshot.lastUpdatedAt = new Date();
        await this.snapshotRepo.upsert(tenantId, companyId, snapshot);
      }
    }
  }

  async triggerRecovery(tenantId: string, companyId: string, periodId: string): Promise<void> {
    const lastSeq = await this.snapshotRepo.getLastAppliedSequence(tenantId, companyId, periodId);
    this.logger.warn(`Controlled Recovery triggered for period ${periodId} from sequence ${lastSeq}`);
    await this.rebuildPeriod(tenantId, companyId, periodId);
  }

  async getSafeSnapshot(tenantId: string, companyId: string, accountId: string, periodId: string, currency: string): Promise<AccountBalanceSnapshot | null> {
    const closingSeq = await this.snapshotRepo.getClosingSnapshotSequence(tenantId, companyId, periodId);
    const snapshot = await this.snapshotRepo.findByAccount(tenantId, companyId, accountId, currency, periodId);

    if (closingSeq && snapshot && (snapshot.snapshotSequence || 0) > closingSeq) {
       this.logger.warn(`Audit Warning: Accessing snapshot newer than closing sequence (${snapshot.snapshotSequence} > ${closingSeq})`);
    }

    return snapshot;
  }

  private roundTo2(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  private async initializeSnapshot(tenantId: string, companyId: string, accountId: string, periodId: string, currency: string): Promise<AccountBalanceSnapshot> {
    return {
      id: `${tenantId}:${companyId}:${accountId}:${periodId}:${currency}`,
      tenantId,
      companyId,
      accountId,
      currency,
      periodId,
      openingBalance: new Prisma.Decimal(0), 
      debitTotal: new Prisma.Decimal(0),
      creditTotal: new Prisma.Decimal(0),
      closingBalance: new Prisma.Decimal(0),
      snapshotSequence: 0,
      snapshotDate: new Date(),
      lastUpdatedAt: new Date(),
    };
  }

  async rebuildPeriod(tenantId: string, companyId: string, periodId: string): Promise<void> {
    await this.fiscalRepo.acquireLock(tenantId, companyId, periodId);
    try {
      await this.snapshotRepo.deleteForPeriod(tenantId, companyId, periodId);
      const entries = await this.journalRepo.findAllOrderedByDate(tenantId, companyId);
      const periodEntries = entries.filter(e => e.fiscalPeriodId === periodId).sort((a, b) => (a.ledgerSequence || 0) - (b.ledgerSequence || 0));

      for (const entry of periodEntries) {
        await this.handleJournalEntry(tenantId, companyId, entry);
      }
    } catch (error) {
       this.logger.error(`Rebuild failed. ${error.message}`);
       throw error;
    }
  }

  async validateSnapshot(tenantId: string, companyId: string, periodId: string): Promise<boolean> {
    const rawBalances = await this.journalRepo.getRawBalances(tenantId, companyId, periodId, new Date('1970-01-01'), new Date('2099-12-31'));
    const snapshots = await this.snapshotRepo.findAllInPeriod(tenantId, companyId, periodId);

    for (const snapshot of snapshots) {
      const glBalance = new Prisma.Decimal(rawBalances[snapshot.accountId!] || 0);
      const snapDiff = (snapshot.closingBalance || new Prisma.Decimal(0)).minus(snapshot.openingBalance || 0);
      if (glBalance.minus(snapDiff).abs().gt(0.001)) {
        this.logger.error(`CRITICAL_MISMATCH: ${snapshot.accountId}. GL: ${glBalance}, Snap: ${snapDiff}`);
        return false;
      }
    }
    return true;
  }
}
