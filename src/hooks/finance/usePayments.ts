import { useCallback, useEffect, useState } from "react";
import {
  paymentsService,
  type PaymentExecutionPayload,
  type PaymentHistoryFilters,
} from "@/core/services/finance/paymentsService";
import type { PaymentRequest } from "@/core/types/finance/payments";
import type { SessionContext } from "@/core/security/session";

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function usePayments(tenantId: string, session: SessionContext) {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentsService.getPayments(tenantId, status);
      setPayments(data);
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to fetch payments"));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const executePayment = useCallback(async (payment: PaymentExecutionPayload) => {
    setLoading(true);
    try {
      const executed = await paymentsService.executePayment(payment);
      if (executed) setPayments((prev) => [...prev, executed]);
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to execute payment"));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPaymentHistory = useCallback(async (filters?: PaymentHistoryFilters) => {
    setLoading(true);
    try {
      const data = await paymentsService.getPaymentHistory(tenantId, filters);
      setPayments(data);
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to fetch payment history"));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return { payments, loading, error, fetchPayments, executePayment, fetchPaymentHistory };
}
