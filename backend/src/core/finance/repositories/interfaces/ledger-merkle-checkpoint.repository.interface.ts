import { LedgerMerkleCheckpoint } from '../../domain/finance.interfaces';

export interface ILedgerMerkleCheckpointRepository {
  /** Persist a newly built Merkle checkpoint. */
  create(tenantId: string, companyId: string, data: Partial<LedgerMerkleCheckpoint>): Promise<LedgerMerkleCheckpoint>;
  /** Fetch the most recent checkpoint for a tenant. */
  findLatest(tenantId: string, companyId: string): Promise<LedgerMerkleCheckpoint | null>;
  /** Fetch the checkpoint whose window covers the given ledgerSequence. */
  findForSequence(tenantId: string, companyId: string, seq: number): Promise<LedgerMerkleCheckpoint | null>;
  /** Fetch all checkpoints for a tenant, ordered by fromSequence ASC. */
  findAll(tenantId: string, companyId: string): Promise<LedgerMerkleCheckpoint[]>;
}
