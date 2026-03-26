import { LedgerEventLogArchive } from '../../domain/finance.interfaces';

export interface ILedgerEventLogArchiveRepository {
  createArchiveEntries(events: any[]): Promise<void>;
}
