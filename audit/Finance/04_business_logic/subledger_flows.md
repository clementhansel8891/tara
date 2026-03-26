# Business Logic: Subledger Flows

## 1. Accounts Receivable (AR) Flow
The AR module acts as a specialized data entry point that feeds the General Ledger.

1. **Validation**: Before issuing an invoice, the system validates that a future/current fiscal period is open.
2. **Account Resolution**: The `AccountingMappingService` determines which GL accounts (e.g., Sales Revenue, Trade Receivables) to hit based on the product/service category.
3. **Subledger Persistence**: A `FinanceSubledgerEntry` is created to bridge the operational document (Invoice) and the financial impact.
4. **GL Synchronization**: The invoice is enqueued as an `AR_INVOICE_ISSUED` event to the `LedgerPostingService`.
5. **Immutability**: Once an invoice is `ISSUED`, direct edits are blocked. Reversals or Credit Memos must be used for corrections.

## 2. Integration Points
- **Inventory Integration**: Stock movements trigger `InventorySubledgerEntry` records which resolve COGS and Inventory Asset accounts.
- **Workflow Integration**: Large invoices (above `ExpensePolicy` thresholds) can be intercepted and held in `PENDING_APPROVAL` status before the subledger entry is "Sealed".

## 3. Consistency Mechanics
- **Source Module Stamping**: Every subledger entry is tagged with `sourceModule` (ACCOUNTS_RECEIVABLE, INVENTORY, etc.) to allow for easy reconciliation.
- **Reference Pairing**: Subledger entries maintain a 1:1 mapping to their operational IDs (`invoice.id`, `movement.id`), ensuring traceability during audits.
