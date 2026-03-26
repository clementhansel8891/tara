# Finance Schema Analysis

## 1. Core Ledger Entities

| Model | Purpose | Key Fields |
| --- | --- | --- |
| `JournalEntry` | Header for a financial transaction. | `ref`, `postingDate`, `status`, `entryHash`, `previousHash` |
| `JournalLine` | Individual debit/credit lines within an entry. | `accountId`, `debit`, `credit`, `locationId`, `departmentId` |
| `ChartOfAccount` | Definition of accounts. | `code`, `name`, `type` (Asset, Liability, etc.), `status` |
| `FiscalPeriod` | Time boundaries for financial reporting. | `startDate`, `endDate`, `status` (OPEN/CLOSED) |
| `AccountBalance` | Denormalized real-time balances. | `debitTotal`, `creditTotal`, `netBalance`, `version` (Optimistic locking) |

## 2. Accounts Receivable (AR)

| Model | Purpose | Key Fields |
| --- | --- | --- |
| `ArCustomer` | Financial profile of a customer. | `creditLimit`, `status` |
| `ArInvoice` | Billing record for a customer. | `invoiceNumber`, `totalAmount`, `outstandingAmount` |
| `ArPayment` | Record of cash received from a customer. | `amount`, `paymentMethod`, `idempotencyKey` |
| `ArPaymentAllocation` | Maps payments to specific invoices. | `amountAllocated` |

## 3. Subledgers & Specialized Models

| Model | Purpose | Key Fields |
| --- | --- | --- |
| `InventorySubledgerEntry` | Bridge between Inventory and Ledger. | `sourceEventId`, `entryType`, `status` |
| `FixedAsset` | Tracking of depreciable assets. | `acquisitionCost`, `usefulLifeYears`, `accumulatedDepreciation` |
| `TaxConfig` / `TaxRate` | Regional tax lookup and calculation. | `rate`, `isInclusive`, `accountCode` |
| `BudgetLine` | Financial targets per period/account. | `amount`, `scenarioId` |

## 4. Multi-Tenancy Design
- **Enforcement**: Every major entity contains a `tenantId` field.
- **Isolation**: Unique constraints are scoped via `@@unique([tenantId, ...])`.
- **Performance**: Indexes on `tenantId` are present for almost all queryable entities.
