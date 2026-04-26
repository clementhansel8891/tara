import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { ILedgerHashAnchorRepository } from './interfaces/ledger-hash-anchor.repository.interface';
import { LedgerHashAnchor } from '../domain/finance.interfaces';
import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

@Injectable()
export class LedgerHashAnchorDbRepository implements ILedgerHashAnchorRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient
  ) {}

  private get db(): Prisma.TransactionClient {
    return this.prisma;
  }

  async create(tenant_id: string, data: { anchorDate: Date, finalJournalHash: string }): Promise<LedgerHashAnchor> {
    const id = uuid();
    
    const saved = await this.db.finance_ledger_hash_anchors.create({
      data: {
        id,
        tenant_id,
        anchor_date: data.anchorDate,
        final_journal_hash: data.finalJournalHash,
      }
    });

    return this.mapEntity(saved);
  }

  async findLatest(tenant_id: string): Promise<LedgerHashAnchor | null> {
    const raw = await this.db.finance_ledger_hash_anchors.findFirst({
      where: { tenant_id },
      orderBy: { anchor_date: 'desc' }
    });

    if (!raw) return null;
    return this.mapEntity(raw);
  }

  async findByDate(tenant_id: string, date: Date): Promise<LedgerHashAnchor | null> {
    const raw = await this.db.finance_ledger_hash_anchors.findFirst({
      where: { 
        tenant_id,
        anchor_date: date
      }
    });

    if (!raw) return null;
    return this.mapEntity(raw);
  }

  private mapEntity(raw: any): LedgerHashAnchor {
    return {
      id: raw.id,
      tenant_id: raw.tenant_id,
      company_id: raw.tenant_id, // In this schema, tenant_id is the company container
      anchorDate: raw.anchor_date,
      finalJournalHash: raw.final_journal_hash,
      created_at: raw.created_at,
    };
  }
}
