import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IArCustomerRepository } from '../repositories/interfaces/ar-customer.repository.interface';
import { CreateCustomerDto } from '../dto/ar.dto';
import { IArCustomer } from '../domain/ar.interfaces';

@Injectable()
export class ArCustomerService {
  constructor(
    @Inject('IArCustomerRepository')
    private readonly customerRepo: IArCustomerRepository,
  ) {}

  async createCustomer(tenantId: string, companyId: string, dto: CreateCustomerDto): Promise<IArCustomer> {
    return this.customerRepo.create(tenantId, companyId, dto);
  }

  async getCustomer(tenantId: string, companyId: string, id: string): Promise<IArCustomer> {
    const customer = await this.customerRepo.findById(tenantId, companyId, id);
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async listCustomers(tenantId: string, companyId: string): Promise<IArCustomer[]> {
    return this.customerRepo.findAll(tenantId, companyId);
  }
}
