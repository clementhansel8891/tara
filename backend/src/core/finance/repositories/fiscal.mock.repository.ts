import { Injectable } from '@nestjs/common';
import { FinanceFiscalYear, FinanceFiscalPeriod, PeriodClosingRecord, ClosingExecutionLock } from '../domain/finance.interfaces';
import { IFiscalPeriodRepository } from './interfaces/fiscal.repository.interface';
import { FiscalPeriodStatus } from '../domain/finance.constants';

@Injectable()
export class FiscalMockRepository implements IFiscalPeriodRepository {
  /** Key: `${tenantId}:${companyId}` */
  private years: Map<string, FinanceFiscalYear[]> = new Map();
  /** Key: `${tenantId}:${companyId}` */
  private periods: Map<string, FinanceFiscalPeriod[]> = new Map();
  /** Key: `${tenantId}:${companyId}` */
  private closingRecords: Map<string, PeriodClosingRecord[]> = new Map();
  /** Key: `${tenantId}:${companyId}` */
  private executionLocks: Map<string, ClosingExecutionLock[]> = new Map();
  /** Key: `${tenantId}:${companyId}:${periodId}` */
  private activeLocks: Set<string> = new Set();

  async findYear(tenantId: string, companyId: string, year: number): Promise<FinanceFiscalYear | null> {
    const list = this.years.get(`${tenantId}:${companyId}`) || [];
    return list.find((y) => y.year === year) || null;
  }

  async findPeriods(tenantId: string, companyId: string, yearId: string): Promise<FinanceFiscalPeriod[]> {
    const list = this.periods.get(`${tenantId}:${companyId}`) || [];
    return list.filter((p) => (p as any).fiscalYearId === yearId);
  }

  async findById(tenantId: string, companyId: string, id: string): Promise<FinanceFiscalPeriod | null> {
    const list = this.periods.get(`${tenantId}:${companyId}`) || [];
    return list.find((p) => p.id === id) || null;
  }

  async updateStatus(tenantId: string, companyId: string, periodId: string, status: FiscalPeriodStatus): Promise<FinanceFiscalPeriod> {
    const scopeKey = `${tenantId}:${companyId}`;
    const list = this.periods.get(scopeKey) || [];
    const index = list.findIndex((p) => p.id === periodId);
    if (index === -1) throw new Error('Period not found');

    list[index] = { ...list[index], status, updatedAt: new Date() };
    this.periods.set(scopeKey, list);
    return list[index];
  }

  async createYear(tenantId: string, companyId: string, data: Partial<FinanceFiscalYear>): Promise<FinanceFiscalYear> {
    const scopeKey = `${tenantId}:${companyId}`;
    const list = this.years.get(scopeKey) || [];
    const newYear: FinanceFiscalYear = {
      id: data.id || Math.random().toString(36).substr(2, 9),
      tenantId,
      companyId,
      year: data.year || new Date().getFullYear(),
      startDate: data.startDate || new Date(),
      endDate: data.endDate || new Date(),
      isClosed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    list.push(newYear);
    this.years.set(scopeKey, list);
    return newYear;
  }

  async createPeriod(tenantId: string, companyId: string, data: Partial<FinanceFiscalPeriod>): Promise<FinanceFiscalPeriod> {
    const scopeKey = `${tenantId}:${companyId}`;
    const list = this.periods.get(scopeKey) || [];
    const newPeriod: FinanceFiscalPeriod = {
      id: data.id || Math.random().toString(36).substr(2, 9),
      tenantId,
      companyId,
      fiscalYearId: (data as any).fiscalYearId || '',
      periodNumber: (data as any).periodNumber || 1,
      startDate: data.startDate || new Date(),
      endDate: data.endDate || new Date(),
      status: data.status || FiscalPeriodStatus.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    list.push(newPeriod);
    this.periods.set(scopeKey, list);
    return newPeriod;
  }

  async saveClosingRecord(tenantId: string, companyId: string, record: PeriodClosingRecord): Promise<PeriodClosingRecord> {
    const scopeKey = `${tenantId}:${companyId}`;
    const list = this.closingRecords.get(scopeKey) || [];
    list.push(record);
    this.closingRecords.set(scopeKey, list);
    return record;
  }

  async getClosingRecord(tenantId: string, companyId: string, periodId: string): Promise<PeriodClosingRecord | null> {
    const list = this.closingRecords.get(`${tenantId}:${companyId}`) || [];
    return list.find((r) => r.periodId === periodId) || null;
  }

  async acquireLock(tenantId: string, companyId: string, periodId: string): Promise<void> {
    const key = `${tenantId}:${companyId}:${periodId}`;
    if (this.activeLocks.has(key)) {
      throw new Error(`Concurrency Lock Error: Period ${periodId} is currently being processed by another worker.`);
    }
    this.activeLocks.add(key);
  }

  async getExecutionLock(tenantId: string, companyId: string, periodId: string): Promise<ClosingExecutionLock | null> {
    const list = this.executionLocks.get(`${tenantId}:${companyId}`) || [];
    return list.find((l) => l.periodId === periodId) || null;
  }

  async saveExecutionLock(tenantId: string, companyId: string, lock: ClosingExecutionLock): Promise<void> {
    const scopeKey = `${tenantId}:${companyId}`;
    const list = this.executionLocks.get(scopeKey) || [];
    const index = list.findIndex((l) => l.id === lock.id);
    if (index !== -1) {
      list[index] = { ...lock, updatedAt: new Date() };
    } else {
      list.push(lock);
    }
    this.executionLocks.set(scopeKey, list);
    
    if (lock.status === 'COMPLETED') {
      this.activeLocks.delete(`${tenantId}:${companyId}:${lock.periodId}`);
    }
  }

  async releaseExecutionLock(tenantId: string, companyId: string, periodId: string): Promise<void> {
    this.activeLocks.delete(`${tenantId}:${companyId}:${periodId}`);
    const scopeKey = `${tenantId}:${companyId}`;
    const list = this.executionLocks.get(scopeKey) || [];
    this.executionLocks.set(scopeKey, list.filter(l => l.periodId !== periodId));
  }
}
