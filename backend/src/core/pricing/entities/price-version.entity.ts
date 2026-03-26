export class PriceVersion {
  id: string;
  tenantId: string;
  skuId: string;
  ruleId: string;
  baseCost: number;
  computedPrice: number;
  currency: string;
  effectiveFrom: Date;
  isCurrent: boolean;
  createdAt: Date;
}
