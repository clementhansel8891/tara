import { TrialBalanceProjection } from '../../domain/finance.interfaces';
import { Prisma } from '@prisma/client';

export interface ITrialBalanceProjectionRepository {
  update(
    tenantId: string, 
    companyId: string,
    accountId: string, 
    fiscalPeriodId: string, 
    accountCategory: string,
    debit: Prisma.Decimal, 
    credit: Prisma.Decimal
  ): Promise<void>;
  reset(tenantId: string, companyId: string): Promise<void>;
  getBalance(tenantId: string, companyId: string, accountId: string, fiscalPeriodId: string): Promise<TrialBalanceProjection | null>;
  findAll(tenantId: string, companyId: string, fiscalPeriodId?: string, options?: any): Promise<TrialBalanceProjection[]>;
}
