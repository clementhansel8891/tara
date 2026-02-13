/**
 * Ledger Entry Entity
 * Represents a single entry in the financial ledger
 */
export class LedgerEntry {
  id: string;
  tenantId: string;
  locationId?: string;
  amount: number;
  type: 'debit' | 'credit';
  description: string;
  timestamp: Date;
  balance: number; // Running balance after this transaction
  category?: string;
  referenceId?: string; // Link to related transaction/invoice
}
