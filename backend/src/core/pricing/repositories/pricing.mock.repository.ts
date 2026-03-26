import { Injectable } from '@nestjs/common';
import { IPricingRepository } from './interfaces/pricing.repository.interface';
import { PricingRule } from '../entities/pricing-rule.entity';
import { PriceVersion } from '../entities/price-version.entity';
import { TransactionPriceSnapshot } from '../entities/transaction-price-snapshot.entity';
import { CreatePricingRuleDto } from '../dto/create-pricing-rule.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class PricingMockRepository implements IPricingRepository {
  private rules: PricingRule[] = [];
  private snapshots: TransactionPriceSnapshot[] = [];
  private versions: PriceVersion[] = [];

  async createRule(tenant_id: string, data: CreatePricingRuleDto): Promise<PricingRule> {
    const rule: PricingRule = {
      id: uuid(),
      tenantId: tenant_id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rules.push(rule);
    return rule;
  }

  async getRules(tenant_id: string, criteria?: any): Promise<PricingRule[]> {
    return this.rules.filter(r => r.tenantId === tenant_id && r.isActive).sort((a,b) => a.priority - b.priority);
  }

  async updateRule(tenant_id: string, id: string, data: Partial<PricingRule>): Promise<PricingRule> {
    const rule = this.rules.find(r => r.id === id && r.tenantId === tenant_id);
    if (!rule) throw new Error('Rule not found');
    Object.assign(rule, data);
    rule.updatedAt = new Date();
    return rule;
  }

  async savePriceSnapshot(tenant_id: string, data: any): Promise<TransactionPriceSnapshot> {
    const snapshot: TransactionPriceSnapshot = {
      id: uuid(),
      tenantId: tenant_id,
      ...data,
      createdAt: new Date(),
    };
    this.snapshots.push(snapshot);
    return snapshot;
  }

  async getPriceHistory(tenant_id: string, skuId: string): Promise<PriceVersion[]> {
    return this.versions.filter(v => v.tenantId === tenant_id && v.skuId === skuId);
  }

  async createPriceVersion(tenant_id: string, data: any): Promise<PriceVersion> {
    // Mark previous current version as not current
    this.versions.filter(v => v.tenantId === tenant_id && v.skuId === data.skuId).forEach(v => v.isCurrent = false);

    const version: PriceVersion = {
      id: uuid(),
      tenantId: tenant_id,
      ...data,
      isCurrent: true,
      createdAt: new Date(),
    };
    this.versions.push(version);
    return version;
  }

  async getCurrentPriceVersion(tenant_id: string, skuId: string): Promise<PriceVersion | undefined> {
    return this.versions.find(v => v.tenantId === tenant_id && v.skuId === skuId && v.isCurrent);
  }
}
