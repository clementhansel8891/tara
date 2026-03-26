import { GeneralLedgerProjection } from '../../domain/finance.interfaces';
import { Prisma } from '@prisma/client';

export interface IGeneralLedgerProjectionRepository {
  append(data: Partial<GeneralLedgerProjection>): Promise<void>;
  reset(tenantId: string, companyId: string): Promise<void>;
  findHistory(tenantId: string, companyId: string, accountId: string, fromSeq: number, toSeq: number): Promise<GeneralLedgerProjection[]>;
  getLatestRunningBalance(tenantId: string, companyId: string, accountId: string): Promise<Prisma.Decimal>;
}
