import { LedgerProjectionCheckpoint } from '../../domain/finance.interfaces';

export interface ILedgerProjectionCheckpointRepository {
  upsert(tenantId: string, companyId: string, projectionName: string, lastSequence: number): Promise<void>;
  getCheckpoint(tenantId: string, companyId: string, projectionName: string): Promise<number>;
  reset(tenantId: string, companyId: string): Promise<void>;
}
