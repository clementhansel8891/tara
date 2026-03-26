import { FinancialSnapshot } from '../../domain/finance.interfaces';

export interface IFinancialSnapshotRepository {
  create(tenantId: string, companyId: string, data: Partial<FinancialSnapshot>): Promise<FinancialSnapshot>;
  findLatest(tenantId: string, companyId: string): Promise<FinancialSnapshot | null>;
}
