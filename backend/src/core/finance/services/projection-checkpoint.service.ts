import { Injectable, Inject } from '@nestjs/common';
import { ILedgerProjectionCheckpointRepository } from '../repositories/interfaces/ledger-projection-checkpoint.repository.interface';

@Injectable()
export class ProjectionCheckpointService {
  constructor(
    @Inject('ILedgerProjectionCheckpointRepository')
    private readonly checkpointRepo: ILedgerProjectionCheckpointRepository,
  ) {}

  /**
   * Returns the latest ledgerSequence that has been fully processed by all projections.
   */
  async getLatestCheckpoint(tenantId: string, companyId: string): Promise<number> {
    return this.checkpointRepo.getCheckpoint(tenantId, companyId, 'ALL_PROJECTIONS');
  }
}
