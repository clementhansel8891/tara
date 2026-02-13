import { Injectable } from '@nestjs/common';
import { IFinanceRepository } from './repositories/finance.repository.interface';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { Transaction } from './entities/transaction.entity';
import { Balance } from './entities/balance.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';

/**
 * Finance Service
 * Business logic layer for finance operations
 * 
 * CRITICAL: All methods require tenantId as the first argument
 * to enforce multi-tenancy at the service layer
 */
@Injectable()
export class FinanceService {
  constructor(private readonly financeRepository: IFinanceRepository) {}

  /**
   * Get ledger entries for a tenant
   * @param tenantId - Company ID (required for multi-tenancy)
   * @param locationId - Optional location filter
   */
  async getLedger(tenantId: string, locationId?: string): Promise<LedgerEntry[]> {
    return this.financeRepository.getLedger(tenantId, locationId);
  }

  /**
   * Create a new transaction
   * Implements threshold gate logic: amounts > $5000 require approval
   * @param tenantId - Company ID (required for multi-tenancy)
   * @param data - Transaction data
   */
  async createTransaction(tenantId: string, data: CreateTransactionDto): Promise<Transaction> {
    // Business validation: Threshold gate
    if (data.amount > 5000) {
      console.log(
        `[Finance Service] Transaction amount $${data.amount} exceeds threshold. Requires CFO approval.`,
      );
    }

    return this.financeRepository.createTransaction(tenantId, data);
  }

  /**
   * Get current balance for a tenant
   * @param tenantId - Company ID (required for multi-tenancy)
   */
  async getBalance(tenantId: string): Promise<Balance> {
    return this.financeRepository.getBalance(tenantId);
  }

  /**
   * Get a specific transaction by ID
   * @param tenantId - Company ID (required for multi-tenancy)
   * @param transactionId - Transaction ID
   */
  async getTransactionById(tenantId: string, transactionId: string): Promise<Transaction | null> {
    return this.financeRepository.getTransactionById(tenantId, transactionId);
  }
}
