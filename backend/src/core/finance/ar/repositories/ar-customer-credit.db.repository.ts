import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../persistence/prisma.service';
import { IArCustomerCreditRepository } from './interfaces/ar-customer-credit.repository.interface';
import { ICustomerCreditBalance } from '../domain/ar.interfaces';

@Injectable()
export class ArCustomerCreditDbRepository implements IArCustomerCreditRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  private get db(): Prisma.TransactionClient {
    return this.prisma as Prisma.TransactionClient;
  }

  async findByCustomer(tenantId: string, companyId: string, customerId: string): Promise<ICustomerCreditBalance | null> {
    const res = await this.db.customerCreditBalance.findUnique({
      where: { 
        tenantId_customerId: { tenantId, customerId }
      }
    });
    return res as unknown as ICustomerCreditBalance;
  }

  async updateCreditBalance(tenantId: string, companyId: string, customerId: string, amount: Prisma.Decimal): Promise<void> {
    await this.db.customerCreditBalance.upsert({
      where: { 
        tenantId_customerId: { tenantId, customerId }
      },
      update: {
        balance: { increment: amount }
      },
      create: {
        tenantId,
        customerId,
        balance: amount,
      }
    });
  }

  async reset(tenantId: string, companyId: string): Promise<void> {
    await this.db.customerCreditBalance.deleteMany({
      where: { tenantId }
    });
  }
}
