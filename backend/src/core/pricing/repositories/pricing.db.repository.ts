import { TenantContext } from "../../../gateway/tenant-context.interface";
import { MultiTenancyUtil } from "../../../shared/utils/multi-tenancy.util";
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { IPricingRepository } from './interfaces/pricing.repository.interface';
import { PricingRule } from '../entities/pricing-rule.entity';
import { PriceVersion } from '../entities/price-version.entity';
import { TransactionPriceSnapshot } from '../entities/transaction-price-snapshot.entity';
import { CreatePricingRuleDto } from '../dto/create-pricing-rule.dto';
import { v4 as uuid } from 'uuid';
import { Prisma } from '@prisma/client';

@Injectable()
export class PricingDbRepository implements IPricingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRule(ctx: TenantContext, data: CreatePricingRuleDto): Promise<PricingRule> {
    const created = await this.prisma.pricing_rules.create({
      data: {
        id: uuid(),
        ...MultiTenancyUtil.getScope(ctx),
        name: data.name,
        priority: data.priority,
        logic: data.logic,
        floor_price: data.floorPrice ? new Prisma.Decimal(data.floorPrice) : null,
        ceiling_price: data.ceilingPrice ? new Prisma.Decimal(data.ceilingPrice) : null,
        conditions: data.conditions || {},
        is_active: data.isActive ?? true,
      },
    });

    return this.mapRule(created);
  }

  async getRules(ctx: TenantContext, criteria?: any): Promise<PricingRule[]> {
    const rules = await this.prisma.pricing_rules.findMany({
      where: {
        ...MultiTenancyUtil.getScope(ctx),
        is_active: true,
        ...criteria,
      },
      orderBy: {
        priority: 'asc',
      },
    });

    return rules.map(this.mapRule);
  }

  async updateRule(ctx: TenantContext, id: string, data: Partial<PricingRule>): Promise<PricingRule> {
    const updated = await this.prisma.pricing_rules.update({
      where: { id },
      data: {
        name: data.name,
        priority: data.priority,
        logic: data.logic,
        floor_price: data.floorPrice ? new Prisma.Decimal(data.floorPrice) : undefined,
        ceiling_price: data.ceilingPrice ? new Prisma.Decimal(data.ceilingPrice) : undefined,
        conditions: data.conditions,
        is_active: data.isActive,
      },
    });

    return this.mapRule(updated);
  }

  async savePriceSnapshot(ctx: TenantContext, data: any): Promise<TransactionPriceSnapshot> {
    const created = await this.prisma.price_snapshots.create({
      data: {
          updated_at: new Date(),
        id: uuid(),
        ...MultiTenancyUtil.getScope(ctx),
        payload: data,
      },
    });

    return {
      id: created.id,
      tenant_id: created.tenant_id,
      ... (created.payload as any),
      created_at: created.created_at,
    };
  }

  async getPriceHistory(ctx: TenantContext, skuId: string): Promise<PriceVersion[]> {
    const history = await this.prisma.price_versions.findMany({
      where: {
        ...MultiTenancyUtil.getScope(ctx),
        sku_id: skuId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return history.map(this.mapVersion);
  }

  async createPriceVersion(ctx: TenantContext, data: any): Promise<PriceVersion> {
    return this.prisma.$transaction(async (tx) => {
      // Deactivate current version
      await tx.price_versions.updateMany({
        where: {
          ...MultiTenancyUtil.getScope(ctx),
          sku_id: data.skuId,
          is_current: true,
        },
        data: {
          is_current: false,
        },
      });

      const created = await tx.price_versions.create({
        data: {
          id: uuid(),
          ...MultiTenancyUtil.getScope(ctx),
          sku_id: data.skuId,
          price: new Prisma.Decimal(data.price),
          is_current: true,
        },
      });

      return this.mapVersion(created);
    });
  }

  async getCurrentPriceVersion(ctx: TenantContext, skuId: string): Promise<PriceVersion | undefined> {
    const current = await this.prisma.price_versions.findFirst({
      where: {
        ...MultiTenancyUtil.getScope(ctx),
        sku_id: skuId,
        is_current: true,
      },
    });

    return current ? this.mapVersion(current) : undefined;
  }


  private mapRule(raw: any): PricingRule {
    return {
      id: raw.id,
      tenant_id: raw.tenant_id,
      name: raw.name,
      priority: raw.priority,
      logic: raw.logic,
      floorPrice: raw.floorPrice ? Number(raw.floorPrice) : undefined,
      ceilingPrice: raw.ceilingPrice ? Number(raw.ceilingPrice) : undefined,
      conditions: raw.conditions,
      isActive: raw.is_active,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    };
  }

  private mapVersion(raw: any): PriceVersion {
    return {
      id: raw.id,
      tenant_id: raw.tenant_id,
      skuId: raw.skuId,
      computedPrice: Number(raw.price),
      isCurrent: raw.isCurrent,
      created_at: raw.created_at,
      ruleId: '',
      baseCost: 0,
      currency: 'IDR',
      effectiveFrom: raw.created_at,
    };
  }
}
