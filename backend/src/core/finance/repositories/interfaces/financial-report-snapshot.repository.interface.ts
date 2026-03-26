import { FinancialReportSnapshot } from '../../domain/finance.interfaces';

export interface IFinancialReportSnapshotRepository {
  create(data: Partial<FinancialReportSnapshot>): Promise<FinancialReportSnapshot>;
  findLatest(tenantId: string, companyId: string, reportType: string, fiscalPeriodId: string, parametersHash: string): Promise<FinancialReportSnapshot | null>;
  deleteOldSnapshots(tenantId: string, companyId: string, olderThan: Date): Promise<void>;
}
