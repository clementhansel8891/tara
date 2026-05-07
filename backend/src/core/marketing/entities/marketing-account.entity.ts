export class MarketingConnectedAccount {
  id: string;
  tenant_id: string;
  provider: "META" | "GOOGLE" | "TIKTOK" | "YOUTUBE" | "INSTAGRAM" | "FACEBOOK";
  account_name: string;
  status: "connected" | "expired" | "disconnected";
  tokenExpiresAt: Date;
  scopes: string[];
  daily_budget_limit?: number;
  sync_frequency?: string;
  metadata?: any;
  lastSyncAt?: Date;
  created_at: Date;
  updated_at: Date;
  branch_id?: string | null;
  ecommerce_id?: string | null;
}
