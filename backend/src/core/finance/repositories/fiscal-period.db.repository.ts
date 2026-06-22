// @ts-nocheck
import { Injectable, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../persistence/prisma.service';
import { IFiscalPeriodRepository } from './interfaces/fiscal.repository.interface';
import { FinanceFiscalYear, FinanceFiscalPeriod, PeriodClosingRecord, ClosingExecutionLock } from '../domain/finance.interfaces';
import { FiscalPeriodStatus } from '../domain/finance.constants';
import { v4 as uuid } from 'uuid';

@Injectable()
export class FiscalPeriodDbRepository implements IFiscalPeriodRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  private get db(): Prisma.TransactionClient {
    return this.prisma as Prisma.TransactionClient;
  }

  async findYear(tenant_id: string, company_id: string, year: number): Promise<FinanceFiscalYear | null> {
    const period = await this.db.finance_fiscal_periods.findFirst({
      where: { 
        tenant_id: tenant_id, 
        company_id: company_id,
        name: { startsWith: year.toString() } 
      }
    });
    
    if (!period) return null;
    
    return {
      id: year.toString(),
      tenant_id,
      company_id,
      year,
      start_date: period.start_date,
      end_date: period.end_date,
      isClosed: false,
      created_at: period.created_at,
      updated_at: period.updated_at,
    };
  }

  async findPeriods(tenant_id: string, company_id: string, yearId: string): Promise<FinanceFiscalPeriod[]> {
    const list = await this.db.finance_fiscal_periods.findMany({
      where: { 
        tenant_id: tenant_id, 
        company_id: company_id,
        fiscal_year_id: yearId 
      },
      orderBy: { period_number: 'asc' }
    });
    return list.map(p => this.mapEntity(p));
  }

  async findById(tenant_id: string, company_id: string, id: string): Promise<FinanceFiscalPeriod | null> {
    const res = await this.db.finance_fiscal_periods.findUnique({
      where: { id }
    });
    if (!res) return null;
    // Enforce tenant isolation strictly.
    if (res.tenant_id !== tenant_id) return null;
    // Company scoping is best-effort: periods may be created with a null/empty
    // company_id (tenant-level), so only reject when BOTH sides are concrete and differ.
    if (res.company_id && company_id && res.company_id !== company_id) return null;
    return this.mapEntity(res);
  }

  async updateStatus(tenant_id: string, company_id: string, periodId: string, status: FiscalPeriodStatus): Promise<FinanceFiscalPeriod> {
    const updated = await this.db.finance_fiscal_periods.update({
      where: { id: periodId },
      data: { status: status as any }
    });
    return this.mapEntity(updated);
  }

  async createYear(tenant_id: string, company_id: string, data: Partial<FinanceFiscalYear>): Promise<FinanceFiscalYear> {
    // This is mostly a domain object in this repo, but we could persist it if there was a year table
    return {
      ...data,
      id: data.id || data.year?.toString() || '',
      tenant_id,
      company_id,
      isClosed: false,
      created_at: new Date(),
      updated_at: new Date(),
    } as FinanceFiscalYear;
  }

  async createPeriod(tenant_id: string, company_id: string, data: Partial<FinanceFiscalPeriod>): Promise<FinanceFiscalPeriod> {
    const created = await this.db.finance_fiscal_periods.create({
      data: {
        id: data.id || uuid(),
        tenant_id: tenant_id,
        company_id: company_id,
        fiscal_year_id: data.fiscalYearId || '',
        period_number: data.periodNumber || 0,
        name: data.name || data.id || '', 
        start_date: data.start_date || new Date(),
        end_date: data.end_date || new Date(),
        status: (data.status as any) || FiscalPeriodStatus.OPEN,
        updated_at: new Date(),
      }
    });
    return this.mapEntity(created);
  }

  async saveClosingRecord(tenant_id: string, company_id: string, record: PeriodClosingRecord): Promise<PeriodClosingRecord> {
    const safeCompanyId = company_id && company_id !== tenant_id ? company_id : null;
    const payload = {
      status: record.status,
      snapshot_sequence: record.snapshotSequence ?? 0,
      integrity_hash: record.integrityHash,
      closing_journal_id: record.closingJournalId ?? null,
      reversal_journal_id: record.reversalJournalId ?? null,
      net_income_base: new Prisma.Decimal((record.netIncomeBase ?? 0).toString()),
      closed_by: record.closedBy,
      closed_at: record.closedAt ?? new Date(),
      metadata: (record.metadata as any) ?? undefined,
      updated_at: new Date(),
    };
    const saved = await this.db.finance_period_closing_records.upsert({
      where: { tenant_id_period_id: { tenant_id, period_id: record.periodId } },
      update: payload,
      create: {
        id: record.id || uuid(),
        tenant_id,
        company_id: safeCompanyId,
        period_id: record.periodId,
        ...payload,
      },
    });
    return this.mapClosingRecord(saved);
  }

  async getClosingRecord(tenant_id: string, company_id: string, periodId: string): Promise<PeriodClosingRecord | null> {
    const res = await this.db.finance_period_closing_records.findFirst({
      where: { tenant_id, period_id: periodId },
    });
    return res ? this.mapClosingRecord(res) : null;
  }

  async acquireLock(tenant_id: string, company_id: string, periodId: string): Promise<void> {
    // Concurrency is enforced via the atomic CLOSED status flip + the
    // finance_period_execution_locks unique(tenant_id, period_id) constraint.
  }

  async getExecutionLock(tenant_id: string, company_id: string, periodId: string): Promise<ClosingExecutionLock | null> {
    const res = await this.db.finance_period_execution_locks.findFirst({
      where: { tenant_id, period_id: periodId },
    });
    return res ? this.mapExecutionLock(res) : null;
  }

  async saveExecutionLock(tenant_id: string, company_id: string, lock: ClosingExecutionLock): Promise<void> {
    const safeCompanyId = company_id && company_id !== tenant_id ? company_id : null;
    const payload = {
      closing_request_id: lock.closingRequestId,
      status: lock.status || 'IN_PROGRESS',
      locked_by: lock.lockedBy,
      started_at: lock.startedAt ?? new Date(),
      expires_at: lock.expiresAt,
      updated_at: new Date(),
    };
    await this.db.finance_period_execution_locks.upsert({
      where: { tenant_id_period_id: { tenant_id, period_id: lock.periodId } },
      update: payload,
      create: {
        id: lock.id || uuid(),
        tenant_id,
        company_id: safeCompanyId,
        period_id: lock.periodId,
        ...payload,
      },
    });
  }

  async releaseExecutionLock(tenant_id: string, company_id: string, periodId: string): Promise<void> {
    await this.db.finance_period_execution_locks.deleteMany({
      where: { tenant_id, period_id: periodId },
    });
  }

  private mapClosingRecord(raw: any): PeriodClosingRecord {
    return {
      id: raw.id,
      tenant_id: raw.tenant_id,
      company_id: raw.company_id,
      periodId: raw.period_id,
      status: raw.status,
      snapshotSequence: raw.snapshot_sequence,
      integrityHash: raw.integrity_hash,
      closingJournalId: raw.closing_journal_id ?? undefined,
      reversalJournalId: raw.reversal_journal_id ?? undefined,
      netIncomeBase: new Prisma.Decimal((raw.net_income_base ?? 0).toString()),
      closedBy: raw.closed_by,
      closedAt: raw.closed_at,
      metadata: raw.metadata ?? undefined,
    };
  }

  private mapExecutionLock(raw: any): ClosingExecutionLock {
    return {
      id: raw.id,
      periodId: raw.period_id,
      closingRequestId: raw.closing_request_id,
      lockedBy: raw.locked_by,
      expiresAt: raw.expires_at,
      startedAt: raw.started_at,
      status: raw.status,
      updated_at: raw.updated_at,
    };
  }

  private mapEntity(raw: any): FinanceFiscalPeriod {
    return {
      id: raw.id,
      tenant_id: raw.tenant_id,
      company_id: raw.company_id,
      fiscalYearId: raw.fiscal_year_id,
      periodNumber: raw.period_number,
      name: raw.name,
      start_date: raw.start_date,
      end_date: raw.end_date,
      status: raw.status as FiscalPeriodStatus,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    };
  }
}
