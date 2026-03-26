import { AccountBalance, AccountBalanceSnapshot } from '../../domain/finance.interfaces';
import { Prisma } from '@prisma/client';

export interface IAccountBalanceRepository {
  findBalance(params: {
    tenantId: string;
    companyId: string;
    fiscalPeriodId: string;
    accountId: string;
    currency: string; // Multi-Currency Scoping
    branchId: string;
    locationId: string;
    departmentId?: string;
    costCenterId?: string;
    projectId?: string;
  }): Promise<AccountBalance | null>;

  updateBalance(tenantId: string, companyId: string, data: Partial<AccountBalance>): Promise<void>;
  
  /**
   * Atomically increment/decrement account balances to prevent race conditions (HOT-001).
   */
  incrementBalance(tenantId: string, companyId: string, params: {
    fiscalPeriodId: string;
    accountId: string;
    currency: string; // Multi-Currency Scoping
    branchId: string;
    locationId: string;
    departmentId?: string;
    costCenterId?: string;
    projectId?: string;
  }, delta: { debit?: Prisma.Decimal; credit?: Prisma.Decimal; net?: Prisma.Decimal }): Promise<void>;

  createSnapshot(tenantId: string, companyId: string, data: Partial<AccountBalanceSnapshot>): Promise<AccountBalanceSnapshot>;
  
  reset(tenantId: string, companyId: string): Promise<void>;
}
