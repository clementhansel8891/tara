import { useCallback, useEffect, useState } from "react";
import { ledgerService } from "@/core/services/finance/ledgerService";
import type { JournalEntry } from "@/core/types/finance/ledger";
import type { LedgerBalance } from "@/core/types/finance/ledger";
import type { SessionContext } from "@/core/security/session";

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function useLedger(tenantId: string, session: SessionContext) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [balances, setBalances] = useState<LedgerBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ledgerService.getEntries(tenantId);
      setEntries(data);
      const bal = await ledgerService.getBalances(tenantId);
      setBalances(bal);
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to fetch ledger data"));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const createEntry = useCallback(async (entry: JournalEntry) => {
    setLoading(true);
    try {
      const newEntry = await ledgerService.createEntry(entry);
      if (newEntry) setEntries((prev) => [...prev, newEntry]);
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to create ledger entry"));
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEntry = useCallback(async (entryId: string) => {
    setLoading(true);
    try {
      await ledgerService.deleteEntry(entryId);
      setEntries((prev) => (Array.isArray(prev) ? prev : []).filter((e) => e.id !== entryId));
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to delete ledger entry"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return { entries, balances, loading, error, fetchEntries, createEntry, deleteEntry };
}
