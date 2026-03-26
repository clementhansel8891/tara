import { PayrollRecord } from '../../domain/finance.interfaces';

export interface IPayrollRepository {
  findById(tenantId: string, companyId: string, id: string): Promise<PayrollRecord | null>;
  findAll(tenantId: string, companyId: string, period?: string): Promise<PayrollRecord[]>;
}
