import { Injectable } from '@nestjs/common';
import { IArCreditMemoRepository } from './interfaces/ar-credit-memo.repository.interface';
import { IArCreditMemo } from '../domain/ar.interfaces';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ArCreditMemoMockRepository implements IArCreditMemoRepository {
  private creditMemos: IArCreditMemo[] = [];

  async create(tenantId: string, companyId: string, data: any): Promise<IArCreditMemo> {
    const creditMemo: IArCreditMemo = {
      id: uuid(),
      tenantId,
      companyId,
      customerId: data.customerId,
      creditAmount: data.creditAmount,
      reason: data.reason,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.creditMemos.push(creditMemo);
    return creditMemo;
  }

  async findAll(tenantId: string, companyId: string, customerId?: string): Promise<IArCreditMemo[]> {
    return this.creditMemos.filter(c => c.tenantId === tenantId && c.companyId === companyId && (!customerId || c.customerId === customerId));
  }
}
