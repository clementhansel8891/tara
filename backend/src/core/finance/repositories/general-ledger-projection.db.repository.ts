import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { IGeneralLedgerProjectionRepository } from './interfaces/general-ledger-projection.repository.interface';
import { GeneralLedgerProjection } from '../domain/finance.interfaces';
import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

@Injectable()
export class GeneralLedgerProjectionDbRepository implements IGeneralLedgerProjectionRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient
  ) {}

  private get db(): Prisma.TransactionClient {
    return this.prisma;
  }

  async append(data: Partial<GeneralLedgerProjection>): Promise<void> {
    await this.db.finance_general_ledger_projections.create({
      data: {
        id: uuid(),
        tenant_id: data.tenant_id!,
        company_id: data.company_id!,
        account_id: data.accountId!,
        transaction_id: data.journalId!,
        posting_date: data.created_at || new Date(),
        description: '',
        debit: data.debit!,
        credit: data.credit!,
        running_balance: data.balance!,
      }
    });
  }

  async findHistory(
    tenant_id: string, 
    company_id: string, 
    accountId: string, 
    fromSeq: number, 
    toSeq: number
  ): Promise<GeneralLedgerProjection[]> {
    // Note: If no sequence is in DB, we could fallback to dates or add sequence.
    // For now, mapping to findMany with ordering.
    const raws = await this.db.finance_general_ledger_projections.findMany({
      where: {
        tenant_id,
        company_id,
        account_id: accountId,
      },
      orderBy: { posting_date: 'asc' }
    });

    return raws.map(r => this.mapEntity(r));
  }

  async getLatestRunningBalance(tenant_id: string, company_id: string, accountId: string): Promise<Prisma.Decimal> {
    const latest = await this.db.finance_general_ledger_projections.findFirst({
      where: { tenant_id, company_id, account_id: accountId },
      orderBy: { posting_date: 'desc' }
    });
    return latest ? latest.running_balance : new Prisma.Decimal(0);
  }

  async reset(tenant_id: string, company_id: string): Promise<void> {
    await this.db.finance_general_ledger_projections.deleteMany({
      where: { tenant_id, company_id }
    });
  }

  private mapEntity(raw: any): GeneralLedgerProjection {
    return {
      id: raw.id,
      tenant_id: raw.tenant_id,
      company_id: raw.company_id,
      accountId: raw.account_id,
      journalId: raw.transaction_id,
      ledgerSequence: 0, 
      debit: raw.debit,
      credit: raw.credit,
      balance: raw.running_balance,
      created_at: raw.created_at,
    };
  }
}
