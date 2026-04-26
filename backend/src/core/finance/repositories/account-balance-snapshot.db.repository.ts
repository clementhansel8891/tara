import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { IAccountBalanceSnapshotRepository } from './interfaces/account-balance-snapshot.repository.interface';
import { AccountBalanceSnapshot, SnapshotApplicationLog, JournalEntry } from '../domain/finance.interfaces';
import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AccountBalanceSnapshotDbRepository implements IAccountBalanceSnapshotRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  private get db(): Prisma.TransactionClient {
    return this.prisma;
  }

  async findByAccount(
    tenant_id: string, 
    company_id: string, 
    accountId: string, 
    currency: string, 
    periodId: string
  ): Promise<AccountBalanceSnapshot | null> {
    const raw = await this.db.finance_account_balance_snapshots.findFirst({
      where: {
        tenant_id,
        company_id,
        account_id: accountId,
        currency,
        fiscal_period_id: periodId,
      },
      orderBy: { snapshot_sequence: 'desc' }
    });

    if (!raw) return null;
    return this.mapEntity(raw);
  }

  async upsert(tenant_id: string, company_id: string, snapshot: AccountBalanceSnapshot): Promise<void> {
    const id = snapshot.id || uuid();
    
    // We use updateMany + create because Prisma doesn't support composite unique upsert 
    // on non-unique fields easily, and snapshot_sequence makes it tricky.
    // However, if we want the LATEST snapshot for a period/account, 
    // we usually just want to update the one with the highest sequence or create a new one.
    // The service logic seems to do: fetch -> update fields -> upsert.
    
    await this.db.finance_account_balance_snapshots.upsert({
      where: { id },
      update: {
        opening_balance: snapshot.openingBalance,
        debit_total: snapshot.debitTotal,
        credit_total: snapshot.creditTotal,
        closing_balance: snapshot.closingBalance,
        snapshot_sequence: snapshot.snapshotSequence,
        snapshot_date: snapshot.snapshotDate || new Date(),
        updated_at: new Date(),
      },
      create: {
        id,
        tenant_id,
        company_id,
        account_id: snapshot.accountId,
        fiscal_period_id: snapshot.periodId,
        currency: snapshot.currency,
        opening_balance: snapshot.openingBalance,
        debit_total: snapshot.debitTotal,
        credit_total: snapshot.creditTotal,
        closing_balance: snapshot.closingBalance,
        snapshot_sequence: snapshot.snapshotSequence,
        snapshot_date: snapshot.snapshotDate || new Date(),
        snapshotType: snapshot.snapshotType || 'PERIODIC',
        integrity_hash: snapshot.integrityHash || null,
        balances_data: snapshot.balancesData || {},
      }
    });
  }

  async findPeriodsAfter(tenant_id: string, company_id: string, periodNumber: number, fiscalYearId: string): Promise<string[]> {
    const periods = await this.db.finance_fiscal_periods.findMany({
      where: {
        tenant_id,
        company_id,
        fiscal_year_id: fiscalYearId,
        period_number: { gt: periodNumber }
      },
      orderBy: { period_number: 'asc' },
      select: { id: true }
    });

    return periods.map(p => p.id);
  }

  async deleteForPeriod(tenant_id: string, company_id: string, periodId: string): Promise<void> {
    await this.db.finance_account_balance_snapshots.deleteMany({
      where: { tenant_id, company_id, fiscal_period_id: periodId }
    });
  }

  async findAllInPeriod(tenant_id: string, company_id: string, periodId: string): Promise<AccountBalanceSnapshot[]> {
    const raws = await this.db.finance_account_balance_snapshots.findMany({
      where: { tenant_id, company_id, fiscal_period_id: periodId }
    });
    return raws.map(r => this.mapEntity(r));
  }

  async isLogged(ledgerEntryId: string, accountId: string, periodId: string): Promise<boolean> {
    const count = await this.db.finance_snapshot_application_logs.count({
      where: { ledger_entry_id: ledgerEntryId, account_id: accountId, period_id: periodId }
    });
    return count > 0;
  }

  async addLog(log: SnapshotApplicationLog): Promise<void> {
    await this.db.finance_snapshot_application_logs.create({
      data: {
        id: uuid(),
        tenant_id: log.tenant_id,
        company_id: log.company_id,
        ledger_entry_id: log.ledgerEntryId,
        account_id: log.accountId,
        period_id: log.periodId,
        applied_at: log.appliedAt || new Date(),
        created_at: new Date(),
      }
    });
  }

  async acquireRowLock(tenant_id: string, company_id: string, accountId: string, currency: string, periodId: string): Promise<void> {
    // In PostgreSQL, we can use SELECT FOR UPDATE. 
    // This requires a raw query in Prisma.
    await this.db.$executeRaw`
      SELECT id FROM finance_account_balance_snapshots 
      WHERE tenant_id = ${tenant_id} AND company_id = ${company_id} 
      AND account_id = ${accountId} AND currency = ${currency} 
      AND fiscal_period_id = ${periodId}
      FOR UPDATE
    `;
  }

  async saveToBuffer(tenant_id: string, company_id: string, entry: JournalEntry): Promise<void> {
    await this.db.finance_sequence_buffer.create({
      data: {
        id: uuid(),
        tenant_id,
        company_id,
        period_id: entry.fiscalPeriodId,
        last_seq: entry.ledgerSequence || 0,
        seq_key: entry.id,
        payload: entry as any,
      }
    });
  }

  async getFromBuffer(tenant_id: string, company_id: string, periodId: string, sequence: number): Promise<JournalEntry | null> {
    const raw = await this.db.finance_sequence_buffer.findFirst({
      where: {
        tenant_id,
        company_id,
        period_id: periodId,
        last_seq: sequence,
      }
    });

    if (!raw) return null;
    return raw.payload as unknown as JournalEntry;
  }

  async clearFromBuffer(tenant_id: string, company_id: string, entryId: string): Promise<void> {
    // The buffer table stores entries by sequence, but we can search in payload if needed
    // or we should have stored entry_id as a top-level field.
    // For now, let's assume we can delete by filtering JSON if needed, but it's better 
    // to just delete the specific one if we know the sequence and period.
    // Actually, the interface says 'entryId'.
    await this.db.$executeRaw`
      DELETE FROM finance_sequence_buffer 
      WHERE tenant_id = ${tenant_id} AND company_id = ${company_id} 
      AND payload->>'id' = ${entryId}
    `;
  }

  async getLastAppliedSequence(tenant_id: string, company_id: string, periodId: string): Promise<number> {
    const tracking = await this.db.finance_period_sequence_tracking.findUnique({
      where: {
        tenant_id_fiscal_period_id: { tenant_id, fiscal_period_id: periodId }
      }
    });
    return Number(tracking?.last_applied_sequence || 0);
  }

  async updateLastAppliedSequence(tenant_id: string, company_id: string, periodId: string, sequence: number): Promise<void> {
    await this.db.finance_period_sequence_tracking.upsert({
      where: {
        tenant_id_fiscal_period_id: { tenant_id, fiscal_period_id: periodId }
      },
      update: { last_applied_sequence: sequence },
      create: {
        id: uuid(),
        tenant_id,
        company_id,
        fiscal_period_id: periodId,
        last_applied_sequence: sequence,
      }
    });
  }

  async getClosingSnapshotSequence(tenant_id: string, company_id: string, periodId: string): Promise<number | null> {
    // This would typically come from a period closing record.
    // For now, we'll return the max sequence found in snapshots for that period.
    const result = await this.db.finance_account_balance_snapshots.aggregate({
      where: { tenant_id, company_id, fiscal_period_id: periodId },
      _max: { snapshot_sequence: true }
    });
    return result._max.snapshot_sequence;
  }

  private mapEntity(raw: any): AccountBalanceSnapshot {
    return {
      id: raw.id,
      tenant_id: raw.tenant_id,
      company_id: raw.company_id,
      accountId: raw.account_id,
      currency: raw.currency,
      periodId: raw.fiscal_period_id,
      openingBalance: raw.opening_balance,
      debitTotal: raw.debit_total,
      creditTotal: raw.credit_total,
      closingBalance: raw.closing_balance,
      snapshotSequence: raw.snapshot_sequence,
      snapshotDate: raw.snapshot_date,
      lastUpdatedAt: raw.updated_at,
      integrityHash: raw.integrity_hash,
      snapshotType: raw.snapshotType,
      balancesData: raw.balances_data,
    };
  }
}
