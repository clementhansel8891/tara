# Failure Modes Analysis

## 1. System Failures
| Failure | Component | Impact | Recovery Path |
|---------|-----------|--------|---------------|
| **DB Timeout** | `LedgerPostingService` | Hang in `PROCESSING` | Worker retry on `PROCESSING` |
| **Worker Crash** | `LedgerWorkerService` | Postings stuck in `PENDING` | Restart/Health Check |
| **Duplicate Event** | `enqueuePosting()` | Logged + Ignored | No manual intervention |

## 2. Business Logic Failures
| Failure | Component | Impact | Recovery Path |
|---------|-----------|--------|---------------|
| **Rule Missing** | `PostingRuleRepo` | Posting fails with status `FAILED` | Define Rule -> Retry |
| **Chart Miss** | `CoaRepo` | Posting fails with status `FAILED` | Correct Rule/COA mapping |
| **Fiscal Lock** | `FiscalRepo` | Valid event Rejected | Move Date -> Manual Re-enqueue |

## 3. Disaster Recovery (Finance Context)
- **Problem**: Ledger corruption at hash link $N$.
- **Detection**: `LedgerInvariantService` (Cold Path) detects `HASH_LINK_BROKEN`.
- **Mitigation**: Rebuild ledger from `LedgerEventLog` (Source of Truth) to new `JournalEntry` table.
- **Verdict**: **PASSED** (Architecture supports Event Sourcing/Replay).
