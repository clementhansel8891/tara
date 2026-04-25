import type {
  SalesAlert,
  SalesAuditEvent,
  SalesLead,
  SalesOpportunity,
  SalesOrder,
  SalesQuote,
  SalesTask,
  SalesTimelineEvent,
} from "@/core/types/sales/sales";

export interface SalesRepository {
  listLeads: (tenantId: string) => Promise<SalesLead[]>;
  createLead: (tenantId: string, payload: SalesLead) => Promise<SalesLead>;
  updateLead: (
    tenantId: string,
    id: string,
    patch: Partial<SalesLead>,
  ) => Promise<SalesLead | null>;

  listOpportunities: (tenantId: string) => Promise<SalesOpportunity[]>;
  createOpportunity: (
    tenantId: string,
    payload: SalesOpportunity,
  ) => Promise<SalesOpportunity>;
  updateOpportunity: (
    tenantId: string,
    id: string,
    patch: Partial<SalesOpportunity>,
  ) => Promise<SalesOpportunity | null>;

  listQuotes: (tenantId: string) => Promise<SalesQuote[]>;
  createQuote: (tenantId: string, payload: SalesQuote) => Promise<SalesQuote>;
  updateQuote: (
    tenantId: string,
    id: string,
    patch: Partial<SalesQuote>,
  ) => Promise<SalesQuote | null>;

  listTimelineEvents: (tenantId: string) => Promise<SalesTimelineEvent[]>;
  createTimelineEvent: (
    tenantId: string,
    payload: SalesTimelineEvent,
  ) => Promise<SalesTimelineEvent>;

  listTasks: (tenantId: string) => Promise<SalesTask[]>;
  createTask: (tenantId: string, payload: SalesTask) => Promise<SalesTask>;
  updateTask: (
    tenantId: string,
    id: string,
    patch: Partial<SalesTask>,
  ) => Promise<SalesTask | null>;

  listAlerts: (tenantId: string) => Promise<SalesAlert[]>;
  createAlert: (tenantId: string, payload: SalesAlert) => Promise<SalesAlert>;
  updateAlert: (
    tenantId: string,
    id: string,
    patch: Partial<SalesAlert>,
  ) => Promise<SalesAlert | null>;

  listOrders: (tenantId: string) => Promise<SalesOrder[]>;
  createOrder: (tenantId: string, payload: SalesOrder) => Promise<SalesOrder>;
  updateOrder: (
    tenantId: string,
    id: string,
    patch: Partial<SalesOrder>,
  ) => Promise<SalesOrder | null>;

  listAuditEvents: (tenantId: string) => Promise<SalesAuditEvent[]>;
  createAuditEvent: (
    tenantId: string,
    payload: SalesAuditEvent,
  ) => Promise<SalesAuditEvent>;
}
