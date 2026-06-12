import { Injectable, Logger, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { IFiscalPeriodRepository } from '../repositories/interfaces/fiscal.repository.interface';
import { IJournalRepository } from '../repositories/interfaces/journal.repository.interface';
import { IAccountBalanceRepository } from '../repositories/interfaces/account-balance.repository.interface';
import { IChartOfAccountRepository } from '../repositories/interfaces/coa.repository.interface';
import { IUnitOfWork } from '../repositories/interfaces/uow.interface';
import {
  PeriodClosingRecord,
  ClosingExecutionLock,
  ReversalBatch,
} from '../domain/finance.interfaces';
import { AccountType, FiscalPeriodStatus, JournalStatus, JournalType, PostingSide } from '../domain/finance.constants';
import { HashingService } from '../utils/hashing.service';
import { Prisma } from '@prisma/client';
import { FiscalPeriodDbRepository } from '../repositories/fiscal-period.db.repository';
import { JournalDbRepository } from '../repositories/journal.db.repository';
import { AccountBalanceDbRepository } from '../repositories/account-balance.db.repository';
import { CoaDbRepository } from '../repositories/coa.db.repository';

const BASE_CURRENCY = 'IDR';
const RETAINED_EARNINGS_CODE = '3900';

@Injectable()
export class PeriodClosingService {
  private readonly logger = new Logger(PeriodClosingService.name);

  constructor(
    @Inject('IFiscalPeriodRepository')
    private readonly fiscalRepo: IFiscalPeriodRepository,
    @Inject('IJournalRepository')
    private readonly journalRepo: IJournalRepository,
    @Inject('IAccountBalanceRepository')
    private readonly balanceRepo: IAccountBalanceRepository,
    @Inject('IChartOfAccountRepository')
    private readonly coaRepo: IChartOfAccountRepository,
    @Inject('IUnitOfWork')
    private readonly uow: IUnitOfWork,
    private readonly hashingService: HashingService,
  ) {}

  /**
   * Durable, atomic period close.
   *
   * In a SINGLE RepeatableRead transaction (tx-bound repos), this:
   *   1. Re-validates the period is OPEN.
   *   2. Posts a CLOSING journal that zeroes every P&L account into Retained
   *      Earnings (close-to-equity), updating account balances.
   *   3. Persists a durable finance_period_closing_records row.
   *   4. Flips the period to CLOSED.
   * Either everything commits or nothing does.
   */
  async closePeriod(tenant_id: string, company_id: string, periodId: string, closedBy: string): Promise<string> {
    const period = await this.fiscalRepo.findById(tenant_id, company_id, periodId);
    if (!period) throw new BadRequestException('Fiscal period not found');
    if (period.status !== FiscalPeriodStatus.OPEN) {
      throw new BadRequestException(`Period ${periodId} is already ${period.status}`);
    }

    // Acquire execution lock (the atomic CLOSED flip is the true guard; this
    // gives an explicit, observable in-progress marker + a fast reject path).
    const existingLock = await this.fiscalRepo.getExecutionLock(tenant_id, company_id, periodId);
    if (existingLock && existingLock.status === 'IN_PROGRESS' && existingLock.expiresAt.getTime() > Date.now()) {
      throw new ConflictException(`Closing already in progress for period ${periodId} (locked by ${existingLock.lockedBy})`);
    }
    const requestId = uuid();
    await this.fiscalRepo.saveExecutionLock(tenant_id, company_id, {
      id: uuid(),
      periodId,
      closingRequestId: requestId,
      status: 'IN_PROGRESS',
      lockedBy: closedBy,
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 300000),
      updated_at: new Date(),
    });

    try {
      const closingRecordId = await this.uow.execute(async (tx: Prisma.TransactionClient) => {
        const fiscalRepoTx = new FiscalPeriodDbRepository(tx as any);
        const journalRepoTx = new JournalDbRepository(tx);
        const balanceRepoTx = new AccountBalanceDbRepository(tx);
        const coaRepoTx = new CoaDbRepository(tx);

        // Re-validate inside the transaction snapshot.
        const p = await fiscalRepoTx.findById(tenant_id, company_id, periodId);
        if (!p || p.status !== FiscalPeriodStatus.OPEN) {
          throw new BadRequestException(`Period ${periodId} is not OPEN`);
        }

        // Gather period balances for P&L accounts.
        const accounts = await coaRepoTx.findAll(tenant_id, company_id);
        const plAccounts = accounts.filter(
          (a: any) => a.accountType === AccountType.REVENUE || a.accountType === AccountType.EXPENSE,
        );
        const rawBalances = await journalRepoTx.getRawBalances(
          tenant_id,
          company_id,
          periodId,
          p.start_date,
          p.end_date,
        );

        // Build closing lines: post the OPPOSITE of each P&L net to zero it.
        // net = Σdebit − Σcredit. net>0 (debit balance, e.g. expense) → CREDIT it.
        // net<0 (credit balance, e.g. revenue) → DEBIT it.
        const closingLines: Array<{ accountId: string; accountCode: string; side: PostingSide; amount: Prisma.Decimal }> = [];
        let sumNet = new Prisma.Decimal(0);
        for (const acct of plAccounts) {
          const raw = rawBalances[acct.id];
          if (!raw) continue;
          const net = new Prisma.Decimal(raw.toString());
          if (net.isZero()) continue;
          sumNet = sumNet.plus(net);
          if (net.greaterThan(0)) {
            closingLines.push({ accountId: acct.id, accountCode: acct.accountCode, side: PostingSide.CREDIT, amount: net });
          } else {
            closingLines.push({ accountId: acct.id, accountCode: acct.accountCode, side: PostingSide.DEBIT, amount: net.negated() });
          }
        }
        // Net income = credits − debits among P&L = −Σnet.
        const netIncome = sumNet.negated();

        let closingJournalId: string | undefined;
        if (closingLines.length > 0) {
          // Balancing line to Retained Earnings.
          const re = await this.resolveRetainedEarnings(coaRepoTx, tenant_id, company_id);
          if (!netIncome.isZero()) {
            if (netIncome.greaterThan(0)) {
              closingLines.push({ accountId: re.id, accountCode: re.accountCode, side: PostingSide.CREDIT, amount: netIncome });
            } else {
              closingLines.push({ accountId: re.id, accountCode: re.accountCode, side: PostingSide.DEBIT, amount: netIncome.negated() });
            }
          }

          const postingCtx = (await import('../domain/posting-context-factory')).PostingContextFactory.issue(tenant_id, company_id);
          const journal = await journalRepoTx.createEntry(postingCtx, {
            tenant_id,
            company_id,
            ref: `CLOSE-${periodId}-${Date.now()}`,
            fiscalPeriodId: periodId,
            postingDate: new Date(),
            status: JournalStatus.POSTED,
            journalType: JournalType.CLOSING,
            sourceEventId: `closing_${periodId}`,
          } as any);
          closingJournalId = journal.id;

          await journalRepoTx.createLines(
            postingCtx,
            journal.id,
            closingLines.map((l) => ({
              accountId: l.accountId,
              accountCode: l.accountCode,
              side: l.side,
              amount: l.amount,
              currency: BASE_CURRENCY,
            })),
          );

          for (const l of closingLines) {
            await this.applyBalance(balanceRepoTx, tenant_id, company_id, periodId, l.accountId, l.side, l.amount);
          }
        }

        // Durable closing record.
        const closingRecord: PeriodClosingRecord = {
          id: uuid(),
          tenant_id,
          company_id,
          periodId,
          status: 'COMPLETED',
          snapshotSequence: 999999,
          integrityHash: this.hashingService.generateClosingHash({
            tenant_id,
            periodId,
            netIncome,
            closedAt: new Date(),
            closedBy,
          }),
          closingJournalId,
          netIncomeBase: netIncome,
          closedBy,
          closedAt: new Date(),
        };
        await fiscalRepoTx.saveClosingRecord(tenant_id, company_id, closingRecord);

        // Flip period to CLOSED (serialization point).
        await fiscalRepoTx.updateStatus(tenant_id, company_id, periodId, FiscalPeriodStatus.CLOSED);

        return closingRecord.id;
      });

      await this.fiscalRepo.saveExecutionLock(tenant_id, company_id, {
        id: uuid(),
        periodId,
        closingRequestId: requestId,
        status: 'COMPLETED',
        lockedBy: closedBy,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 300000),
        updated_at: new Date(),
      });

      this.logger.log(`Period ${periodId} closed successfully. Closing record: ${closingRecordId}`);
      return closingRecordId;
    } catch (error: any) {
      // Free the lock so the operation can be retried after a failure.
      await this.fiscalRepo.releaseExecutionLock(tenant_id, company_id, periodId).catch(() => undefined);
      this.logger.error(`Failed to close period ${periodId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reopen a CLOSED period: atomically reverse the closing journal (restoring
   * P&L balances), mark the closing record REVERSED, and flip the period to OPEN.
   */
  async reverseClosing(tenant_id: string, company_id: string, periodId: string): Promise<void> {
    const period = await this.fiscalRepo.findById(tenant_id, company_id, periodId);
    if (!period || period.status !== FiscalPeriodStatus.CLOSED) {
      throw new BadRequestException('Only a CLOSED period can be reopened');
    }

    await this.uow.execute(async (tx: Prisma.TransactionClient) => {
      const fiscalRepoTx = new FiscalPeriodDbRepository(tx as any);
      const journalRepoTx = new JournalDbRepository(tx);
      const balanceRepoTx = new AccountBalanceDbRepository(tx);

      const record = await fiscalRepoTx.getClosingRecord(tenant_id, company_id, periodId);

      if (record?.closingJournalId) {
        const closingJournal = await journalRepoTx.findById(tenant_id, company_id, record.closingJournalId);
        if (closingJournal && closingJournal.status !== JournalStatus.REVERSED) {
          const lines = await journalRepoTx.findLines(record.closingJournalId);
          const postingCtx = (await import('../domain/posting-context-factory')).PostingContextFactory.issue(tenant_id, company_id);

          const revJournal = await journalRepoTx.createEntry(postingCtx, {
            tenant_id,
            company_id,
            ref: `CLOSE-REV-${periodId}-${Date.now()}`,
            fiscalPeriodId: periodId,
            postingDate: new Date(),
            status: JournalStatus.POSTED,
            journalType: JournalType.CLOSING,
            sourceEventId: `closing_reversal_${periodId}`,
          } as any);

          const revLines = lines.map((line: any) => ({
            accountId: line.account_id ?? line.accountId,
            accountCode: line.account_code ?? line.accountCode,
            side: line.side === PostingSide.DEBIT ? PostingSide.CREDIT : PostingSide.DEBIT,
            amount: line.amount,
            currency: BASE_CURRENCY,
          }));

          await journalRepoTx.createLines(postingCtx, revJournal.id, revLines);

          for (const l of revLines) {
            await this.applyBalance(balanceRepoTx, tenant_id, company_id, periodId, l.accountId, l.side as PostingSide, new Prisma.Decimal(l.amount.toString()));
          }

          await journalRepoTx.updateStatus(tenant_id, company_id, record.closingJournalId, JournalStatus.REVERSED);
          await fiscalRepoTx.saveClosingRecord(tenant_id, company_id, {
            ...record,
            status: 'REVERSED',
            reversalJournalId: revJournal.id,
          });
        }
      }

      await fiscalRepoTx.updateStatus(tenant_id, company_id, periodId, FiscalPeriodStatus.OPEN);
    });

    this.logger.log(`Period ${periodId} reopened (closing reversed).`);
  }

  async runReversalBatch(tenant_id: string, company_id: string, batch: ReversalBatch): Promise<void> {
    this.logger.log(`Running reversal batch for ${batch.originalJournalIds?.length ?? 0} journals. Reason: ${batch.reversalReason}`);
    // Implementation...
  }

  /** Find-or-create the Retained Earnings equity account. */
  private async resolveRetainedEarnings(coaRepoTx: CoaDbRepository, tenant_id: string, company_id: string) {
    const existing = await coaRepoTx.findByCode(tenant_id, company_id, RETAINED_EARNINGS_CODE);
    if (existing) return existing;
    return coaRepoTx.create(tenant_id, company_id, {
      accountCode: RETAINED_EARNINGS_CODE,
      name: 'Retained Earnings',
      accountType: AccountType.EQUITY as any,
      isActive: true,
    } as any);
  }

  private async applyBalance(
    balanceRepo: IAccountBalanceRepository,
    tenant_id: string,
    company_id: string,
    periodId: string,
    accountId: string,
    side: PostingSide,
    amount: Prisma.Decimal,
  ): Promise<void> {
    const isDebit = side === PostingSide.DEBIT;
    await balanceRepo.incrementBalance(
      tenant_id,
      company_id,
      {
        fiscalPeriodId: periodId,
        accountId,
        currency: BASE_CURRENCY,
        branch_id: '',
        location_id: '',
      },
      {
        debit: isDebit ? amount : undefined,
        credit: !isDebit ? amount : undefined,
        net: isDebit ? amount : amount.negated(),
      },
    );
  }
}
