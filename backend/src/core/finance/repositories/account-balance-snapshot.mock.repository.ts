import { Injectable } from '@nestjs/common';
import { AccountBalanceSnapshot, SnapshotApplicationLog, JournalEntry } from '../domain/finance.interfaces';
import { IAccountBalanceSnapshotRepository } from './interfaces/account-balance-snapshot.repository.interface';

@Injectable()
export class AccountBalanceSnapshotMockRepository implements IAccountBalanceSnapshotRepository {
  private snapshots: Map<string, AccountBalanceSnapshot[]> = new Map();
  private logs: Map<string, boolean> = new Map();
  private buffer: Map<string, JournalEntry[]> = new Map();
  private sequences: Map<string, number> = new Map();

  async findByAccount(tenantId: string, companyId: string, accountId: string, currency: string, periodId: string): Promise<AccountBalanceSnapshot | null> {
    const list = this.snapshots.get(`${tenantId}:${companyId}`) || [];
    return list.find(s => s.accountId === accountId && s.currency === currency && s.periodId === periodId) || null;
  }

  async upsert(tenantId: string, companyId: string, snapshot: AccountBalanceSnapshot): Promise<void> {
    const scopeKey = `${tenantId}:${companyId}`;
    let list = this.snapshots.get(scopeKey) || [];
    const index = list.findIndex(s => s.accountId === snapshot.accountId && s.currency === snapshot.currency && s.periodId === snapshot.periodId && s.snapshotSequence === snapshot.snapshotSequence);
    if (index !== -1) list[index] = snapshot;
    else list.push(snapshot);
    this.snapshots.set(scopeKey, list);
  }

  async findPeriodsAfter(tenantId: string, companyId: string, periodNumber: number, fiscalYearId: string): Promise<string[]> {
    return []; // Mock
  }

  async deleteForPeriod(tenantId: string, companyId: string, periodId: string): Promise<void> {
    const scopeKey = `${tenantId}:${companyId}`;
    let list = this.snapshots.get(scopeKey) || [];
    this.snapshots.set(scopeKey, list.filter(s => s.periodId !== periodId));
  }

  async findAllInPeriod(tenantId: string, companyId: string, periodId: string): Promise<AccountBalanceSnapshot[]> {
    const list = this.snapshots.get(`${tenantId}:${companyId}`) || [];
    return list.filter(s => s.periodId === periodId);
  }

  async isLogged(ledgerEntryId: string, accountId: string, periodId: string): Promise<boolean> {
    return this.logs.get(`${ledgerEntryId}:${accountId}:${periodId}`) || false;
  }

  async addLog(log: SnapshotApplicationLog): Promise<void> {
    this.logs.set(`${log.ledgerEntryId}:${log.accountId}:${log.periodId}`, true);
  }

  async acquireRowLock(tenantId: string, companyId: string, accountId: string, currency: string, periodId: string): Promise<void> {
    // Mock
  }

  async saveToBuffer(tenantId: string, companyId: string, entry: JournalEntry): Promise<void> {
    const key = `${tenantId}:${companyId}:${entry.fiscalPeriodId}`;
    let list = this.buffer.get(key) || [];
    list.push(entry);
    this.buffer.set(key, list);
  }

  async getFromBuffer(tenantId: string, companyId: string, periodId: string, sequence: number): Promise<JournalEntry | null> {
    const key = `${tenantId}:${companyId}:${periodId}`;
    const list = this.buffer.get(key) || [];
    return list.find(e => e.ledgerSequence === sequence) || null;
  }

  async clearFromBuffer(tenantId: string, companyId: string, entryId: string): Promise<void> {
    // Mock
  }

  async getLastAppliedSequence(tenantId: string, companyId: string, periodId: string): Promise<number> {
    return this.sequences.get(`${tenantId}:${companyId}:${periodId}`) || 0;
  }

  async updateLastAppliedSequence(tenantId: string, companyId: string, periodId: string, sequence: number): Promise<void> {
    this.sequences.set(`${tenantId}:${companyId}:${periodId}`, sequence);
  }

  async getClosingSnapshotSequence(tenantId: string, companyId: string, periodId: string): Promise<number | null> {
    return 999999;
  }
}
