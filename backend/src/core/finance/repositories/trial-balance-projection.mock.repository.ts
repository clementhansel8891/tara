import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ITrialBalanceProjectionRepository } from './interfaces/trial-balance-projection.repository.interface';
import { TrialBalanceProjection } from '../domain/finance.interfaces';
import { AccountType } from '../domain/finance.constants';

@Injectable()
export class TrialBalanceProjectionMockRepository implements ITrialBalanceProjectionRepository {
  private projections: Map<string, TrialBalanceProjection> = new Map();

  async update(
    tenantId: string, 
    companyId: string,
    accountId: string, 
    fiscalPeriodId: string, 
    accountCategory: string,
    debit: Prisma.Decimal, 
    credit: Prisma.Decimal
  ): Promise<void> {
    const key = `${tenantId}:${companyId}:${fiscalPeriodId}:${accountId}`;
    const existing = this.projections.get(key);

    if (existing) {
      existing.debitTotal = existing.debitTotal.plus(debit);
      existing.creditTotal = existing.creditTotal.plus(credit);
      existing.lastUpdatedAt = new Date();
    } else {
      this.projections.set(key, {
        id: Math.random().toString(36).substr(2, 9),
        tenantId,
        companyId,
        fiscalPeriodId,
        accountId,
        accountName: 'MOCK',
        accountCategory,
        debitTotal: debit,
        creditTotal: credit,
        snapshotSequence: 0,
        lastUpdatedAt: new Date(),
      });
    }
  }

  async getBalance(tenantId: string, companyId: string, accountId: string, fiscalPeriodId: string): Promise<TrialBalanceProjection | null> {
    const key = `${tenantId}:${companyId}:${fiscalPeriodId}:${accountId}`;
    return this.projections.get(key) || null;
  }

  async findAll(tenantId: string, companyId: string): Promise<TrialBalanceProjection[]> {
    return Array.from(this.projections.values()).filter(p => p.tenantId === tenantId && p.companyId === companyId);
  }

  async reset(tenantId: string, companyId: string): Promise<void> {
    for (const [key, value] of this.projections.entries()) {
      if (value.tenantId === tenantId && value.companyId === companyId) {
        this.projections.delete(key);
      }
    }
  }
}
