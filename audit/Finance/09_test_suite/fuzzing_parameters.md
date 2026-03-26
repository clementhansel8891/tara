# Test Suite: Fuzzing Parameters

## 1. Malformed Payloads
- **Empty Lines**: `lines: []`.
- **Zero Amounts**: `amount: 0`.
- **String Amounts**: `amount: "nan"`.
- **Massive Amounts**: `amount: 1e12` (Check overflow in `Decimal(19,4)`).

## 2. Invalid Relations
- **Missing Period**: `fiscalPeriodId: "non-existent"`.
- **Orphaned Account**: `accountId: "valid-id-but-wrong-tenant"`.
- **Unknown Branch**: `dimensionBranchId: "WRONG"`.

## 3. Temporal Edge Cases
- **Leap Year Close**: Period starting Feb 29.
- **Timezone Drift**: Transaction at 23:59:59 on period boundary.
- **Backdated Posting**: Attempting to post to a `CLOSED` period (System must block).

## 4. Idempotency Stress
- **Rapid Retries**: Call `post-ledger` with the same `sourceEventId` every 10ms for 1 second.
- **Stale Context**: Attempt to use an expired `PostingContext` token for repository writes.
