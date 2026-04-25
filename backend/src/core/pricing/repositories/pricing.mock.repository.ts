import { Injectable } from '@nestjs/common';
import { IPricingRepository } from './interfaces/pricing.repository.interface';
import { PricingRule } from '../entities/pricing-rule.entity';
import { PriceVersion } from '../entities/price-version.entity';
import { TransactionPriceSnapshot } from '../entities/transaction-price-snapshot.entity';
import { CreatePricingRuleDto } from '../dto/create-pricing-rule.dto';
import { v4 as uuid } from 'uuid';
import { TenantContext } from '../../../gateway/tenant-context.interface';

@Injectable()
export class PricingMockRepository implements IPricingRepository {
  private rules: PricingRule[] = [];
  private snapshots: TransactionPriceSnapshot[] = [];
  private versions: PriceVersion[] = [];

  async createRule(ctx: TenantContext, data: CreatePricingRuleDto): Promise<PricingRule> {
    const rule: PricingRule = {
      id: uuid(),
      tenant_id: ctx.tenant_id,
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.rules.push(rule);
    return rule;
  }

  async getRules(ctx: TenantContext, criteria?: any): Promise<PricingRule[]> {
    return this.rules.filter(r => r.tenant_id === ctx.tenant_id && r.isActive).sort((a,b) => a.priority - b.priority);
  }

  async updateRule(ctx: TenantContext, id: string, data: Partial<PricingRule>): Promise<PricingRule> {
    const rule = this.rules.find(r => r.id === id && r.tenant_id === ctx.tenant_id);
    if (!rule) throw new Error('Rule not found');
    Object.assign(rule, data);
    rule.updated_at = new Date();
    return rule;
  }

  async savePriceSnapshot(ctx: TenantContext, data: any): Promise<TransactionPriceSnapshot> {
    const snapshot: TransactionPriceSnapshot = {
      id: uuid(),
      tenant_id: ctx.tenant_id,
      ...data,
      created_at: new Date(),
    };
    this.snapshots.push(snapshot);
    return snapshot;
  }

  async getPriceHistory(ctx: TenantContext, skuId: string): Promise<PriceVersion[]> {
    return this.versions.filter(v => v.tenant_id === ctx.tenant_id && v.skuId === skuId);
  }

  async createPriceVersion(ctx: TenantContext, data: any): Promise<PriceVersion> {
    // Mark previous current version as not current
    this.versions.filter(v => v.tenant_id === ctx.tenant_id && v.skuId === data.skuId).forEach(v => v.isCurrent = false);

    const version: PriceVersion = {
      id: uuid(),
      tenant_id: ctx.tenant_id,
      ...data,
      isCurrent: true,
      created_at: new Date(),
    };
    this.versions.push(version);
    return version;
  }

  async getCurrentPriceVersion(ctx: TenantContext, skuId: string): Promise<PriceVersion | undefined> {
    return this.versions.find(v => v.tenant_id === ctx.tenant_id && v.skuId === skuId && v.isCurrent);
  }
}
