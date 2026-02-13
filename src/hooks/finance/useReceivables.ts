import { useCallback, useEffect, useState } from "react";
import { receivablesService } from "@/core/services/finance/receivablesService";
import type { ReceivableInvoice } from "@/core/types/finance/receivables";
import type { SessionContext } from "@/core/security/session";

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function useReceivables(tenantId: string, session: SessionContext) {
  const [receivables, setReceivables] = useState<ReceivableInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReceivables = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await receivablesService.getReceivables(tenantId, status);
      setReceivables(data);
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to fetch receivables"));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const createReceivable = useCallback(async (receivable: ReceivableInvoice) => {
    setLoading(true);
    try {
      const newReceivable = await receivablesService.createReceivable(receivable);
      if (newReceivable) setReceivables((prev) => [...prev, newReceivable]);
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to create receivable"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReceivables();
  }, [fetchReceivables]);

  return { receivables, loading, error, fetchReceivables, createReceivable };
}
