# Test Suite: Unit Tests

## 1. Ledger Engine (`LedgerPostingService`)

| Test Case | Inputs | Expected Output |
| --- | --- | --- |
| **Simple Posting** | Valid Rule + Valid Payload | Status: COMPLETED, Journal created. |
| **Imbalance Reject**| Total Debit != Total Credit | `BadRequestException` (UNBALANCED_JOURNAL). |
| **Negative Amount** | Payload with amount < 0 | `BadRequestException` (INVALID_LINE_AMOUNT). |
| **Lock Error** | HARD_LOCK Period ID | `FiscalPeriodLockedError`. |
| **Retry Backoff** | DB Connection Error | Status: FAILED_RETRYABLE, retryCount: 1, nextRetryAt: +2s. |

## 2. Reporting & Metrics (`ReportingEngineService`)

| Test Case | Inputs | Expected Output |
| --- | --- | --- |
| **Trial Balance** | 10 Balanced Journals | `isBalanced: true`, Total Debit matches logic. |
| **P&L Aggregation** | Mixed Rev/Exp accounts | Correct Net Profit; integrityHash verified. |
| **RE Dynamic Mode** | OPEN Period | Sum(Historical P&L) returned. |
| **RE Static Mode** | CLOSED Period | Stored value (Snapshot) returned. |

## 3. Specialized Logic

- **Tax Engine**: Verify PPN 11% calculates correctly for multiple line items without rounding drift.
- **Merkle Check**: Verify that swapping two line items in a journal (which doesn't change the balance) DOES change the `entryHash`.
