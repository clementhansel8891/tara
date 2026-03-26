# Test Suite: Integration Scenarios

## 1. End-to-End AR Flow
**Goal**: Verify synchronization between Sales and Finance.
1. Create `ArInvoice` (DRAFT).
2. Call `issueInvoice()`.
3. **Verify**: `LedgerPosting` (PENDING) created.
4. Trigger `LedgerWorker`.
5. **Verify**: `AccountBalance` (AR Asset) increased, `JournalEntry` (POSTED) created with correct hash.

## 2. Integrity Resilience (The "Corruptor" Test)
**Goal**: Verify auditor detection of tampering.
1. Process 10 valid postings.
2. Manually edit one `JournalLine.amount` in the Database (bypassing the service).
3. Run `AuditChainService.repairChain()`.
4. **Verify**: System detects corruption and logs a `CRITICAL` alert with the recomputed hash.

## 3. Concurrency Stress Test
**Goal**: Verify balance consistency under load.
1. Spawn 10 parallel workers processing events that all hit the same `Cash` account.
2. **Verify**: Final `netBalance` matches the sum of all individual transaction amounts perfectly.
3. **Check**: Observe for "Lost Updates" where some increments were overwritten.

## 4. Cross-Tenant Leakage
1. Attempt to post a journal using `tenantId_A` but with an `accountId` belonging to `tenantId_B`.
2. **Verify**: System throws `Account not found` error (Correct behavior—isolation).
