# Finance Edge Case Analysis

## 1. Overdraft & Sufficient Fund Controls
- **Finding**: No explicit "overdraft guard" found in `ArPaymentService` for outgoing refunds.
- **Risk**: A user could trigger a refund for an amount that exceeds the company's current cached bank balance.
- **Mitigation**: Implement a check against `AccountBalance` (Bank-type) in the refund path.

## 2. Multi-Currency Rounding
- **Finding**: Basic support found (USD/IDR), but exchange rate logic is simplified (`1.0`).
- **Risk**: Conversion gaps between base currency and transaction currency can lead to "ghost cents" in the ledger.
- **Verdict**: **REMEDIATION_REQUIRED** for international scaling.

## 3. Simultaneous Postings
- **Finding**: `processEvent` relies on `postingId`.
- **Race Condition**: If two workers attempt to process the SAME posting, the `uow.execute` (Prisma transaction) will correctly roll one back due to unique constraints or processing status, but the retry logic needs analysis.
- **Verdict**: **STABLE** (Prisma transactions provide reliable isolation for this).

## 4. Reversal during Consolidation
- **Scenario**: A user attempts to reverse a journal that has already been included in a "sealed" or "certified" snapshot.
- **Finding**: `JournalReversalService` does not currently check if the journal's period is "HARD_LOCKED" or sealed.
- **Verdict**: **REMEDIATION_REQUIRED** (Integrate `FiscalPeriodStatus` check in reversal path).
