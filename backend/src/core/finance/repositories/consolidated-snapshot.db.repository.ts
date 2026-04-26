import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { ConsolidatedFinancialSnapshot } from '../domain/finance.interfaces';
import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ConsolidatedSnapshotDbRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient
  ) {}

  private get db(): Prisma.TransactionClient {
    return this.prisma;
  }

  async save(snapshot: ConsolidatedFinancialSnapshot): Promise<void> {
    const id = snapshot.id || uuid();
    
    await this.db.finance_consolidated_snapshots.create({
      data: {
        id,
        tenant_id: snapshot.tenant_id,
        group_id: snapshot.groupId,
        fiscal_period: snapshot.fiscalPeriodId,
        snapshot_data: JSON.parse(snapshot.compressedData || '{}'),
      }
    });
  }

  async findLatest(tenant_id: string, groupId: string): Promise<ConsolidatedFinancialSnapshot | null> {
    const raw = await this.db.finance_consolidated_snapshots.findFirst({
      where: { tenant_id, group_id: groupId },
      orderBy: { created_at: 'desc' }
    });

    if (!raw) return null;
    return this.mapEntity(raw);
  }

  private mapEntity(raw: any): ConsolidatedFinancialSnapshot {
    return {
      id: raw.id,
      tenant_id: raw.tenant_id,
      groupId: raw.group_id,
      fiscalPeriodId: raw.fiscal_period,
      reportParametersHash: '', 
      compressedData: JSON.stringify(raw.snapshot_data),
      projectionCheckpointSequence: 0,
      created_at: raw.created_at,
    };
  }
}
