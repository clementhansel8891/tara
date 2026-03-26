export class PricingRule {
  id: string;
  tenantId: string;
  name: string;
  priority: number; // Lower is higher priority
  logic: string; // e.g. "MARKUP_PERCENT:20", "MARGIN_PERCENT:15", "FIXED:100"
  floorPrice?: number;
  ceilingPrice?: number;
  conditions?: any; // JSON for customer group, location, etc.
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
