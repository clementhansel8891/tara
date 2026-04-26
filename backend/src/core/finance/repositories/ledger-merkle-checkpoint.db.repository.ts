import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { ILedgerMerkleCheckpointRepository } from './interfaces/ledger-merkle-checkpoint.repository.interface';
import { LedgerMerkleCheckpoint } from '../domain/finance.interfaces';
import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

@Injectable()
export class LedgerMerkleCheckpointDbRepository implements ILedgerMerkleCheckpointRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient
  ) {}

  private get db(): Prisma.TransactionClient {
    return this.prisma;
  }

  async create(tenant_id: string, company_id: string, data: Partial<LedgerMerkleCheckpoint>): Promise<LedgerMerkleCheckpoint> {
    const id = uuid();
    
    const saved = await this.db.finance_ledger_merkle_checkpoints.create({
      data: {
        id,
        tenant_id,
        company_id,
        merkle_root: data.merkleRoot!,
        last_sequence: BigInt(data.ledgerSequence!),
        checkpoint_date: new Date(),
      }
    });

    return this.mapEntity(saved);
  }

  async findLatest(tenant_id: string, company_id: string): Promise<LedgerMerkleCheckpoint | null> {
    const raw = await this.db.finance_ledger_merkle_checkpoints.findFirst({
      where: { tenant_id, company_id },
      orderBy: { last_sequence: 'desc' }
    });

    if (!raw) return null;
    return this.mapEntity(raw);
  }

  async findForSequence(tenant_id: string, company_id: string, seq: number): Promise<LedgerMerkleCheckpoint | null> {
    // Find the checkpoint that covers this sequence. 
    // Usually checkpoints are cumulative or covers a range.
    // Here we find the first checkpoint with last_sequence >= seq
    const raw = await this.db.finance_ledger_merkle_checkpoints.findFirst({
      where: { 
        tenant_id, 
        company_id,
        last_sequence: { gte: BigInt(seq) }
      },
      orderBy: { last_sequence: 'asc' }
    });

    if (!raw) return null;
    return this.mapEntity(raw);
  }

  async findAll(tenant_id: string, company_id: string): Promise<LedgerMerkleCheckpoint[]> {
    const raws = await this.db.finance_ledger_merkle_checkpoints.findMany({
      where: { tenant_id, company_id },
      orderBy: { last_sequence: 'asc' }
    });

    return raws.map(r => this.mapEntity(r));
  }

  private mapEntity(raw: any): LedgerMerkleCheckpoint {
    return {
      id: raw.id,
      tenant_id: raw.tenant_id,
      company_id: raw.company_id,
      ledgerSequence: Number(raw.last_sequence),
      merkleRoot: raw.merkle_root,
      created_at: raw.created_at,
    };
  }
}
