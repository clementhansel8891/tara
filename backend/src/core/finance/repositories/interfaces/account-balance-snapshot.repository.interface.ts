import { AccountBalanceSnapshot, SnapshotApplicationLog, JournalEntry } from '../../domain/finance.interfaces';

export interface IAccountBalanceSnapshotRepository {
  findByAccount(tenantId: string, companyId: string, accountId: string, currency: string, periodId: string): Promise<AccountBalanceSnapshot | null>;
  upsert(tenantId: string, companyId: string, snapshot: AccountBalanceSnapshot): Promise<void>;
  findPeriodsAfter(tenantId: string, companyId: string, periodNumber: number, fiscalYearId: string): Promise<string[]>; // Returns period IDs in order
  deleteForPeriod(tenantId: string, companyId: string, periodId: string): Promise<void>;
  findAllInPeriod(tenantId: string, companyId: string, periodId: string): Promise<AccountBalanceSnapshot[]>;

  // Consistency & Concurrency
  isLogged(ledgerEntryId: string, accountId: string, periodId: string): Promise<boolean>;
  addLog(log: SnapshotApplicationLog): Promise<void>;
  acquireRowLock(tenantId: string, companyId: string, accountId: string, currency: string, periodId: string): Promise<void>;

  // Sequence Buffer (Resilience)
  saveToBuffer(tenantId: string, companyId: string, entry: JournalEntry): Promise<void>;
  getFromBuffer(tenantId: string, companyId: string, periodId: string, sequence: number): Promise<JournalEntry | null>;
  clearFromBuffer(tenantId: string, companyId: string, entryId: string): Promise<void>;

  // Sequence Tracking
  getLastAppliedSequence(tenantId: string, companyId: string, periodId: string): Promise<number>;
  updateLastAppliedSequence(tenantId: string, companyId: string, periodId: string, sequence: number): Promise<void>;

  // Closing Alignment
  getClosingSnapshotSequence(tenantId: string, companyId: string, periodId: string): Promise<number | null>;
}
