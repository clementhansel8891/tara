import { Injectable } from '@nestjs/common';
import { FinanceChartOfAccount } from '../domain/finance.interfaces';
import { IChartOfAccountRepository } from './interfaces/coa.repository.interface';
import { AccountType, NormalBalance } from '../domain/finance.constants';

@Injectable()
export class CoaMockRepository implements IChartOfAccountRepository {
  /** Key: `${tenantId}:${companyId}` */
  private coas: Map<string, FinanceChartOfAccount[]> = new Map();

  async findAll(tenantId: string, companyId: string): Promise<FinanceChartOfAccount[]> {
    return this.coas.get(`${tenantId}:${companyId}`) || [];
  }

  async findById(tenantId: string, companyId: string, id: string): Promise<FinanceChartOfAccount | null> {
    const list = await this.findAll(tenantId, companyId);
    return list.find((item) => item.id === id) || null;
  }

  async findByCode(tenantId: string, companyId: string, code: string): Promise<FinanceChartOfAccount | null> {
    const list = await this.findAll(tenantId, companyId);
    return list.find((item) => item.accountCode === code) || null;
  }

  async create(tenantId: string, companyId: string, data: Partial<FinanceChartOfAccount>): Promise<FinanceChartOfAccount> {
    const scopeKey = `${tenantId}:${companyId}`;
    const list = this.coas.get(scopeKey) || [];
    const newCoa: FinanceChartOfAccount = {
      id: data.id || Math.random().toString(36).substr(2, 9),
      tenantId,
      companyId,
      accountCode: data.accountCode || '',
      name: data.name || '',
      accountType: data.accountType || AccountType.ASSET,
      normalBalance: data.normalBalance || NormalBalance.DEBIT,
      parentAccountId: data.parentAccountId,
      accountLevel: data.accountLevel || 0,
      accountPath: data.accountPath || '',
      isActive: true,
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    list.push(newCoa);
    this.coas.set(scopeKey, list);
    return newCoa;
  }

  async update(tenantId: string, companyId: string, id: string, data: Partial<FinanceChartOfAccount>): Promise<FinanceChartOfAccount> {
    const scopeKey = `${tenantId}:${companyId}`;
    const list = this.coas.get(scopeKey) || [];
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('COA not found');

    list[index] = { ...list[index], ...data, updatedAt: new Date() };
    this.coas.set(scopeKey, list);
    return list[index];
  }

  async checkInUse(tenantId: string, companyId: string, id: string): Promise<boolean> {
    return false;
  }

  async delete(tenantId: string, companyId: string, id: string): Promise<void> {
    const scopeKey = `${tenantId}:${companyId}`;
    const list = this.coas.get(scopeKey) || [];
    const newList = list.filter((item) => item.id !== id);
    this.coas.set(scopeKey, newList);
  }
}
