import { Injectable } from '@nestjs/common';
import { ICustomerCreditBalance } from '../domain/ar.interfaces';
import { IArCustomerCreditRepository } from './interfaces/ar-customer-credit.repository.interface';
import { v4 as uuid } from 'uuid';
import { Prisma } from '@prisma/client';

@Injectable()
export class ArCustomerCreditMockRepository implements IArCustomerCreditRepository {
  private balances: ICustomerCreditBalance[] = [];

  async updateCreditBalance(tenantId: string, companyId: string, customerId: string, amount: Prisma.Decimal): Promise<void> {
    const existing = this.balances.find(b => b.tenantId === tenantId && b.companyId === companyId && b.customerId === customerId);
    if (existing) {
      existing.balance = existing.balance.plus(amount);
      existing.updatedAt = new Date();
    } else {
      this.balances.push({
        id: uuid(),
        tenantId,
        companyId,
        customerId,
        balance: new Prisma.Decimal(amount),
        updatedAt: new Date(),
      });
    }
  }

  async findByCustomer(tenantId: string, companyId: string, customerId: string): Promise<ICustomerCreditBalance | null> {
    return this.balances.find(b => b.tenantId === tenantId && b.companyId === companyId && b.customerId === customerId) || null;
  }
}
