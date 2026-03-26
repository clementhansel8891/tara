# Finance Broken Flows Audit

## 1. Subledger-to-Ledger Desync
- **Symptoms**: Invoice marked as `ISSUED` but no corresponding `JournalEntry` found.
- **Cause**: Non-atomic status update in `ArInvoiceService` (Status updated before LedgerEnqueue outside of a single transaction).
- **Audit Verdict**: **BROKEN** (High risk of data inconsistency).

## 2. Reversal Validation
- **Symptoms**: Reversing a journal that has already been reversed.
- **Cause**: No `isReversed` guard or status transition in the source journal.
- **Audit Verdict**: **BROKEN** (Double-reversal risk).

## 3. Fiscal Hard-Lock Bypass
- **Symptoms**: Manual journals (Drafts) staying `DRAFT` in a closed period.
- **Cause**: No "Cleanup" or "Eviction" policy for pending drafts when a period is hard-locked.
- **Audit Verdict**: **BROKEN** (Orphan records in closed periods).
