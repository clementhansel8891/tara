import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { ILedgerProjectionCheckpointRepository } from './interfaces/ledger-projection-checkpoint.repository.interface';
import { LedgerProjectionCheckpoint } from '../domain/finance.interfaces';
import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

@Injectable()
export class LedgerProjectionCheckpointDbRepository implements ILedgerProjectionCheckpointRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient
  ) {}

  private get db(): Prisma.TransactionClient {
    return this.prisma;
  }

  async upsert(tenant_id: string, company_id: string, projectionName: string, lastSequence: number): Promise<void> {
    await this.db.finance_ledger_projection_checkpoints.upsert({
      where: {
        tenant_id_projection_type: {
          tenant_id,

          projection_type: projectionName,
        }
      },
      update: {
        last_event_id: uuid(), // Track update event
        last_sequence: BigInt(lastSequence),
        updated_at: new Date(),
      },
      create: {
        id: uuid(),
        tenant_id,

        projection_type: projectionName,
        last_event_id: uuid(),
        last_sequence: BigInt(lastSequence),
        updated_at: new Date(),
      }
    });
  }

  async getCheckpoint(tenant_id: string, company_id: string, projectionName: string): Promise<number> {
    const raw = await this.db.finance_ledger_projection_checkpoints.findUnique({
      where: {
        tenant_id_projection_type: {
          tenant_id,

          projection_type: projectionName,
        }
      }
    });

    return raw ? Number(raw.last_sequence) : 0;
  }

  async reset(tenant_id: string, company_id: string): Promise<void> {
    await this.db.finance_ledger_projection_checkpoints.deleteMany({
      where: {
        tenant_id,

      }
    });
  }
}
