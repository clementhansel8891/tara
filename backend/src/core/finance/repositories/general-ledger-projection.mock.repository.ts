import { Injectable } from '@nestjs/common';
import { GeneralLedgerProjection } from '../domain/finance.interfaces';

@Injectable()
export class GeneralLedgerProjectionMockRepository {
  private projections: GeneralLedgerProjection[] = [];

  async save(projection: GeneralLedgerProjection): Promise<void> {
    this.projections.push(projection);
  }

  async findByAccount(tenantId: string, companyId: string, accountId: string): Promise<GeneralLedgerProjection[]> {
    return this.projections.filter(p => p.tenantId === tenantId && p.accountId === accountId);
  }
}
