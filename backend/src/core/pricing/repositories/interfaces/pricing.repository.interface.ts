import { PricingRule } from '../../entities/pricing-rule.entity';
import { PriceVersion } from '../../entities/price-version.entity';
import { TransactionPriceSnapshot } from '../../entities/transaction-price-snapshot.entity';
import { CreatePricingRuleDto } from '../../dto/create-pricing-rule.dto';

export interface IPricingRepository {
  // Rule Management
  createRule(tenant_id: string, data: CreatePricingRuleDto): Promise<PricingRule>;
  getRules(tenant_id: string, criteria?: any): Promise<PricingRule[]>;
  updateRule(tenant_id: string, id: string, data: Partial<PricingRule>): Promise<PricingRule>;

  // Price Snapshotting
  savePriceSnapshot(tenant_id: string, data: any): Promise<TransactionPriceSnapshot>;
  getPriceHistory(tenant_id: string, skuId: string): Promise<PriceVersion[]>;
  
  // Price Versioning
  createPriceVersion(tenant_id: string, data: any): Promise<PriceVersion>;
  getCurrentPriceVersion(tenant_id: string, skuId: string): Promise<PriceVersion | undefined>;
}
