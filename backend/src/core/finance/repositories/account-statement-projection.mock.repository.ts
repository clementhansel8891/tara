import { Injectable } from '@nestjs/common';
import { AccountStatementProjection } from '../domain/finance.interfaces';

@Injectable()
export class AccountStatementProjectionMockRepository {
  private projections: AccountStatementProjection[] = [];

  async save(projection: AccountStatementProjection): Promise<void> {
    this.projections.push(projection);
  }

  async findByAccount(tenantId: string, companyId: string, accountId: string): Promise<AccountStatementProjection[]> {
    return this.projections.filter(p => p.tenantId === tenantId && p.accountId === accountId);
  }
}
