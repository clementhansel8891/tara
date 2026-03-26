import { Prisma } from '@prisma/client';

export interface IUnitOfWork {
  execute<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T>;
}
