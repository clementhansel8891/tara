import { Injectable } from '@nestjs/common';
import { JournalReversal } from '../domain/finance.interfaces';
import { IJournalReversalRepository } from './interfaces/journal-reversal.repository.interface';

@Injectable()
export class JournalReversalMockRepository implements IJournalReversalRepository {
  /** Key: `${tenantId}:${companyId}` */
  private reversals: Map<string, JournalReversal[]> = new Map();

  async createReversalRecord(tenantId: string, companyId: string, data: Partial<JournalReversal>): Promise<JournalReversal> {
    const scopeKey = `${tenantId}:${companyId}`;
    const list = this.reversals.get(scopeKey) || [];
    const newRecord: JournalReversal = {
      id: Math.random().toString(36).substr(2, 9),
      tenantId,
      companyId,
      originalJournalId: data.originalJournalId!,
      reversalJournalId: data.reversalJournalId!,
      reversalReason: data.reversalReason || '',
      requestedBy: data.requestedBy || 'SYSTEM',
      createdAt: new Date(),
    };
    list.push(newRecord);
    this.reversals.set(scopeKey, list);
    return newRecord;
  }

  async findByOriginalJournalId(tenantId: string, companyId: string, originalJournalId: string): Promise<JournalReversal | null> {
    const list = this.reversals.get(`${tenantId}:${companyId}`) || [];
    return list.find(r => r.originalJournalId === originalJournalId) || null;
  }
}
