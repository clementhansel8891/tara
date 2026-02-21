import { apiRequest } from "@/core/api/apiClient";
import type { SessionContext } from "@/core/security/session";
import type {
  LeadStatus,
  OpportunityStage,
  SalesAlert,
  SalesAuditEvent,
  SalesDashboardMetrics,
  SalesExecutiveForecast,
  SalesLead,
  SalesManagerMetrics,
  SalesNextAction,
  SalesOpportunity,
  SalesOrder,
  SalesQuote,
  SalesTimelineEvent,
  SalesTask,
} from "@/core/types/sales/sales";

export const salesService = {
  listLeads: (tenantId: string, session: SessionContext) => 
    apiRequest<SalesLead[]>("/sales/leads", "GET", session),
  
  listOpportunities: (tenantId: string, session: SessionContext) => 
    apiRequest<SalesOpportunity[]>("/sales/opportunities", "GET", session),
  
  listQuotes: (tenantId: string, session: SessionContext) => 
    apiRequest<SalesQuote[]>("/sales/quotes", "GET", session),
  
  listTimelineEvents: (tenantId: string, session: SessionContext) => 
    apiRequest<SalesTimelineEvent[]>("/sales/timeline", "GET", session),
  
  listTasks: (tenantId: string, session: SessionContext) => 
    apiRequest<SalesTask[]>("/sales/tasks", "GET", session),
  
  listAlerts: (tenantId: string, session: SessionContext) => 
    apiRequest<SalesAlert[]>("/sales/alerts", "GET", session),
  
  listOrders: (tenantId: string, session: SessionContext) => 
    apiRequest<SalesOrder[]>("/sales/orders", "GET", session),
  
  listAuditEvents: (tenantId: string, session: SessionContext) => 
    apiRequest<SalesAuditEvent[]>("/sales/audit-events", "GET", session),

  async getDashboard(tenantId: string, session: SessionContext): Promise<SalesDashboardMetrics> {
    return apiRequest<SalesDashboardMetrics>("/sales/dashboard", "GET", session);
  },

  async getManagerMetrics(tenantId: string, session: SessionContext): Promise<SalesManagerMetrics> {
    return apiRequest<SalesManagerMetrics>("/sales/manager-metrics", "GET", session);
  },

  async getExecutiveForecast(tenantId: string, session: SessionContext): Promise<SalesExecutiveForecast> {
    return apiRequest<SalesExecutiveForecast>("/sales/executive-forecast", "GET", session);
  },

  async getPipelineByStage(tenantId: string, session: SessionContext) {
    return apiRequest<Record<string, SalesOpportunity[]>>("/sales/pipeline", "GET", session);
  },

  async getNextBestActions(tenantId: string, session: SessionContext): Promise<SalesNextAction[]> {
    return apiRequest<SalesNextAction[]>("/sales/nba", "GET", session);
  },

  async createLead(
    tenantId: string,
    session: SessionContext,
    payload: {
      companyName: string;
      contactName: string;
      contactEmail?: string;
      contactPhone?: string;
      source: SalesLead["source"];
      potentialValue: number;
      currency?: "IDR" | "USD";
      priority?: SalesLead["priority"];
    },
  ): Promise<SalesLead> {
    return apiRequest<SalesLead>("/sales/leads", "POST", session, payload);
  },

  async syncLeadFromMarketing(
    tenantId: string,
    session: SessionContext,
    payload: {
      campaignName: string;
      companyName: string;
      contactName: string;
      contactEmail?: string;
      potentialValue: number;
    },
  ): Promise<SalesLead> {
    return apiRequest<SalesLead>("/sales/leads/sync-marketing", "POST", session, payload);
  },

  async updateLeadStatus(
    tenantId: string,
    session: SessionContext,
    leadId: string,
    status: LeadStatus,
  ) {
    return apiRequest<SalesLead>(`/sales/leads/${leadId}/status`, "PUT", session, { status });
  },

  async convertLeadToOpportunity(
    tenantId: string,
    session: SessionContext,
    leadId: string,
  ): Promise<SalesOpportunity> {
    return apiRequest<SalesOpportunity>(`/sales/leads/${leadId}/convert`, "POST", session);
  },

  async moveOpportunityStage(
    tenantId: string,
    session: SessionContext,
    opportunityId: string,
    stage: OpportunityStage,
  ): Promise<SalesOpportunity> {
    return apiRequest<SalesOpportunity>(`/sales/opportunities/${opportunityId}/stage`, "PUT", session, { stage });
  },

  async createQuote(
    tenantId: string,
    session: SessionContext,
    payload: {
      opportunityId: string;
      amount: number;
      discountPercent: number;
      validDays?: number;
      notes?: string;
    },
  ): Promise<SalesQuote> {
    return apiRequest<SalesQuote>("/sales/quotes", "POST", session, payload);
  },

  async submitQuoteForApproval(
    tenantId: string,
    session: SessionContext,
    quoteId: string,
  ) {
    return apiRequest<SalesQuote>(`/sales/quotes/${quoteId}/submit`, "PUT", session);
  },

  async decideQuoteApproval(
    tenantId: string,
    session: SessionContext,
    quoteId: string,
    approved: boolean,
  ) {
    return apiRequest<SalesQuote>(`/sales/quotes/${quoteId}/decision`, "PUT", session, { approved });
  },

  async sendQuoteToCustomer(tenantId: string, session: SessionContext, quoteId: string) {
    return apiRequest<SalesQuote>(`/sales/quotes/${quoteId}/send`, "PUT", session);
  },

  async closeWonOpportunity(
    tenantId: string,
    session: SessionContext,
    opportunityId: string,
    quoteId?: string,
  ): Promise<SalesOrder> {
    return apiRequest<SalesOrder>(`/sales/opportunities/${opportunityId}/close`, "PUT", session, { 
      status: 'WON',
      quoteId 
    });
  },

  async closeLostOpportunity(
    tenantId: string,
    session: SessionContext,
    opportunityId: string,
    reason: string,
  ) {
    return apiRequest<SalesOpportunity>(`/sales/opportunities/${opportunityId}/close`, "PUT", session, { 
      status: 'LOST',
      reason 
    });
  },

  async addTimelineEvent(
    tenantId: string,
    session: SessionContext,
    payload: {
      opportunityId: string;
      leadId?: string;
      channel: SalesTimelineEvent["channel"];
      direction: SalesTimelineEvent["direction"];
      summary: string;
      detail?: string;
    },
  ): Promise<SalesTimelineEvent> {
    return apiRequest<SalesTimelineEvent>("/sales/timeline", "POST", session, payload);
  },

  async createTask(
    tenantId: string,
    session: SessionContext,
    payload: {
      leadId?: string;
      opportunityId?: string;
      title: string;
      description?: string;
      dueDate: string;
      priority: SalesTask["priority"];
    },
  ): Promise<SalesTask> {
    return apiRequest<SalesTask>("/sales/tasks", "POST", session, payload);
  },

  async markTaskDone(tenantId: string, session: SessionContext, taskId: string) {
    return apiRequest<SalesTask>(`/sales/tasks/${taskId}/done`, "PUT", session);
  },

  async runSlaSweep(tenantId: string, session: SessionContext) {
    return apiRequest<SalesAlert[]>("/sales/sla-sweep", "POST", session);
  },

  async acknowledgeAlert(tenantId: string, session: SessionContext, alertId: string) {
    return apiRequest<SalesAlert>(`/sales/alerts/${alertId}/ack`, "PUT", session);
  },
};