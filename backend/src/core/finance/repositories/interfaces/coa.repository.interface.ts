import { FinanceChartOfAccount } from '../../domain/finance.interfaces';

export interface IChartOfAccountRepository {
  findAll(tenantId: string, companyId: string): Promise<FinanceChartOfAccount[]>;
  findById(tenantId: string, companyId: string, id: string): Promise<FinanceChartOfAccount | null>;
  findByCode(tenantId: string, companyId: string, code: string): Promise<FinanceChartOfAccount | null>;
  create(tenantId: string, companyId: string, data: Partial<FinanceChartOfAccount>): Promise<FinanceChartOfAccount>;
  update(tenantId: string, companyId: string, id: string, data: Partial<FinanceChartOfAccount>): Promise<FinanceChartOfAccount>;
  checkInUse(tenantId: string, companyId: string, id: string): Promise<boolean>;
  delete(tenantId: string, companyId: string, id: string): Promise<void>;
}
