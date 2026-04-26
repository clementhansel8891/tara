export interface MarketingAutomationRule {
  id: string;
  tenant_id: string;
  company_id: string;
  name: string;
  trigger_event: string;
  conditions?: any;
  actions?: any;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface MarketingAutomationLog {
  id: string;
  rule_id: string;
  contact_id: string;
  status: string;
  result?: string;
  triggered_at: Date;
}
