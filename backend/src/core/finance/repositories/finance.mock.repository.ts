import { Injectable } from '@nestjs/common';
import { IFinanceRepository } from './finance.repository.interface';
import { LedgerEntry } from '../entities/ledger-entry.entity';
import { Transaction } from '../entities/transaction.entity';
import { Balance } from '../entities/balance.entity';
import { CreateTransactionDto } from '../dto/create-transaction.dto';

/**
 * Finance Mock Repository
 * In-memory implementation for DEV_MOCK_MODE
 * Simulates multi-tenant data isolation with realistic mock data
 */
@Injectable()
export class FinanceMockRepository extends IFinanceRepository {
  private ledgerEntries: LedgerEntry[] = [];
  private transactions: Transaction[] = [];

  constructor() {
    super();
    this.initializeMockData();
  }

  /**
   * Initialize mock data for two tenants
   */
  private initializeMockData(): void {
    // Tenant 001: Tech Startup
    this.createMockLedgerEntries('tenant-001', 'location-001', [
      { amount: 50000, type: 'credit', description: 'Initial capital investment', category: 'Investment' },
      { amount: 15000, type: 'debit', description: 'Office equipment purchase', category: 'Equipment' },
      { amount: 8500, type: 'debit', description: 'Monthly payroll - January', category: 'Payroll' },
      { amount: 25000, type: 'credit', description: 'Client payment - Project Alpha', category: 'Revenue' },
      { amount: 3200, type: 'debit', description: 'Cloud infrastructure costs', category: 'Operating Expenses' },
      { amount: 12000, type: 'credit', description: 'Client payment - Project Beta', category: 'Revenue' },
    ]);

    // Tenant 002: Retail Chain
    this.createMockLedgerEntries('tenant-002', 'location-002', [
      { amount: 100000, type: 'credit', description: 'Initial franchise investment', category: 'Investment' },
      { amount: 45000, type: 'debit', description: 'Inventory purchase - Q1', category: 'Inventory' },
      { amount: 12000, type: 'debit', description: 'Store rent - January', category: 'Rent' },
      { amount: 38000, type: 'credit', description: 'Sales revenue - Week 1', category: 'Revenue' },
      { amount: 42000, type: 'credit', description: 'Sales revenue - Week 2', category: 'Revenue' },
      { amount: 18000, type: 'debit', description: 'Staff salaries - January', category: 'Payroll' },
      { amount: 5500, type: 'debit', description: 'Marketing campaign', category: 'Marketing' },
    ]);

    // Add some location-specific entries for tenant-002
    this.createMockLedgerEntries('tenant-002', 'location-003', [
      { amount: 35000, type: 'credit', description: 'Sales revenue - Store 2', category: 'Revenue' },
      { amount: 8000, type: 'debit', description: 'Store 2 - Utilities', category: 'Operating Expenses' },
    ]);
  }

  /**
   * Helper to create mock ledger entries
   */
  private createMockLedgerEntries(
    tenantId: string,
    locationId: string,
    entries: Array<{ amount: number; type: 'debit' | 'credit'; description: string; category: string }>,
  ): void {
    let runningBalance = 0;
    const baseDate = new Date('2026-01-01');

    entries.forEach((entry, index) => {
      if (entry.type === 'credit') {
        runningBalance += entry.amount;
      } else {
        runningBalance -= entry.amount;
      }

      const ledgerEntry: LedgerEntry = {
        id: `${tenantId}-ledger-${this.ledgerEntries.length + 1}`,
        tenantId,
        locationId,
        amount: entry.amount,
        type: entry.type,
        description: entry.description,
        category: entry.category,
        timestamp: new Date(baseDate.getTime() + index * 86400000 * 3), // 3 days apart
        balance: runningBalance,
        referenceId: `ref-${tenantId}-${index}`,
      };

      this.ledgerEntries.push(ledgerEntry);

      // Also create corresponding transaction
      const transaction: Transaction = {
        id: `${tenantId}-txn-${this.transactions.length + 1}`,
        tenantId,
        locationId,
        amount: entry.amount,
        type: entry.type,
        description: entry.description,
        category: entry.category,
        createdAt: ledgerEntry.timestamp,
        status: entry.amount > 5000 ? 'approved' : 'approved', // All mock data is pre-approved
        createdBy: 'system',
        approvedBy: entry.amount > 5000 ? 'cfo-user' : undefined,
        approvedAt: entry.amount > 5000 ? ledgerEntry.timestamp : undefined,
      };

      this.transactions.push(transaction);
    });
  }

  /**
   * Get ledger entries for a tenant
   * Enforces tenant isolation
   */
  async getLedger(tenantId: string, locationId?: string): Promise<LedgerEntry[]> {
    let entries = this.ledgerEntries.filter((entry) => entry.tenantId === tenantId);

    if (locationId) {
      entries = entries.filter((entry) => entry.locationId === locationId);
    }

    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Create a new transaction
   * Enforces tenant isolation
   */
  async createTransaction(tenantId: string, data: CreateTransactionDto): Promise<Transaction> {
    const transactionId = `${tenantId}-txn-${this.transactions.length + 1}`;
    const now = new Date();

    // Determine if transaction needs approval (threshold gate: $5000)
    const needsApproval = data.amount > 5000;

    const transaction: Transaction = {
      id: transactionId,
      tenantId,
      locationId: data.locationId,
      amount: data.amount,
      type: data.type,
      description: data.description,
      category: data.category,
      createdAt: now,
      createdBy: data.createdBy || 'system',
      status: needsApproval ? 'pending' : 'approved',
      approvedBy: needsApproval ? undefined : 'auto-approved',
      approvedAt: needsApproval ? undefined : now,
    };

    this.transactions.push(transaction);

    // If auto-approved, also create ledger entry
    if (!needsApproval) {
      await this.createLedgerEntry(tenantId, transaction);
    }

    return transaction;
  }

  /**
   * Helper to create ledger entry from transaction
   */
  private async createLedgerEntry(tenantId: string, transaction: Transaction): Promise<void> {
    // Calculate new balance
    const currentBalance = await this.getBalance(tenantId);
    let newBalance = currentBalance.totalBalance;

    if (transaction.type === 'credit') {
      newBalance += transaction.amount;
    } else {
      newBalance -= transaction.amount;
    }

    const ledgerEntry: LedgerEntry = {
      id: `${tenantId}-ledger-${this.ledgerEntries.length + 1}`,
      tenantId,
      locationId: transaction.locationId,
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.description,
      category: transaction.category,
      timestamp: new Date(),
      balance: newBalance,
      referenceId: transaction.id,
    };

    this.ledgerEntries.push(ledgerEntry);
  }

  /**
   * Get current balance for a tenant
   * Enforces tenant isolation
   */
  async getBalance(tenantId: string): Promise<Balance> {
    const tenantLedger = this.ledgerEntries.filter((entry) => entry.tenantId === tenantId);

    if (tenantLedger.length === 0) {
      return {
        tenantId,
        totalBalance: 0,
        currency: 'USD',
        lastUpdated: new Date(),
        totalDebits: 0,
        totalCredits: 0,
        transactionCount: 0,
      };
    }

    // Get the latest balance from the most recent ledger entry
    const sortedLedger = tenantLedger.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const latestEntry = sortedLedger[0];

    // Calculate totals
    const totalDebits = tenantLedger
      .filter((e) => e.type === 'debit')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalCredits = tenantLedger
      .filter((e) => e.type === 'credit')
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      tenantId,
      totalBalance: latestEntry.balance,
      currency: 'USD',
      lastUpdated: latestEntry.timestamp,
      totalDebits,
      totalCredits,
      transactionCount: tenantLedger.length,
    };
  }

  /**
   * Get a specific transaction by ID
   * Enforces tenant isolation
   */
  async getTransactionById(tenantId: string, transactionId: string): Promise<Transaction | null> {
    const transaction = this.transactions.find(
      (txn) => txn.id === transactionId && txn.tenantId === tenantId,
    );

    return transaction || null;
  }
}
