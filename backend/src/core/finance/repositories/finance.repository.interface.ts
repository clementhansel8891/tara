import { LedgerEntry } from '../entities/ledger-entry.entity';
import { Transaction } from '../entities/transaction.entity';
import { Balance } from '../entities/balance.entity';
import { CreateTransactionDto } from '../dto/create-transaction.dto';

/**
 * Finance Repository Interface
 * Abstract class defining the contract for finance data persistence
 * Using abstract class instead of interface for NestJS DI compatibility
 * 
 * CRITICAL: All methods MUST accept tenantId as the first argument
 * to enforce multi-tenancy at the data layer
 */
export abstract class IFinanceRepository {
  /**
   * Get ledger entries for a tenant
   * @param tenantId - Company ID (required for multi-tenancy)
   * @param locationId - Optional location filter
   */
  abstract getLedger(tenantId: string, locationId?: string): Promise<LedgerEntry[]>;

  /**
   * Create a new transaction
   * @param tenantId - Company ID (required for multi-tenancy)
   * @param data - Transaction data
   */
  abstract createTransaction(
    tenantId: string,
    data: CreateTransactionDto,
  ): Promise<Transaction>;

  /**
   * Get current balance for a tenant
   * @param tenantId - Company ID (required for multi-tenancy)
   */
  abstract getBalance(tenantId: string): Promise<Balance>;

  /**
   * Get a specific transaction by ID
   * @param tenantId - Company ID (required for multi-tenancy)
   * @param transactionId - Transaction ID
   */
  abstract getTransactionById(
    tenantId: string,
    transactionId: string,
  ): Promise<Transaction | null>;
}
