import { ConsolidatedFinancialSnapshot } from '../../domain/finance.interfaces';

export interface IConsolidatedSnapshotRepository {
  getLatest(tenantId: string, groupId: string, fiscalPeriodId: string): Promise<ConsolidatedFinancialSnapshot | null>;
  create(tenantId: string, data: Partial<ConsolidatedFinancialSnapshot>): Promise<ConsolidatedFinancialSnapshot>;
  deleteByPeriod(tenantId: string, groupId: string, fiscalPeriodId: string): Promise<void>;
}
