import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../persistence/prisma.service';
import { IPostingRuleRepository } from './interfaces/posting-rule.repository.interface';
import { FinancePostingRule } from '../domain/finance.interfaces';
import { PostingRuleStatus } from '../domain/finance.constants';

/**
 * Posting-rule repository.
 *
 * NOTE: the Prisma model is `finance_ledger_posting_rules` (accessor was previously the
 * non-existent `ledgerPostingRule` -> "Cannot read findMany of undefined" 500), its lines
 * relation is `finance_ledger_posting_rule_lines`, there is no `isActive` column (status is
 * a string), and ids must be generated (a hardcoded id collided on the 2nd insert).
 */
@Injectable()
export class PostingRuleDbRepository implements IPostingRuleRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Expose the lines under the domain-friendly `lines` alias for consumers. */
  private map(res: any): FinancePostingRule {
    if (!res) return res;
    return { ...res, lines: res.finance_ledger_posting_rule_lines ?? [] } as unknown as FinancePostingRule;
  }

  async findRule(tenant_id: string, company_id: string, event_type: string): Promise<FinancePostingRule | null> {
    const res = await this.prisma.finance_ledger_posting_rules.findFirst({
      where: { tenant_id, event_type, status: PostingRuleStatus.ACTIVE },
      include: { finance_ledger_posting_rule_lines: true },
    });
    return this.map(res);
  }

  async listRules(tenant_id: string, company_id: string): Promise<FinancePostingRule[]> {
    const list = await this.prisma.finance_ledger_posting_rules.findMany({
      where: { tenant_id },
      include: { finance_ledger_posting_rule_lines: true },
    });
    return list.map((r) => this.map(r));
  }

  async createRule(tenant_id: string, company_id: string, data: Partial<FinancePostingRule>): Promise<FinancePostingRule> {
    const res = await this.prisma.finance_ledger_posting_rules.create({
      data: {
        id: randomUUID(),
        updated_at: new Date(),
        tenant_id,
        // company_id is a nullable FK; ctx.company_id is not always a real companies.id,
        // so leave null to avoid an FK violation (scoping is by tenant_id).
        company_id: null,
        event_type: data.event_type || '',
        description: data.description || '',
        status: PostingRuleStatus.ACTIVE,
        finance_ledger_posting_rule_lines: {
          create: ((data as any).lines || []).map((l: any) => ({
            id: randomUUID(),
            updated_at: new Date(),
            account_id: l.accountId || l.account_id,
            side: l.side || 'DEBIT',
            amount_expression: l.amountExpression || l.amount_expression || 'amount',
          })),
        },
      },
      include: { finance_ledger_posting_rule_lines: true },
    });
    return this.map(res);
  }

  async updateStatus(tenant_id: string, company_id: string, ruleId: string, status: PostingRuleStatus): Promise<FinancePostingRule> {
    const res = await this.prisma.finance_ledger_posting_rules.update({
      where: { id: ruleId },
      data: { status, updated_at: new Date() },
      include: { finance_ledger_posting_rule_lines: true },
    });
    return this.map(res);
  }

  async findByEventType(tenant_id: string, company_id: string, event_type: string): Promise<FinancePostingRule[]> {
    const list = await this.prisma.finance_ledger_posting_rules.findMany({
      where: { tenant_id, event_type },
      include: { finance_ledger_posting_rule_lines: true },
    });
    return list.map((r) => this.map(r));
  }

  async update(tenant_id: string, company_id: string, ruleId: string, data: Partial<FinancePostingRule>): Promise<FinancePostingRule> {
    const res = await this.prisma.finance_ledger_posting_rules.update({
      where: { id: ruleId },
      data: {
        event_type: data.event_type,
        description: data.description,
        updated_at: new Date(),
      },
      include: { finance_ledger_posting_rule_lines: true },
    });
    return this.map(res);
  }
}
