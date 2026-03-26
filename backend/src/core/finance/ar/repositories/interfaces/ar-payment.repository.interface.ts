import { IArPayment, IArPaymentAllocation } from '../../domain/ar.interfaces';

export interface IArPaymentRepository {
  findById(tenantId: string, companyId: string, id: string): Promise<IArPayment | null>;
  findByIdempotencyKey(tenantId: string, companyId: string, key: string): Promise<IArPayment | null>;
  create(tenantId: string, companyId: string, data: any): Promise<IArPayment>;
  createAllocation(tenantId: string, companyId: string, data: any): Promise<IArPaymentAllocation>;
  findAllocationByIdempotencyKey(tenantId: string, companyId: string, key: string): Promise<IArPaymentAllocation | null>;
  findAllocationsByInvoice(tenantId: string, companyId: string, invoiceId: string): Promise<IArPaymentAllocation[]>;
  findAllocationsByPayment(tenantId: string, companyId: string, paymentId: string): Promise<IArPaymentAllocation[]>;
}
