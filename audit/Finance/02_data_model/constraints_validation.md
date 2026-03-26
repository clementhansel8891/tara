# Finance Constraints Validation

## 1. Uniqueness Constraints

| Model | Constraint | Audit Result | Status |
| --- | --- | --- | --- |
| `JournalEntry` | `@@unique([tenantId, ref])` | Prevents duplicate reference numbers within a tenant. | ✅ PASS |
| `ArInvoice` | `@@unique([tenantId, invoiceNumber])` | Prevents duplicate invoice numbers. | ✅ PASS |
| `ChartOfAccount` | `@@unique([tenantId, code])` | Ensures unique account codes per tenant. | ✅ PASS |
| `LedgerIdempotency`| `@@unique([tenantId, sourceEventId])`| Critical for preventing double-posting of events. | ✅ PASS |
| `AccountBalance` | `@@unique([tenantId, ...dimensions])` | Ensures a single balance record per combination of dimensions (Dept, Loc, Project). | ✅ PASS |

## 2. Integrity Constraints (Database Level)

- **Foreign Keys**: All line items (`JournalLine`, `ArInvoiceLine`) are constrained to their headers via `fields: [id], references: [id]`.
- **Deletion Rules**: Most relations lack explicit `onDelete` actions in the current schema. 
    - *Risk*: Deleting a `JournalEntry` might leave orphaned `JournalLine` records if not handled by the application or DB constraints.
- **Precision**: 
    - Standard Currency: `Decimal(19, 4)` for ledger and high-precision fields.
    - Transaction Totals: `Decimal(15, 2)` for external-facing models (e.g., `Payable`, `FixedAsset`). 
    - *Audit Note*: Minor inconsistency between `LedgerPostingLine` (19,4) and `ArInvoiceLine` (19,4) vs `ArInvoice` (19,4) - wait, these are consistent. But `Payable` uses (15,2). This might lead to rounding differences during reconciliation.

## 3. Mandatory Fields
- `tenantId` is NOT nullable in core models.
- `fiscalPeriodId` is required for `JournalEntry` and `AccountBalance`, ensuring all data is bounded by time.
