import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IUnitOfWork } from './interfaces/uow.interface';
import { PrismaService } from '../../../persistence/prisma.service';

@Injectable()
export class DbUnitOfWork implements IUnitOfWork {
  private readonly logger = new Logger(DbUnitOfWork.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executes a callback within a managed RepeatableRead Prisma transaction.
   * Protects Ledger and AccountBalance updates from phantom reads.
   */
  async execute<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          return await operation(tx);
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
          maxWait: 5000,
          timeout: 10000,
        }
      );
    } catch (error) {
      this.logger.error(`DbUnitOfWork Transaction Failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
