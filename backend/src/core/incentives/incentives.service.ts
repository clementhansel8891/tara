import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma.service';
import { CreateIncentivePlanDto } from './dto/create-plan.dto';
import { CreateIncentiveRuleDto } from './dto/create-rule.dto';
import { v4 as uuidv4 } from 'uuid';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class IncentivesService {
  private readonly logger = new Logger(IncentivesService.name);

  constructor(private prisma: PrismaService) {}

  async createPlan(dto: CreateIncentivePlanDto) {
    this.logger.log(`Creating incentive plan: ${dto.name}`);
    return this.prisma.sales_incentive_plans.create({
      data: {
        id: uuidv4(),
        ...dto,
        version: 1,
      },
    });
  }

  async getPlans(tenant_id: string, company_id: string) {
    return this.prisma.sales_incentive_plans.findMany({
      where: {
        tenant_id,
        company_id,
      },
      include: {
        rules: true,
      },
    });
  }

  async getPlanById(id: string) {
    return this.prisma.sales_incentive_plans.findUnique({
      where: { id },
      include: {
        rules: true,
        eligibility: true,
      },
    });
  }

  async createRule(dto: CreateIncentiveRuleDto) {
    this.logger.log(`Creating incentive rule for plan ${dto.plan_id}`);
    return this.prisma.sales_incentive_rules.create({
      data: {
        id: uuidv4(),
        ...dto,
      },
    });
  }

  async updatePlanStatus(id: string, is_active: boolean) {
    return this.prisma.sales_incentive_plans.update({
      where: { id },
      data: { is_active, updated_at: new Date() },
    });
  }

  async deletePlan(id: string) {
    return this.prisma.sales_incentive_plans.delete({
      where: { id },
    });
  }

  async setEligibility(plan_id: string, eligibility: { target_type: string; target_id: string; is_excluded: boolean }[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.sales_incentive_eligibility.deleteMany({
        where: { plan_id },
      });

      return tx.sales_incentive_eligibility.createMany({
        data: eligibility.map((e) => ({
          id: uuidv4(),
          plan_id,
          ...e,
        })),
      });
    });
  }

  async getEligibleStaff(plan_id: string) {
    const plan = await this.prisma.sales_incentive_plans.findUnique({
      where: { id: plan_id },
      include: { eligibility: true },
    });

    if (!plan) return [];

    const inclusions = plan.eligibility.filter((e) => !e.is_excluded);
    const exclusions = plan.eligibility.filter((e) => e.is_excluded);

    const eligibleIds = new Set<string>();

    for (const inc of inclusions) {
      const ids = await this.resolveTargetIds(inc.target_type, inc.target_id, plan.tenant_id);
      ids.forEach((id) => eligibleIds.add(id));
    }

    for (const exc of exclusions) {
      const ids = await this.resolveTargetIds(exc.target_type, exc.target_id, plan.tenant_id);
      ids.forEach((id) => eligibleIds.delete(id));
    }

    return Array.from(eligibleIds);
  }

  async evaluateOrder(orderId: string, type: 'RETAIL' | 'SALES') {
    this.logger.log(`Evaluating incentives for ${type} order: ${orderId}`);

    let order: any;
    if (type === 'RETAIL') {
      order = await this.prisma.retail_orders.findUnique({
        where: { id: orderId },
        include: {
          retail_order_items: {
            include: { item_masters: true },
          },
        },
      });
    } else {
      return;
    }

    if (!order || !order.cashier_id) return;

    const plans = await this.prisma.sales_incentive_plans.findMany({
      where: {
        tenant_id: order.tenant_id,
        is_active: true,
        start_date: { lte: order.created_at },
        OR: [{ end_date: null }, { end_date: { gte: order.created_at } }],
      },
      include: {
        rules: true,
        eligibility: true,
      },
    });

    const attributions: any[] = [];

    for (const plan of plans) {
      const eligibleStaff = await this.getEligibleStaff(plan.id);
      if (!eligibleStaff.includes(order.cashier_id)) continue;

      const planAttributions = await this.applyPlanRules(plan, order);
      attributions.push(...planAttributions);
    }

    if (attributions.length > 0) {
      await this.prisma.sales_attributions.createMany({
        data: attributions.map((attr) => ({
          id: uuidv4(),
          tenant_id: order.tenant_id,
          company_id: order.tenant_id,
          entity_type: type === 'RETAIL' ? 'RETAIL_ORDER' : 'SALES_ORDER',
          entity_id: orderId,
          employee_id: order.cashier_id as string,
          share_percent: new Decimal(attr.percent),
          incentive_amount: new Decimal(attr.amount),
          status: 'PENDING',
          attribution_type: 'AUTOMATIC',
          metadata: { rule_id: attr.rule_id },
          created_at: new Date(),
        })),
      });
    }

    return attributions;
  }

  async processPayouts(tenant_id: string, company_id: string, start_date: Date, end_date: Date) {
    this.logger.log(`Processing payouts for ${company_id} from ${start_date} to ${end_date}`);

    // 1. Fetch pending attributions
    const attributions = await this.prisma.sales_attributions.findMany({
      where: {
        tenant_id,
        company_id,
        status: 'PENDING',
        created_at: { gte: start_date, lte: end_date },
      },
    });

    if (attributions.length === 0) return [];

    // 2. Group by employee
    const employeeGroup: Record<string, any[]> = {};
    for (const attr of attributions) {
      if (!employeeGroup[attr.employee_id]) employeeGroup[attr.employee_id] = [];
      employeeGroup[attr.employee_id].push(attr);
    }

    const payouts: any[] = [];

    // 3. Create payouts in transaction
    await this.prisma.$transaction(async (tx) => {
      for (const employee_id in employeeGroup) {
        const employeeAttributions = employeeGroup[employee_id];
        const total_amount = employeeAttributions.reduce((sum, a) => sum.add(a.incentive_amount), new Decimal(0));

        const payout = await tx.sales_incentive_payouts.create({
          data: {
            id: uuidv4(),
            tenant_id,
            company_id,
            employee_id,
            total_amount,
            status: 'PENDING',
            created_at: new Date(),
          },
        });

        // Update attributions
        await tx.sales_attributions.updateMany({
          where: { id: { in: employeeAttributions.map((a) => a.id) } },
          data: {
            status: 'PROCESSED',
            payout_id: payout.id,
            updated_at: new Date(),
          },
        });

        payouts.push(payout);
      }
    });

    return payouts;
  }

  private async applyPlanRules(plan: any, order: any) {
    const attributions: any[] = [];
    const rules = [...plan.rules].sort((a: any, b: any) => b.priority - a.priority);

    for (const item of order.retail_order_items) {
      const itemMatches: any[] = [];

      const skuRule = rules.find((r: any) => r.dimension === 'SKU' && r.dimension_value === item.item_masters.sku);
      if (skuRule) itemMatches.push(skuRule);

      const catRule = rules.find((r: any) => r.dimension === 'CATEGORY' && r.dimension_value === item.item_masters.category_id);
      if (catRule) itemMatches.push(catRule);

      const globalRule = rules.find((r: any) => r.dimension === 'GLOBAL');
      if (globalRule) itemMatches.push(globalRule);

      if (itemMatches.length > 0) {
        const itemAttributions = itemMatches.map((r: any) => ({
          rule_id: r.id,
          amount: this.calculateAmount(r, item.total_price),
          percent: r.base_type === 'PERCENTAGE' ? Number(r.value) : 0,
        }));

        attributions.push(...this.resolveConflicts(itemAttributions, plan.conflict_strategy));
      }
    }

    const totalRule = rules.find((r: any) => r.dimension === 'TRANSACTION_TOTAL');
    if (totalRule) {
      attributions.push({
        rule_id: totalRule.id,
        amount: this.calculateAmount(totalRule, order.total_amount),
        percent: totalRule.base_type === 'PERCENTAGE' ? Number(totalRule.value) : 0,
      });
    }

    return attributions;
  }

  private resolveConflicts(matches: any[], strategy: string) {
    if (matches.length <= 1) return matches;

    switch (strategy) {
      case 'COMBINE_ALL':
        return matches;
      case 'MAX_VALUE':
        const maxMatch = matches.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
        return [maxMatch];
      case 'PRIORITY':
      default:
        return [matches[0]]; 
    }
  }

  private calculateAmount(rule: any, baseAmount: Decimal | number): number {
    const val = Number(rule.value);
    const base = Number(baseAmount);

    if (rule.base_type === 'PERCENTAGE') {
      return (base * val) / 100;
    } else if (rule.base_type === 'FIXED_AMOUNT') {
      return val;
    }
    return 0;
  }

  private async resolveTargetIds(type: string, id: string, tenant_id: string): Promise<string[]> {
    switch (type) {
      case 'INDIVIDUAL':
        return [id];
      case 'BRANCH':
        const branchEmployees = await this.prisma.employees.findMany({
          where: { location_id: id, tenant_id, status: 'active' },
          select: { id: true },
        });
        return branchEmployees.map((e) => e.id);
      case 'DEPARTMENT':
        const deptEmployees = await this.prisma.employees.findMany({
          where: { department_id: id, tenant_id, status: 'active' },
          select: { id: true },
        });
        return deptEmployees.map((e) => e.id);
      case 'COMPANY':
        const companyEmployees = await this.prisma.employees.findMany({
          where: { tenant_id: id, status: 'active' },
          select: { id: true },
        });
        return companyEmployees.map((e) => e.id);
      default:
        return [];
    }
  }
}
