import { AccountStatementProjection } from '../../domain/finance.interfaces';

export interface IAccountStatementProjectionRepository {
  append(data: Partial<AccountStatementProjection>): Promise<void>;
  reset(tenantId: string, companyId: string): Promise<void>;
  findStatement(tenantId: string, companyId: string, accountId: string, fromSeq: number, toSeq: number): Promise<AccountStatementProjection[]>;
  findByAccount(tenantId: string, companyId: string, accountId: string): Promise<AccountStatementProjection[]>;
}
