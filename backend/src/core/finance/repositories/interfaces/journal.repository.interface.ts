import { JournalEntry, JournalLine } from '../../domain/finance.interfaces';
import { JournalStatus } from '../../domain/finance.constants';
import { LedgerPostingContext } from '../../domain/ledger-posting-context';
import { Prisma } from '@prisma/client';

export interface IJournalRepository {
  /** Write a new journal entry. Requires a valid LedgerPostingContext token. */
  createEntry(ctx: LedgerPostingContext, data: Partial<JournalEntry>): Promise<JournalEntry>;
  /** Write journal lines for an entry. Requires a valid LedgerPostingContext token. */
  createLines(ctx: LedgerPostingContext, entryId: string, lines: Partial<JournalLine>[]): Promise<void>;
  /** Update journal status. Only allowed for internal state transitions (e.g., DRAFT → POSTED). */
  updateStatus(tenantId: string, companyId: string, entryId: string, status: JournalStatus): Promise<JournalEntry>;
  findById(tenantId: string, companyId: string, id: string): Promise<JournalEntry | null>;
  findLines(entryId: string): Promise<JournalLine[]>;
  getLastEntryHash(tenantId: string, companyId: string): Promise<string | null>;
  findAllOrderedByDate(tenantId: string, companyId: string): Promise<JournalEntry[]>;
  /** Fetch a journal by its deterministic ledgerSequence (used for O(1) hash link validation). */
  findBySequence(tenantId: string, companyId: string, sequence: number): Promise<JournalEntry | null>;
  /** Fetch a range of journals by ledgerSequence for Merkle checkpoint building. */
  findBySequenceRange(tenantId: string, companyId: string, fromSeq: number, toSeq: number): Promise<JournalEntry[]>;
  /** Aggregates raw balances (debit - credit) per account directly from GL lines. */
  getRawBalances(tenantId: string, companyId: string, periodId: string, startDate: Date, endDate: Date): Promise<Record<string, Prisma.Decimal>>;
  /** Counts the number of DRAFT journals in a specific fiscal period. */
  countDraftsInPeriod(tenantId: string, companyId: string, periodId: string): Promise<number>;
  /** Voids all DRAFT journals in a specific fiscal period. */
  voidDraftsInPeriod(tenantId: string, companyId: string, periodId: string): Promise<void>;
}
