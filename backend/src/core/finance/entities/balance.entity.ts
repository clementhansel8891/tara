/**
 * Balance Entity
 * Represents the current financial balance for a tenant
 */
export class Balance {
  tenantId: string;
  totalBalance: number;
  currency: string;
  lastUpdated: Date;
  totalDebits?: number;
  totalCredits?: number;
  transactionCount?: number;
}
