import { apiRequest } from "@/core/api/apiClient";
import type { SessionContext } from "@/core/security/session";
import type { 
  IncentivePlan, 
  SalesAttribution, 
  IncentivePayout,
  IncentiveAuditLog
} from "@/core/types/sales/incentives";

export const incentivesService = {
  listPlans: (session: SessionContext) =>
    apiRequest<IncentivePlan[]>("/v1/incentives/plans", "GET", session),

  getPlan: (id: string, session: SessionContext) =>
    apiRequest<IncentivePlan>(`/v1/incentives/plans/${id}`, "GET", session),

  createPlan: (payload: Partial<IncentivePlan>, session: SessionContext) =>
    apiRequest<IncentivePlan>("/v1/incentives/plans", "POST", session, payload),

  updatePlan: (id: string, payload: Partial<IncentivePlan>, session: SessionContext, actor_id?: string) =>
    apiRequest<IncentivePlan>(`/v1/incentives/plans/${id}`, "PATCH", session, { ...payload, actor_id }),

  updateStatus: (id: string, is_active: boolean, session: SessionContext, actor_id?: string) =>
    apiRequest<IncentivePlan>(`/v1/incentives/plans/${id}/status`, "PATCH", session, { is_active, actor_id }),

  getAuditLogs: (planId: string, session: SessionContext) =>
    apiRequest<IncentiveAuditLog[]>(`/v1/incentives/plans/${planId}/audit-logs`, "GET", session),

  listAttributions: (session: SessionContext) =>
    apiRequest<SalesAttribution[]>("/v1/incentives/attributions", "GET", session),

  listPayouts: (session: SessionContext) =>
    apiRequest<IncentivePayout[]>("/v1/incentives/payouts", "GET", session),

  processPayouts: (session: SessionContext) =>
    apiRequest<{ count: number }>("/v1/incentives/process-payouts", "POST", session),

  getEmployeeIncentives: (employeeId: string, session: SessionContext) =>
    apiRequest<SalesAttribution[]>(`/v1/incentives/employee/${employeeId}`, "GET", session),

  getAnalytics: (session: SessionContext) =>
    apiRequest<any>("/v1/incentives/analytics", "GET", session),

  recalculate: (payload: { start_date: string; end_date: string }, session: SessionContext) =>
    apiRequest<{ processed: number }>("/v1/incentives/recalculate", "POST", session, payload),
};

