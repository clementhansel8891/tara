import type { LedgerEntry, LedgerBalance, JournalEntry } from "@/core/types/finance/ledger";
import { financeRepo } from "@/core/repositories/finance/financeRepo";

const repo = financeRepo;

export const ledgerService = {
  async getEntries(tenantId: string): Promise<JournalEntry[]> {
    return await repo.listJournalEntries(tenantId);
  },

  async createEntry(entry: JournalEntry): Promise<JournalEntry> {
    return await repo.createJournalEntry(entry.tenantId, entry);
  },

  async updateEntry(entryId: string, updates: Partial<JournalEntry>): Promise<JournalEntry | null> {
    // We need tenantId from the updates or a lookup; for now use a simple approach
    const tenantId = updates.tenantId ?? "";
    return await repo.updateJournalEntry(tenantId, entryId, updates);
  },

  async deleteEntry(_entryId: string): Promise<void> {
    // Mock repo doesn't support delete yet; no-op
  },

  async getBalances(_tenantId: string): Promise<LedgerBalance[]> {
    // Mock repo doesn't have balances; return empty
    return [];
  },
};
