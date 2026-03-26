# Attack Results: Zenvix Finance Core

### Phase 1: Hash Attacks
- **Modify Historical Line**: **SUCCESS (Exploited)**. Hash re-computation in `verifyJournalHash` is brittle to timestamp-to-ISO conversion. Direct DB edits can be masked.
- **Insert Fake Hash**: **FAILED**. Schema unique constraints and `HashingService` prevent easy spoofing without full sequence ownership.
- **Parallel Chain Split**: **FAILED**. `@@unique` on sequence numbers prevents branching.

### Phase 2: Atomicity Breaks
- **Disrupt `issueInvoice()`**: **SUCCESS (Partial)**. Tax calculation results are generated but not part of the invoice transaction. If `calculateTax` were extended with side effects, it would lead to desync.
- **Partial Flow Failure**: **FAILED**. `Prisma.$transaction` correctly rolls back both the invoice status and the ledger enqueue.

### Phase 3: Idempotency Races
- **Parallel Event Blast**: **FAILED**. The unique constraint on `finance_ledger_idempotency` successfully blocks 10 concurrent requests at the DB layer.

### Phase 4: Concurrency Attacks
- **Worker Double Process**: **SUCCESS (Potential)**. `LedgerWorkerService` has overlapping execution paths between `poll()` and `triggerProcess()`.

### Phase 5: Balance Attack
- **Inject Imbalanced Journal**: **FAILED**. `JournalValidationService` correctly blocks non-zero balances at the application layer.

### Phase 6: Reversal Attack
- **Double Reversal**: **FAILED**. Correctly blocked by state check.
- **Closed Period Reversal**: **FAILED**. Blocked by fiscal guards.

### Phase 7: Hidden Path Detection
- **MOCK-HASH**: Found in Mock Repositories.
- **Broken Path**: **CRITICAL SUCCESS**. `LedgerWorkerService` calls a non-existent method `getNextProcessablePostings` on the DB Repository. **System crashes on boot in DB mode.**
