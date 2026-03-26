import { Injectable } from '@nestjs/common';
import { IntercompanyEliminationRule } from '../domain/finance.interfaces';
import { IIntercompanyEliminationRepository } from './interfaces/intercompany-elimination.repository.interface';

@Injectable()
export class IntercompanyEliminationMockRepository implements IIntercompanyEliminationRepository {
  private rules: Map<string, IntercompanyEliminationRule[]> = new Map();

  async listRules(tenantId: string): Promise<IntercompanyEliminationRule[]> {
    return this.rules.get(tenantId) || [];
  }

  async findByCompanies(tenantId: string, companyA: string, companyB: string): Promise<IntercompanyEliminationRule | null> {
    const list = this.rules.get(tenantId) || [];
    return list.find((r) => 
      (r.companyA === companyA && r.companyB === companyB) ||
      (r.companyA === companyB && r.companyB === companyA)
    ) || null;
  }

  async createRule(tenantId: string, data: Partial<IntercompanyEliminationRule>): Promise<IntercompanyEliminationRule> {
    const list = this.rules.get(tenantId) || [];
    const newRule: IntercompanyEliminationRule = {
      id: Math.random().toString(36).substr(2, 9),
      tenantId,
      companyA: data.companyA || '',
      companyB: data.companyB || '',
      accountMapping: data.accountMapping || {},
      isActive: data.isActive !== false,
      updatedAt: new Date(),
    };
    list.push(newRule);
    this.rules.set(tenantId, list);
    return newRule;
  }

  async updateRule(tenantId: string, id: string, data: Partial<IntercompanyEliminationRule>): Promise<IntercompanyEliminationRule> {
    const list = this.rules.get(tenantId) || [];
    const index = list.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Rule not found');

    list[index] = { ...list[index], ...data, updatedAt: new Date() };
    this.rules.set(tenantId, list);
    return list[index];
  }

  async deleteRule(tenantId: string, id: string): Promise<void> {
    const list = this.rules.get(tenantId) || [];
    const index = list.findIndex((r) => r.id === id);
    if (index !== -1) {
      list.splice(index, 1);
      this.rules.set(tenantId, list);
    }
  }
}
