# Edge Cases: Concurrency Hazards

## 1. Account Balance Race Conditions
The `LedgerPostingService.updateAccountBalanceLocked` method performs a READ-MODIFY-WRITE cycle on account balances.

- **Risk**: If two parallel worker processes attempt to update the same `AccountBalance` record (e.g., the same Cash account for two different transactions), a race condition exists.
- **Current Observation**: The service fetches the balance, increments it in-memory, and sends it back to the repository. While there is a `version` field in the schema, the service logic does not explicitly check it during the save operation in the current implementation.
- **Impact**: Lost update of account totals, leading to a discrepancy between the General Ledger (Journal Lines) and the Balance Sheet.
- **Mitigation**: Implement `atomic increment` SQL or "Optimistic Locking" where the `UPDATE` query includes `WHERE version = :oldVersion`.

## 2. Event Ingestion Races
When an external system (e.g., Procurement) enqueues a posting event:

- **Risk**: Duplicate events sent in rapid succession.
- **Current Observation**: `LedgerPostingService` handles this via a `try-catch` on the `LedgerEventLog` creation. If a unique constraint violation occurs, it retrieves the existing log to check its status.
- **Impact**: Safe. Double-postings are prevented.

## 3. Worker Overlap
- **Risk**: Multiple workers processing the same `PENDING` posting.
- **Current Observation**: The system Transitions the posting to `PROCESSING` status immediately. If the repository uses `SELECT ... FOR UPDATE` or `SKIP LOCKED`, this is safe. 
- **Recommendation**: Audit the `MockRepository` and `PrismaRepository` to ensure "claim" logic is atomic.
