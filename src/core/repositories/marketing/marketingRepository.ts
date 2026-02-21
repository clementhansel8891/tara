import type {
  AttributionRecord,
  CampaignExecutionRun,
  ConnectedAccount,
  MarketingAlert,
  MarketingAuditEvent,
  MarketingCampaign,
  MarketingLead,
  NurtureWorkflow,
} from "@/core/types/marketing/marketing";

export interface MarketingRepository {
  listCampaigns: (tenantId: string) => Promise<MarketingCampaign[]>;
  createCampaign: (tenantId: string, payload: MarketingCampaign) => Promise<MarketingCampaign>;
  updateCampaign: (
    tenantId: string,
    id: string,
    patch: Partial<MarketingCampaign>,
  ) => Promise<MarketingCampaign | null>;

  listExecutions: (tenantId: string) => Promise<CampaignExecutionRun[]>;
  createExecution: (tenantId: string, payload: CampaignExecutionRun) => Promise<CampaignExecutionRun>;
  updateExecution: (
    tenantId: string,
    id: string,
    patch: Partial<CampaignExecutionRun>,
  ) => Promise<CampaignExecutionRun | null>;

  listLeads: (tenantId: string) => Promise<MarketingLead[]>;
  createLead: (tenantId: string, payload: MarketingLead) => Promise<MarketingLead>;
  updateLead: (
    tenantId: string,
    id: string,
    patch: Partial<MarketingLead>,
  ) => Promise<MarketingLead | null>;

  listWorkflows: (tenantId: string) => Promise<NurtureWorkflow[]>;
  createWorkflow: (tenantId: string, payload: NurtureWorkflow) => Promise<NurtureWorkflow>;
  updateWorkflow: (
    tenantId: string,
    id: string,
    patch: Partial<NurtureWorkflow>,
  ) => Promise<NurtureWorkflow | null>;

  listConnectedAccounts: (tenantId: string) => Promise<ConnectedAccount[]>;
  createConnectedAccount: (tenantId: string, payload: ConnectedAccount) => Promise<ConnectedAccount>;
  updateConnectedAccount: (
    tenantId: string,
    id: string,
    patch: Partial<ConnectedAccount>,
  ) => Promise<ConnectedAccount | null>;

  listAttribution: (tenantId: string) => Promise<AttributionRecord[]>;
  createAttribution: (tenantId: string, payload: AttributionRecord) => Promise<AttributionRecord>;

  listAlerts: (tenantId: string) => Promise<MarketingAlert[]>;
  createAlert: (tenantId: string, payload: MarketingAlert) => Promise<MarketingAlert>;
  updateAlert: (
    tenantId: string,
    id: string,
    patch: Partial<MarketingAlert>,
  ) => Promise<MarketingAlert | null>;

  listAuditEvents: (tenantId: string) => Promise<MarketingAuditEvent[]>;
  createAuditEvent: (tenantId: string, payload: MarketingAuditEvent) => Promise<MarketingAuditEvent>;
}
