import { FinanceFiscalYear, FinanceFiscalPeriod, PeriodClosingRecord, ClosingExecutionLock } from '../../domain/finance.interfaces';
import { FiscalPeriodStatus } from '../../domain/finance.constants';

export interface IFiscalPeriodRepository {
  findYear(tenantId: string, companyId: string, year: number): Promise<FinanceFiscalYear | null>;
  findPeriods(tenantId: string, companyId: string, yearId: string): Promise<FinanceFiscalPeriod[]>;
  findById(tenantId: string, companyId: string, id: string): Promise<FinanceFiscalPeriod | null>;
  updateStatus(tenantId: string, companyId: string, periodId: string, status: FiscalPeriodStatus): Promise<FinanceFiscalPeriod>;
  createYear(tenantId: string, companyId: string, data: Partial<FinanceFiscalYear>): Promise<FinanceFiscalYear>;
  createPeriod(tenantId: string, companyId: string, data: Partial<FinanceFiscalPeriod>): Promise<FinanceFiscalPeriod>;
  
  // Period Closing
  saveClosingRecord(tenantId: string, companyId: string, record: PeriodClosingRecord): Promise<PeriodClosingRecord>;
  getClosingRecord(tenantId: string, companyId: string, periodId: string): Promise<PeriodClosingRecord | null>;

  // Concurrency & Idempotency
  acquireLock(tenantId: string, companyId: string, periodId: string): Promise<void>;
  getExecutionLock(tenantId: string, companyId: string, periodId: string): Promise<ClosingExecutionLock | null>;
  saveExecutionLock(tenantId: string, companyId: string, lock: ClosingExecutionLock): Promise<void>;
  releaseExecutionLock(tenantId: string, companyId: string, periodId: string): Promise<void>;
}
