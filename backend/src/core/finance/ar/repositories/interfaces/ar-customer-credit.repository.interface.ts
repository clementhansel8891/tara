import { ICustomerCreditBalance } from '../../domain/ar.interfaces';
import { Prisma } from '@prisma/client';

export interface IArCustomerCreditRepository {
  updateCreditBalance(tenantId: string, companyId: string, customerId: string, amount: Prisma.Decimal): Promise<void>;
  findByCustomer(tenantId: string, companyId: string, customerId: string): Promise<ICustomerCreditBalance | null>;
}
