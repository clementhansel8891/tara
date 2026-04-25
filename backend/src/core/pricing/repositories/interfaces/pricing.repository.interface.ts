import { TenantContext } from "../../../../gateway/tenant-context.interface";
import { PricingRule } from '../../entities/pricing-rule.entity';
import { PriceVersion } from '../../entities/price-version.entity';
import { TransactionPriceSnapshot } from '../../entities/transaction-price-snapshot.entity';
import { CreatePricingRuleDto } from '../../dto/create-pricing-rule.dto';

export interface IPricingRepository {
  // Rule Management
  createRule( ctx: TenantContext, data: CreatePricingRuleDto): Promise<PricingRule>;
  getRules( ctx: TenantContext, criteria?: any): Promise<PricingRule[]>;
  updateRule( ctx: TenantContext, id: string, data: Partial<PricingRule>): Promise<PricingRule>;

  // Price Snapshotting
  savePriceSnapshot( ctx: TenantContext, data: any): Promise<TransactionPriceSnapshot>;
  getPriceHistory( ctx: TenantContext, skuId: string): Promise<PriceVersion[]>;
  
  // Price Versioning
  createPriceVersion( ctx: TenantContext, data: any): Promise<PriceVersion>;
  getCurrentPriceVersion( ctx: TenantContext, skuId: string): Promise<PriceVersion | undefined>;
}
