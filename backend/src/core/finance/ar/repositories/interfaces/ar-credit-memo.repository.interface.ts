import { IArCreditMemo } from '../../domain/ar.interfaces';

export interface IArCreditMemoRepository {
  create(tenantId: string, companyId: string, data: any): Promise<IArCreditMemo>;
  findAll(tenantId: string, companyId: string, customerId?: string): Promise<IArCreditMemo[]>;
}
