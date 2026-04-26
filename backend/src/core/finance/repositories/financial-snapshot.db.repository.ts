import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { IFinancialSnapshotRepository } from './interfaces/financial-snapshot.repository.interface';
import { FinancialSnapshot } from '../domain/finance.interfaces';
import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

@Injectable()
export class FinancialSnapshotDbRepository implements IFinancialSnapshotRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient
  ) {}

  private get db(): Prisma.TransactionClient {
    return this.prisma;
  }

  async create(tenant_id: string, company_id: string, data: Partial<FinancialSnapshot>): Promise<FinancialSnapshot> {
    const id = uuid();
    
    const saved = await this.db.finance_financial_snapshots.create({
      data: {
        id,
        tenant_id,
        company_id,
        snapshot_type: 'TRIAL_BALANCE', // Default
        data: JSON.parse(data.compressedTrialBalanceState || '{}'),
        hash: data.integrityHash || '',
      }
    });

    return this.mapEntity(saved);
  }

  async findLatest(tenant_id: string, company_id: string): Promise<FinancialSnapshot | null> {
    const raw = await this.db.finance_financial_snapshots.findFirst({
      where: { tenant_id, company_id },
      orderBy: { created_at: 'desc' }
    });

    if (!raw) return null;
    return this.mapEntity(raw);
  }

  private mapEntity(raw: any): FinancialSnapshot {
    return {
      id: raw.id,
      tenant_id: raw.tenant_id,
      company_id: raw.company_id,
      fiscalPeriodId: '', // We should probably add this to the model if needed, or map it from data
      snapshotSequence: 0, 
      compressedTrialBalanceState: JSON.stringify(raw.data),
      integrityHash: raw.hash,
      created_at: raw.created_at,
    };
  }
}
