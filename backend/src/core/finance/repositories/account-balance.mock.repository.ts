import { Injectable } from '@nestjs/common';
import { IAccountBalanceRepository } from './interfaces/account-balance.repository.interface';
import { AccountBalance, AccountBalanceSnapshot } from '../domain/finance.interfaces';
import { Prisma } from '@prisma/client';

@Injectable()
export class AccountBalanceMockRepository implements IAccountBalanceRepository {
  private balances: Map<string, AccountBalance[]> = new Map();
  private snapshots: Map<string, AccountBalanceSnapshot[]> = new Map();

  async findBalance(params: {
    tenantId: string;
    companyId: string;
    fiscalPeriodId: string;
    accountId: string;
    currency: string;
    branchId: string;
    locationId: string;
    departmentId?: string;
    costCenterId?: string;
    projectId?: string;
  }): Promise<AccountBalance | null> {
    const scopeKey = `${params.tenantId}:${params.companyId}`;
    const list = this.balances.get(scopeKey) || [];
    return list.find(b => 
      b.accountId === params.accountId && 
      b.fiscalPeriodId === params.fiscalPeriodId &&
      b.currency === params.currency
    ) || null;
  }

  async updateBalance(tenantId: string, companyId: string, data: Partial<AccountBalance>): Promise<void> {
    const scopeKey = `${tenantId}:${companyId}`;
    let list = this.balances.get(scopeKey) || [];
    const index = list.findIndex(b => b.accountId === data.accountId && b.fiscalPeriodId === data.fiscalPeriodId);

    if (index !== -1) {
      list[index] = { ...list[index], ...data, lastUpdatedAt: new Date(), version: (list[index].version || 0) + 1 };
    } else {
      list.push({
        id: data.id || Math.random().toString(36).substr(2, 9),
        tenantId,
        companyId,
        accountId: data.accountId!,
        currency: data.currency || 'USD',
        fiscalPeriodId: data.fiscalPeriodId!,
        debitTotal: data.debitTotal || new Prisma.Decimal(0),
        creditTotal: data.creditTotal || new Prisma.Decimal(0),
        netBalance: data.netBalance || new Prisma.Decimal(0),
        branchId: data.branchId || 'MAIN',
        locationId: data.locationId || 'LOC1',
        version: 1,
        lastUpdatedAt: new Date(),
      });
    }
    this.balances.set(scopeKey, list);
  }

  async incrementBalance(tenantId: string, companyId: string, params: any, delta: any): Promise<void> {
    const current = await this.findBalance({ tenantId, companyId, ...params });
    const debit = (current?.debitTotal || new Prisma.Decimal(0)).plus(delta.debit || 0);
    const credit = (current?.creditTotal || new Prisma.Decimal(0)).plus(delta.credit || 0);
    const net = (current?.netBalance || new Prisma.Decimal(0)).plus(delta.net || 0);

    await this.updateBalance(tenantId, companyId, {
      ...params,
      debitTotal: debit,
      creditTotal: credit,
      netBalance: net,
    });
  }

  async createSnapshot(tenantId: string, companyId: string, data: Partial<AccountBalanceSnapshot>): Promise<AccountBalanceSnapshot> {
    const scopeKey = `${tenantId}:${companyId}`;
    let list = this.snapshots.get(scopeKey) || [];
    
    const newSnapshot: AccountBalanceSnapshot = {
      id: Math.random().toString(36).substr(2, 9),
      tenantId,
      companyId,
      accountId: data.accountId || 'MOCK-ACC',
      currency: data.currency || 'USD',
      periodId: data.periodId || 'MOCK-PERIOD',
      fiscalPeriodId: data.fiscalPeriodId || data.periodId,
      openingBalance: data.openingBalance || new Prisma.Decimal(0),
      debitTotal: data.debitTotal || new Prisma.Decimal(0),
      creditTotal: data.creditTotal || new Prisma.Decimal(0),
      closingBalance: data.closingBalance || new Prisma.Decimal(0),
      snapshotSequence: data.snapshotSequence || 0,
      snapshotDate: data.snapshotDate || new Date(),
      snapshotType: data.snapshotType || 'EOM',
      balancesData: data.balancesData || {},
      lastUpdatedAt: new Date(),
    };

    list.push(newSnapshot);
    this.snapshots.set(scopeKey, list);
    return newSnapshot;
  }

  async reset(tenantId: string, companyId: string): Promise<void> {
    const scopeKey = `${tenantId}:${companyId}`;
    this.balances.delete(scopeKey);
    this.snapshots.delete(scopeKey);
  }
}
