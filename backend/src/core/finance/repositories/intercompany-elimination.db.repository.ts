import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { IIntercompanyEliminationRepository } from './interfaces/intercompany-elimination.repository.interface';
import { IntercompanyEliminationRule } from '../domain/finance.interfaces';
import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

@Injectable()
export class IntercompanyEliminationDbRepository implements IIntercompanyEliminationRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient
  ) {}

  private get db(): Prisma.TransactionClient {
    return this.prisma;
  }

  async listRules(tenant_id: string): Promise<IntercompanyEliminationRule[]> {
    const raws = await this.db.finance_intercompany_elimination_rules.findMany({
      where: { tenant_id }
    });
    return raws.map(r => this.mapEntity(r));
  }

  async findByCompanies(tenant_id: string, companyA: string, companyB: string): Promise<IntercompanyEliminationRule | null> {
    const raw = await this.db.finance_intercompany_elimination_rules.findFirst({
      where: { 
        tenant_id,
        company_a_id: companyA,
        company_b_id: companyB,
      }
    });
    if (!raw) return null;
    return this.mapEntity(raw);
  }

  async createRule(tenant_id: string, data: Partial<IntercompanyEliminationRule>): Promise<IntercompanyEliminationRule> {
    const id = uuid();
    const saved = await this.db.finance_intercompany_elimination_rules.create({
      data: {
        id,
        tenant_id,
        company_a_id: data.companyA!,
        company_b_id: data.companyB!,
        account_mapping: (data.accountMapping as any) || {},
        is_active: data.isActive !== false,
      }
    });
    return this.mapEntity(saved);
  }

  async updateRule(tenant_id: string, id: string, data: Partial<IntercompanyEliminationRule>): Promise<IntercompanyEliminationRule> {
    const saved = await this.db.finance_intercompany_elimination_rules.update({
      where: { id },
      data: {
        account_mapping: data.accountMapping as any,
        is_active: data.isActive,
        updated_at: new Date(),
      }
    });
    return this.mapEntity(saved);
  }

  async deleteRule(tenant_id: string, id: string): Promise<void> {
    await this.db.finance_intercompany_elimination_rules.delete({
      where: { id }
    });
  }

  private mapEntity(raw: any): IntercompanyEliminationRule {
    return {
      id: raw.id,
      tenant_id: raw.tenant_id,
      companyA: raw.company_a_id,
      companyB: raw.company_b_id,
      accountMapping: raw.account_mapping as Record<string, string>,
      isActive: raw.is_active,
      updated_at: raw.updated_at,
    };
  }
}
