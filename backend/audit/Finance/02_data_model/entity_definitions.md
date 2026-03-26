# Entity Definitions Audit

## 1. Core Ledger Entities

### [JournalEntry]
- **Audit Field**: `previousHash` (String?), `entryHash` (String?)
- **Validation**: Ensures chain-of-custody for every financial entry.
- **Verdict**: **PASSED**.

### [JournalLine]
- **Audit Field**: `amount` (Decimal 19,4), `debit` (Decimal 19,4), `credit` (Decimal 19,4)
- **Validation**: High precision required for multi-currency settlement.
- **Verdict**: **PASSED**.

### [AccountBalance]
- **Audit Field**: `netBalance` (Decimal 19,4)
- **Validation**: Unique constraint on `account_balance_dimensions` prevents race-condition duplicates.
- **Verdict**: **PASSED**.

## 2. Accounts Receivable (AR)

### [ArInvoice]
- **Audit Field**: `outstandingAmount` (Decimal 19,4)
- **Validation**: Idempotency key present for integration safety.
- **Verdict**: **PASSED**.

### [ArPayment]
- **Audit Field**: `amount` (Decimal 19,4)
- **Validation**: Links to `ArPaymentAllocation` for FIFO/Manual matching.
- **Verdict**: **PASSED**.

## 3. Forensic & Compliance

### [LedgerHashAnchor]
- **Purpose**: Snapshot-based ledger verification.
- **Audit Field**: `finalJournalHash`
- **Verdict**: **PASSED**.

### [FinancialCertification]
- **Purpose**: Formal digital sign-off on reporting periods.
- **Audit Field**: `certificationHash`
- **Verdict**: **PASSED**.

## 4. Gap Alerts
1.  **CostLayer Mismatch**: `CostLayer.unitCost` is `Decimal(15, 2)`, while the ledger is `19, 4`.
    - **Risk**: Precision loss when converting inventory value to ledger postings.
2.  **Marketing ROI**: `roiPercent` is `Decimal(10, 2)`. Sufficient for marketing but inconsistent with zero-loss financial standards.
