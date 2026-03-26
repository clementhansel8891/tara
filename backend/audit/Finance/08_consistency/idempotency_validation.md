# Idempotency Validation Report

## 1. Global Replay Protection
The Finance module enforces idempotency at multiple layers:

| Layer | Implementation | Mechanism | Result |
|-------|----------------|-----------|--------|
| **Core Ledger** | `LedgerIdempotency` table | `sourceEventId` Unique | Duplicate events are rejected before processing |
| **AR Subledger**| `idempotencyKey` on Invoices/Payments | DB Unique Constraint | Front-end retries do not create duplicate records |
| **Bank Reconciliation**| `BankTransaction.reference` | Uniqueness Check | Prevents double-reconciliation |

## 2. Event Ingestion Safety
- **Logic**: `LedgerPostingService.enqueuePosting` checks `ledgerRepo.checkIdempotency`.
- **Finding**: There is a small race window between `checkIdempotency` and `createIdempotency`.
- **Verdict**: **SAFE** (The DB unique constraint on `(tenantId, companyId, sourceEventId)` will ultimately fail the second insert, preventing actual duplicate state).

## 3. Subledger-to-Ledger Consistency
- **Observation**: `ArInvoiceService` uses `ar-invoice-${invoice.id}` as the `sourceEventId` for the ledger.
- **Audit Findings**:
    - Ensures 1:1 mapping between subledger action and ledger entry.
    - Guaranteed by Ledger's ID-based idempotency.
- **Verdict**: **PASSED**.
