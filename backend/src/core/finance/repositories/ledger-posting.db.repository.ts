import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../persistence/prisma.service';
import { ILedgerPostingRepository } from './interfaces/ledger-posting.repository.interface';
import { LedgerPosting, LedgerPostingLine } from '../domain/finance.interfaces';
import { LedgerPostingStatus } from '../domain/finance.constants';

@Injectable()
export class LedgerPostingDbRepository implements ILedgerPostingRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  private getDb(tx?: Prisma.TransactionClient): Prisma.TransactionClient {
    return tx || (this.prisma as Prisma.TransactionClient);
  }

  async createPosting(tenantId: string, companyId: string, data: Partial<LedgerPosting>, tx?: Prisma.TransactionClient): Promise<LedgerPosting> {
    const created = await this.getDb(tx).ledgerPosting.create({
      data: {
        tenantId,
        eventType: data.eventType || 'UNKNOWN',
        sourceEventId: data.sourceEventId || 'UNKNOWN',
        status: data.status || LedgerPostingStatus.PENDING,
        payload: data.payload || {},
      }
    });
    return created as unknown as LedgerPosting;
  }

  async createLines(postingId: string, lines: Partial<LedgerPostingLine>[], tx?: Prisma.TransactionClient): Promise<void> {
    await Promise.all(
      lines.map(line => 
        this.getDb(tx).ledgerPostingLine.create({
          data: {
            ledgerPostingId: postingId,
            accountId: line.accountId!,
            side: line.side!,
            amount: new Prisma.Decimal(line.amount!.toString()),
            currency: 'IDR', // Default
          }
        })
      )
    );
  }

  async updateStatus(tenantId: string, companyId: string, postingId: string, status: LedgerPostingStatus, retryCount?: number, failureReason?: string): Promise<LedgerPosting> {
    const updated = await this.db.ledgerPosting.update({
      where: { id: postingId },
      data: { 
        status: status as any,
        retryCount: retryCount,
        failureReason: failureReason,
      }
    });
    return updated as unknown as LedgerPosting;
  }

  async findById(tenantId: string, companyId: string, id: string): Promise<LedgerPosting | null> {
    const res = await this.db.ledgerPosting.findUnique({
      where: { id },
      include: { lines: true }
    });
    return res as unknown as LedgerPosting;
  }

  async findPending(tenantId: string, companyId?: string): Promise<LedgerPosting[]> {
    const list = await this.db.ledgerPosting.findMany({
      where: { tenantId, status: LedgerPostingStatus.PENDING }
    });
    return list as unknown as LedgerPosting[];
  }

  async claimPostings(tenantId: string, companyId: string, batchSize: number): Promise<LedgerPosting[]> {
    return await this.db.$transaction(async (tx) => {
      const candidates = await tx.ledgerPosting.findMany({
        where: { tenantId, status: LedgerPostingStatus.PENDING },
        take: batchSize,
        orderBy: { createdAt: 'asc' }
      });

      if (candidates.length === 0) return [];

      const ids = candidates.map(c => c.id);
      await tx.ledgerPosting.updateMany({
        where: { id: { in: ids }, status: LedgerPostingStatus.PENDING },
        data: { status: LedgerPostingStatus.PROCESSING }
      });

      return candidates.map(c => ({ 
        ...c, 
        status: LedgerPostingStatus.PROCESSING 
      })) as unknown as LedgerPosting[];
    });
  }

  async findLines(postingId: string): Promise<LedgerPostingLine[]> {
    const list = await this.db.ledgerPostingLine.findMany({
      where: { ledgerPostingId: postingId }
    });
    return list as unknown as LedgerPostingLine[];
  }

  async checkIdempotency(tenantId: string, companyId: string, sourceEventId: string, tx?: Prisma.TransactionClient): Promise<boolean> {
    const res = await this.getDb(tx).ledgerIdempotency.findFirst({
      where: { tenantId, companyId, sourceEventId }
    });
    return !!res;
  }

  async createIdempotency(tenantId: string, companyId: string, sourceEventId: string, tx?: Prisma.TransactionClient): Promise<void> {
    await this.getDb(tx).ledgerIdempotency.create({
      data: {
        tenantId,
        companyId,
        sourceEventId,
      }
    });
  }

  async getDeadLetterPostings(tenantId: string, companyId: string): Promise<LedgerPosting[]> {
    const list = await this.db.ledgerPosting.findMany({
      where: { tenantId, status: LedgerPostingStatus.FAILED }
    });
    return list as unknown as LedgerPosting[];
  }

  async findStuckProcessing(tenantId: string, companyId: string, threshold: Date): Promise<LedgerPosting[]> {
    const list = await this.db.ledgerPosting.findMany({
      where: { tenantId, status: LedgerPostingStatus.PROCESSING, updatedAt: { lt: threshold } }
    });
    return list as unknown as LedgerPosting[];
  }

  async findByStatus(tenantId: string, companyId: string, status: LedgerPostingStatus): Promise<LedgerPosting[]> {
    const list = await this.db.ledgerPosting.findMany({
      where: { tenantId, status: status as any }
    });
    return list as unknown as LedgerPosting[];
  }
}
