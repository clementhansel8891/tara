export type IncentivePlanStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";

export type IncentiveTargetType = "PARENT_COMPANY" | "COMPANY" | "BRANCH" | "ECOMMERCE";

export type IncentiveRuleType = "RETAIL" | "SALES";

export interface IncentiveRule {
  id: string;
  plan_id: string;
  rule_type: IncentiveRuleType;
  condition_type: "SKU" | "CATEGORY" | "VOLUME" | "TOTAL_VOLUME" | "GLOBAL" | "TRANSACTION_TOTAL";
  condition_value: string;
  incentive_percent: number;
  base_type?: "PERCENTAGE" | "FIXED_AMOUNT" | "SLIDING_SCALE";
  value?: number;
  scales?: { threshold: number; value: number }[];
  is_active: boolean;
  created_at: string;
}


export interface IncentiveEligibility {
  id: string;
  plan_id: string;
  target_type: IncentiveTargetType;
  target_id: string;
  exclude: boolean;
  created_at: string;
}

export interface IncentivePlan {
  id: string;
  tenant_id: string;
  company_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  version: number;
  conflict_strategy?: "PRIORITY" | "COMBINE_ALL" | "MAX_VALUE";
  metadata?: any;
  created_at: string;
  updated_at: string;
  rules?: IncentiveRule[];
  eligibility?: IncentiveEligibility[];
}

export interface SalesAttribution {
  id: string;
  tenant_id: string;
  company_id: string;
  entity_type: "RETAIL_ORDER" | "SALES_ORDER";
  entity_id: string;
  employee_id: string;
  employee_name?: string;
  share_percent: number;
  incentive_amount: number;
  status: "PENDING" | "PROCESSED" | "PAID";
  attribution_type: string;
  created_at: string;
}

export interface IncentivePayout {
  id: string;
  tenant_id: string;
  company_id: string;
  employee_id: string;
  employee_name?: string;
  total_amount: number;
  currency: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  processed_at?: string;
  created_at: string;
  attributions?: SalesAttribution[];
}

export interface IncentiveAuditLog {
  id: string;
  plan_id: string;
  actor_id: string;
  action: string;
  changes: {
    before: Partial<IncentivePlan>;
    after: Partial<IncentivePlan>;
  };
  timestamp: string;
}
