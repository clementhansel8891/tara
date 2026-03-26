# Edge Cases: Error Boundary Analysis

## 1. Ledger Engine Fault Tolerance

| Scenario | System Behavior | Audit Result |
| --- | --- | --- |
| **Validation Failure** | Throws `BadRequestException`; Posting marked as `FAILED_TERMINAL`. | ✅ SAFE |
| **DB Timeout** | Rollback transaction via `IUnitOfWork`; Posting marked as `FAILED_RETRYABLE`. | ✅ RESILIENT |
| **Partial Success** | `IUnitOfWork` ensures atomic rollback of Journals, Lines, and Balances. | ✅ SAFE |
| **Process Crash** | Posting stays in `PROCESSING`. Next poller cycle must detect "Stalled" postings. | ⚠️ GAP: Poller logic needs verification. |

## 2. Recovery Mechanics
- **Exponential Backoff**: `markPostingFailed` calculates `2^retryCount` wait time. This prevents "Thundering Herd" on a failing external dependency (e.g., a locked DB).
- **Manual Intervention**: The `failed_terminal` state requires a human to clear the error (admin dashboard) before it can be re-queued.

## 3. Invariant Violations
- If a post-commit invariant check fails (e.g., `validateDeltaBalance`), the system currently logs a `CRITICAL ERROR` but does not "undo" the committed transaction. 
- *Risk*: Data is already committed. Reversing it automatically might cause more issues. 
- *Recommendation*: Trigger a high-priority "Integrity Alert" to the CFO dashboard.
