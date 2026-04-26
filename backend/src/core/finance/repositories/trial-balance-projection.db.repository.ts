import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { ITrialBalanceProjectionRepository } from './interfaces/trial-balance-projection.repository.interface';
import { TrialBalanceProjection } from '../domain/finance.interfaces';
import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

@Injectable()
export class TrialBalanceProjectionDbRepository implements ITrialBalanceProjectionRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient
  ) {}

  private get db(): Prisma.TransactionClient {
    return this.prisma;
  }

  async update(
    tenant_id: string, 
    company_id: string,
    accountId: string, 
    fiscalPeriodId: string, 
    accountCategory: string,
    debit: Prisma.Decimal, 
    credit: Prisma.Decimal
  ): Promise<void> {
    const uniqueKey = {
      tenant_id_company_id_fiscal_period_account_id: {
        tenant_id,
        company_id,
        fiscal_period: fiscalPeriodId,
        account_id: accountId,
      }
    };

    await this.db.finance_trial_balance_projections.upsert({
      where: uniqueKey as any,
      update: {
        debit_total: { increment: debit },
        credit_total: { increment: credit },
        closing_balance: { increment: new Prisma.Decimal(debit).minus(credit) },
        last_updated: new Date(),
      },
      create: {
        id: uuid(),
        tenant_id,
        company_id,
        fiscal_period: fiscalPeriodId,
        account_id: accountId,
        opening_balance: 0,
        debit_total: debit,
        credit_total: credit,
        closing_balance: new Prisma.Decimal(debit).minus(credit),
        last_updated: new Date(),
      }
    });
  }

  async reset(tenant_id: string, company_id: string): Promise<void> {
    await this.db.finance_trial_balance_projections.deleteMany({
      where: { tenant_id, company_id }
    });
  }

  async getBalance(tenant_id: string, company_id: string, accountId: string, fiscalPeriodId: string): Promise<TrialBalanceProjection | null> {
    const raw = await this.db.finance_trial_balance_projections.findFirst({
      where: { 
        tenant_id, 
        company_id, 
        account_id: accountId, 
        fiscal_period: fiscalPeriodId 
      }
    });

    if (!raw) return null;
    return this.mapEntity(raw);
  }

  async findAll(tenant_id: string, company_id: string, fiscalPeriodId?: string, options?: any): Promise<TrialBalanceProjection[]> {
    const raws = await this.db.finance_trial_balance_projections.findMany({
      where: { 
        tenant_id, 
        company_id,
        ...(fiscalPeriodId ? { fiscal_period: fiscalPeriodId } : {})
      },
      orderBy: { account_id: 'asc' }
    });

    return raws.map(r => this.mapEntity(r));
  }

  private mapEntity(raw: any): TrialBalanceProjection {
    return {
      id: raw.id,
      tenant_id: raw.tenant_id,
      company_id: raw.company_id,
      accountId: raw.account_id,
      account_name: '', // Would need a join to CoA for this
      fiscalPeriodId: raw.fiscal_period,
      accountCategory: '', // Would need a join
      debitTotal: raw.debit_total,
      creditTotal: raw.credit_total,
      snapshotSequence: 0,
      lastUpdatedAt: raw.last_updated,
    };
  }
}
