import { Injectable } from '@nestjs/common';
import { IArCustomerRepository } from './interfaces/ar-customer.repository.interface';
import { IArCustomer } from '../domain/ar.interfaces';
import { ArCustomerStatus } from '../domain/ar.constants';
import { v4 as uuid } from 'uuid';
import { Prisma } from '@prisma/client';

@Injectable()
export class ArCustomerMockRepository implements IArCustomerRepository {
  private customers: IArCustomer[] = [];

  async findById(tenantId: string, companyId: string, id: string): Promise<IArCustomer | null> {
    return this.customers.find(c => c.tenantId === tenantId && c.companyId === companyId && c.id === id) || null;
  }

  async findAll(tenantId: string, companyId: string): Promise<IArCustomer[]> {
    return this.customers.filter(c => c.tenantId === tenantId && c.companyId === companyId);
  }

  async create(tenantId: string, companyId: string, data: any): Promise<IArCustomer> {
    const customer: IArCustomer = {
      id: uuid(),
      tenantId,
      companyId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      creditLimit: new Prisma.Decimal(data.creditLimit || 0),
      currentBalance: new Prisma.Decimal(0),
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.customers.push(customer);
    return customer;
  }

  async update(tenantId: string, companyId: string, id: string, data: any): Promise<IArCustomer> {
    const customer = await this.findById(tenantId, companyId, id);
    if (!customer) throw new Error('Customer not found');
    
    Object.assign(customer, data);
    customer.updatedAt = new Date();
    return customer;
  }
}
