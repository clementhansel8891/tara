import { LedgerHashAnchor } from '../../domain/finance.interfaces';

export interface ILedgerHashAnchorRepository {
  create(tenantId: string, data: { anchorDate: Date, finalJournalHash: string }): Promise<LedgerHashAnchor>;
  findLatest(tenantId: string): Promise<LedgerHashAnchor | null>;
  findByDate(tenantId: string, date: Date): Promise<LedgerHashAnchor | null>;
}
