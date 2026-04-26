import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { ILedgerEventLogArchiveRepository } from './interfaces/ledger-event-log-archive.repository.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class LedgerEventLogArchiveDbRepository implements ILedgerEventLogArchiveRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient
  ) {}

  private get db(): Prisma.TransactionClient {
    return this.prisma;
  }

  async createArchiveEntries(events: any[]): Promise<void> {
    const data = events.map(event => ({
      id: event.id,
      tenant_id: event.tenant_id,
      company_id: event.company_id || 'GLOBAL',
      event_type: event.eventType,
      source_event_id: event.sourceEventId,
      payload: event.payload as any,
      sequence_key: event.sequenceKey,
      sequence_number: event.sequenceNumber ? BigInt(event.sequenceNumber) : null,
      created_at: event.created_at,
      processed_at: event.processed_at,
      status: event.status || 'ARCHIVED',
    }));

    await this.db.finance_ledger_event_log_archive.createMany({
      data,
      skipDuplicates: true,
    });
  }
}
