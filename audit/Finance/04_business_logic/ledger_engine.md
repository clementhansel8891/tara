# Business Logic: Ledger Engine

## 1. High-Integrity Posting Pipeline
The Ledger Engine implements a non-blocking, worker-based pipeline to ensure extreme consistency.

| Phase | Description | Implementation Detail |
| --- | --- | --- |
| **01. Idempotency** | Prevents double-counting of source events. | Atomic check via `LedgerEventLog` (Unique constraint on `sourceEventId`). |
| **02. Rule Resolution**| Determines accounting treatment. | Resolves `PostingRule` by `eventType` and evaluates amount expressions. |
| **03. Policy Control** | Enforced time-boundaries. | Blocks postings to periods with `HARD_LOCK` status. |
| **04. Pre-Validation** | Structural checks before DB write. | `JournalValidationService` checks for Zero-Sum and `DimensionValidationService` checks required tags (Dept, Project). |
| **05. Crypto-Chaining** | Immutable audit trail. | `SHA-256` hash generated using `previousHash` + Sorted Line Data + Timestamp. |
| **06. Atomic Flush** | Unit of Work persistence. | All changes (Journal, Lines, Balances, Idempotency) are wrapped in a single DB transaction. |
| **07. Invariant Verif.**| Post-commit sanity check. | Verifies that the DB state actually matches the intended Delta Balance and Hash Link. |

## 2. Recovery & Resilience
- **Exponential Backoff**: Failed postings are retried with a `2^retryCount` delay.
- **Worker Trigger**: `triggerProcess` is called immediately upon enqueuing, with a fallback poller (Worker Service) for missed events.
- **Repair Utility**: `repairChain` allows SuperAdmins to re-calculate hashes if a manual DB intervention breaks the chain.
