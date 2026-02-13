import { useCallback, useEffect, useState } from "react";
import { payablesService } from "@/core/services/finance/payablesService";
import type { PayableBill } from "@/core/types/finance/payables";
import type { SessionContext } from "@/core/security/session";

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function usePayables(tenantId: string, session: SessionContext) {
  const [payables, setPayables] = useState<PayableBill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayables = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await payablesService.getPayables(tenantId, status);
      setPayables(data);
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to fetch payables"));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const createPayable = useCallback(async (payable: PayableBill) => {
    setLoading(true);
    try {
      const newPayable = await payablesService.createPayable(payable);
      if (newPayable) setPayables((prev) => [...prev, newPayable]);
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to create payable"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayables();
  }, [fetchPayables]);

  return { payables, loading, error, fetchPayables, createPayable };
}
