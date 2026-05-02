import { useCallback, useEffect, useState } from "react";

import type { SessionContext } from "@/core/security/session";
import { PayrollEntry } from "@/core/types/finance/payrollTypes";
import { payrollService } from "@/core/services/finance/payrollService";

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function usePayroll(tenantId: string, session: SessionContext) {
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayroll = useCallback(async (period?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await payrollService.getPayrollEntries(tenantId, period);
      setEntries(data);
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to fetch payroll entries"));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const createPayrollEntry = useCallback(async (entry: PayrollEntry) => {
    setLoading(true);
    try {
      const newEntry = await payrollService.createPayrollEntry(entry);
      setEntries((prev) => [...prev, newEntry]);
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to create payroll entry"));
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePayrollEntry = useCallback(async (
    entryId: string,
    updates: Partial<PayrollEntry>,
  ) => {
    setLoading(true);
    try {
      const updated = await payrollService.updatePayrollEntry(entryId, updates);
      setEntries((prev) => (Array.isArray(prev) ? prev : []).map((e) => (e.id === entryId ? updated : e)));
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to update payroll entry"));
    } finally {
      setLoading(false);
    }
  }, []);

  const runPayroll = useCallback(async (period: string) => {
    setLoading(true);
    try {
      await payrollService.runPayroll(tenantId, period);
      await fetchPayroll(period);
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to run payroll"));
    } finally {
      setLoading(false);
    }
  }, [fetchPayroll, tenantId]);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  return {
    entries,
    loading,
    error,
    fetchPayroll,
    createPayrollEntry,
    updatePayrollEntry,
    runPayroll,
  };
}
