import { Injectable } from '@nestjs/common';
import { IPostingRuleRepository } from './interfaces/posting-rule.repository.interface';
import { FinancePostingRule } from '../domain/finance.interfaces';
import { PostingRuleStatus } from '../domain/finance.constants';

@Injectable()
export class PostingRuleMockRepository implements IPostingRuleRepository {
  private rules: FinancePostingRule[] = [];

  async findRule(tenantId: string, companyId: string, eventType: string): Promise<FinancePostingRule | null> {
    return this.rules.find(r => r.tenantId === tenantId && r.companyId === companyId && r.eventType === eventType) || null;
  }

  async listRules(tenantId: string, companyId: string): Promise<FinancePostingRule[]> {
    return this.rules.filter(r => r.tenantId === tenantId && r.companyId === companyId);
  }

  async createRule(tenantId: string, companyId: string, data: Partial<FinancePostingRule>): Promise<FinancePostingRule> {
    const newRule: FinancePostingRule = {
      id: Math.random().toString(36).substr(2, 9),
      tenantId,
      companyId,
      eventType: data.eventType || '',
      description: data.description || '',
      isActive: true,
      lines: (data as any).lines || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    this.rules.push(newRule);
    return newRule;
  }

  async updateStatus(tenantId: string, companyId: string, ruleId: string, status: PostingRuleStatus): Promise<FinancePostingRule> {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      this.rules[index].isActive = status === PostingRuleStatus.ACTIVE;
      return this.rules[index];
    }
    throw new Error('Rule not found');
  }

  async findByEventType(tenantId: string, companyId: string, eventType: string): Promise<FinancePostingRule[]> {
    return this.rules.filter(r => r.tenantId === tenantId && r.companyId === companyId && r.eventType === eventType);
  }

  async update(tenantId: string, companyId: string, ruleId: string, data: Partial<FinancePostingRule>): Promise<FinancePostingRule> {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
       this.rules[index] = { ...this.rules[index], ...data };
       return this.rules[index];
    }
    throw new Error('Rule not found');
  }
}
