import { JournalReversal } from '../../domain/finance.interfaces';

export interface IJournalReversalRepository {
  createReversalRecord(tenantId: string, companyId: string, data: Partial<JournalReversal>): Promise<JournalReversal>;
  findByOriginalJournalId(tenantId: string, companyId: string, originalJournalId: string): Promise<JournalReversal | null>;
}
