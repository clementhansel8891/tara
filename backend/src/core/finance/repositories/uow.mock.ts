import { Injectable } from '@nestjs/common';
import { IUnitOfWork } from './interfaces/uow.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class MockUnitOfWork implements IUnitOfWork {
  async execute<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    // In a real implementation (e.g. Prisma), this wraps the operation in a db transaction.
    // For mock mode, we just execute the callback.
    return await operation({} as Prisma.TransactionClient);
  }
}
