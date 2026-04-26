import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { IAccountStatementProjectionRepository } from './interfaces/account-statement-projection.repository.interface';
import { AccountStatementProjection } from '../domain/finance.interfaces';
import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AccountStatementProjectionDbRepository implements IAccountStatementProjectionRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  private get db(): Prisma.TransactionClient {
    return this.prisma;
  }

  async append(data: Partial<AccountStatementProjection>): Promise<void> {
    await this.db.finance_account_statement_projections.create({
      data: {
        id: uuid(),
        tenant_id: data.tenant_id!,
        company_id: data.company_id!,
        account_id: data.accountId!,
        period_start: data.created_at || new Date(),
        period_end: data.created_at || new Date(),
        data: {
          journalId: data.journalId,
          description: data.description,
          debit: data.debit,
          credit: data.credit,
          balance: data.balance,
          ledgerSequence: data.ledgerSequence,
        } as any,
        generated_at: data.created_at || new Date(),
      }
    });
  }

  async findStatement(
    tenant_id: string, 
    company_id: string, 
    accountId: string, 
    fromSeq: number, 
    toSeq: number
  ): Promise<AccountStatementProjection[]> {
    // Note: The schema doesn't have ledgerSequence as a top-level field, 
    // but it's inside the 'data' JSON. For performance, we might need to add it.
    // For now, we fetch by date range if possible or filter in memory if small.
    // However, the interface specifies fromSeq/toSeq.
    
    const raws = await this.db.finance_account_statement_projections.findMany({
      where: {
        tenant_id,
        company_id,
        account_id: accountId,
      },
      orderBy: { generated_at: 'asc' }
    });

    return raws
      .map(r => this.mapEntity(r))
      .filter(p => p.ledgerSequence >= fromSeq && p.ledgerSequence <= toSeq);
  }

  async findByAccount(tenant_id: string, company_id: string, accountId: string): Promise<AccountStatementProjection[]> {
    const raws = await this.db.finance_account_statement_projections.findMany({
      where: {
        tenant_id,
        company_id,
        account_id: accountId,
      },
      orderBy: { generated_at: 'desc' }
    });

    return raws.map(r => this.mapEntity(r));
  }

  async reset(tenant_id: string, company_id: string): Promise<void> {
    await this.db.finance_account_statement_projections.deleteMany({
      where: { tenant_id, company_id }
    });
  }

  private mapEntity(raw: any): AccountStatementProjection {
    const data = raw.data as any;
    return {
      id: raw.id,
      tenant_id: raw.tenant_id,
      company_id: raw.company_id,
      accountId: raw.account_id,
      ledgerSequence: data.ledgerSequence || 0,
      journalId: data.journalId || '',
      description: data.description || '',
      debit: new Prisma.Decimal(data.debit || 0),
      credit: new Prisma.Decimal(data.credit || 0),
      balance: new Prisma.Decimal(data.balance || 0),
      created_at: raw.generated_at,
    };
  }
}
