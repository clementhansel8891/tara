export enum PostingState {
  RECEIVED = 'RECEIVED',
  VALIDATED = 'VALIDATED',
  RULE_RESOLVED = 'RULE_RESOLVED',
  DRAFT_CREATED = 'DRAFT_CREATED',
  POSTED = 'POSTED',
  FAILED = 'FAILED',
  RETRY_PENDING = 'RETRY_PENDING',
  DLQ = 'DLQ',
}

export interface FinancialPostingRequest {
  requestId: string;
  tenantId: string;
  companyId: string;
  sourceModule: string;
  sourceEventId: string;
  eventType: string;
  eventVersion: string;
  schemaVersion: string;
  payload: any;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface FinancialPostingResult {
  requestId: string;
  status: PostingState;
  journalId?: string;
  ledgerSequence?: number;
  errorCode?: string;
  errorMessage?: string;
  attempts: number;
}

export interface PostingContext {
  tenantId: string;
  companyId: string;
  transactionCurrency: string;
  baseCurrency: string;
  exchangeRate: number;
  userId?: string;
  correlationId?: string;
}

export interface StateTransition {
  from: PostingState;
  to: PostingState;
  timestamp: Date;
  reason?: string;
}

export interface PostingAuditLog {
  id: string;
  requestId: string;
  stateTransitions: StateTransition[];
  fullRequestSnapshot: string; // Base64 or GZIP
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface FinancialEventRegistry {
  eventType: string;
  eventVersion: string;
  schemaVersion: string;
  ruleTemplateId: string;
  isActive: boolean;
}
