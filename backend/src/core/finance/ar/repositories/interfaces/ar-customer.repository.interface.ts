import { IArCustomer } from '../../domain/ar.interfaces';

export interface IArCustomerRepository {
  findById(tenantId: string, companyId: string, id: string): Promise<IArCustomer | null>;
  findAll(tenantId: string, companyId: string): Promise<IArCustomer[]>;
  create(tenantId: string, companyId: string, data: any): Promise<IArCustomer>;
  update(tenantId: string, companyId: string, id: string, data: any): Promise<IArCustomer>;
}
