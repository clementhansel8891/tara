import { Injectable } from '@nestjs/common';
import { LedgerMerkleCheckpoint } from '../domain/finance.interfaces';
import { ILedgerMerkleCheckpointRepository } from './interfaces/ledger-merkle-checkpoint.repository.interface';
import { v4 as uuid } from 'uuid';

@Injectable()
export class LedgerMerkleCheckpointMockRepository implements ILedgerMerkleCheckpointRepository {
  private checkpoints: LedgerMerkleCheckpoint[] = [];

  async create(tenantId: string, companyId: string, data: Partial<LedgerMerkleCheckpoint>): Promise<LedgerMerkleCheckpoint> {
    const checkpoint: LedgerMerkleCheckpoint = {
      id: uuid(),
      tenantId,
      companyId,
      ledgerSequence: data.ledgerSequence || 0,
      fromSequence: data.fromSequence || 0,
      toSequence: data.toSequence || 0,
      merkleRoot: data.merkleRoot || '',
      journalCount: data.journalCount || 0,
      previousCheckpointId: data.previousCheckpointId,
      createdAt: new Date(),
    };
    this.checkpoints.push(checkpoint);
    return checkpoint;
  }

  async findLatest(tenantId: string, companyId: string): Promise<LedgerMerkleCheckpoint | null> {
    const list = this.checkpoints.filter(cp => cp.tenantId === tenantId && cp.companyId === companyId);
    if (list.length === 0) return null;
    return list.reduce((latest, cp) => (cp.fromSequence || 0) > (latest.fromSequence || 0) ? cp : latest);
  }

  async findForSequence(tenantId: string, companyId: string, seq: number): Promise<LedgerMerkleCheckpoint | null> {
    const list = this.checkpoints.filter(cp => cp.tenantId === tenantId && cp.companyId === companyId);
    return list.find(cp => (cp.fromSequence || 0) <= seq && (cp.toSequence || 0) >= seq) || null;
  }

  async findAll(tenantId: string, companyId: string): Promise<LedgerMerkleCheckpoint[]> {
    const list = this.checkpoints.filter(cp => cp.tenantId === tenantId && cp.companyId === companyId);
    return [...list].sort((a, b) => (a.fromSequence || 0) - (b.fromSequence || 0));
  }
}
