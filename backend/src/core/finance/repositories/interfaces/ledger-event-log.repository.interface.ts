import { LedgerEventLog } from '../../domain/finance.interfaces';

export interface ILedgerEventLogRepository {
  create(tenantId: string, companyId: string, data: any): Promise<LedgerEventLog>;
  findBySourceEventId(tenantId: string, companyId: string, sourceEventId: string): Promise<LedgerEventLog | null>;
  updateStatus(tenantId: string, companyId: string, id: string, status: 'PENDING' | 'POSTED' | 'FAILED'): Promise<void>;
  findUnprocessed(tenantId: string, companyId: string, batchSize: number): Promise<LedgerEventLog[]>;
  markProcessed(tenantId: string, companyId: string, id: string): Promise<void>;
  findProcessedBefore(tenantId: string, companyId: string, date: Date): Promise<LedgerEventLog[]>;
  deleteMany(tenantId: string, companyId: string, ids: string[]): Promise<void>;
}
