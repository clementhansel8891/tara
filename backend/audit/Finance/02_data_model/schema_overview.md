# Finance Schema Overview

## 1. Governance & Precision
The Zenvix Finance module utilizes a high-precision schema designed for immutable ledgering and multi-tenant isolation.

| Aspect | Implementation | Audit Verdict |
|--------|----------------|---------------|
| **Multi-Tenancy** | `tenantId` (UUID) on every table | **PASSED** (Strict Isolation) |
| **Monetary Precision** | `Decimal(19, 4)` for ledger; `Decimal(15, 2)` for operational | **CAUTION** (Risk of rounding mismatch) |
| **Audit Readiness** | `previousHash`, `entryHash` on Journal Entries | **PASSED** (Hash Chaining Detected) |
| **Idempotency** | Dedicated `LedgerIdempotency` and `sourceEventId` | **PASSED** (Replay Protection) |

## 2. Core ERD Logic
The schema follows a hierarchical flow:
1. **Company (Tenant)**: Root container.
2. **Chart of Accounts (COA)**: Defines the financial structure.
3. **Fiscal Period**: Temporal boundary for closing cycles.
4. **Journal Entry**: Atomic grouping of balanced transactions.
5. **Journal Line**: Individual debits and credits on specific accounts.
6. **Account Balance**: Cached aggregate for real-time reporting.

## 3. Subledger Integration
- **Accounts Receivable (AR)**: Linked via `ArInvoice` and `ArPayment`.
- **Inventory/Costing**: Linked via `CostLayer` and `InventorySubledgerEntry`.
- **Asset Management**: Linked via `FixedAsset` and `DepreciationEntry`.

## 4. Key Security Constraints
- **Unique Constraints**: enforced on `JournalEntry.ref` and `ArInvoice.invoiceNumber`.
- **Referential Integrity**: Cascade deletes are used cautiously; most financial data uses soft deletes or strict references.
