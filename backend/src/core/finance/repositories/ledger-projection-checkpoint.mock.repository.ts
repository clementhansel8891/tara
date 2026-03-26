import { Injectable } from '@nestjs/common';
import { LedgerProjectionCheckpoint } from '../domain/finance.interfaces';
import { ILedgerProjectionCheckpointRepository } from './interfaces/ledger-projection-checkpoint.repository.interface';

@Injectable()
export class LedgerProjectionCheckpointMockRepository implements ILedgerProjectionCheckpointRepository {
  private checkpoints: Map<string, LedgerProjectionCheckpoint> = new Map();

  async upsert(tenantId: string, companyId: string, projectionType: string, sequence: number): Promise<void> {
    const key = `${tenantId}:${companyId}:${projectionType}`;
    this.checkpoints.set(key, {
      id: Math.random().toString(36).substr(2, 9),
      tenantId: tenantId,
      companyId: companyId,
      projectionType: projectionType,
      lastSequence: sequence,
      lastJournalSequence: sequence,
      updatedAt: new Date(),
    });
  }

  async getCheckpoint(tenantId: string, companyId: string, projectionType: string): Promise<number> {
    const key = `${tenantId}:${companyId}:${projectionType}`;
    const cp = this.checkpoints.get(key);
    return cp ? Number(cp.lastSequence) : 0;
  }

  async reset(tenantId: string, companyId: string): Promise<void> {
    for (const [key, value] of this.checkpoints.entries()) {
      if (value.tenantId === tenantId && value.companyId === companyId) {
        this.checkpoints.delete(key);
      }
    }
  }
}
