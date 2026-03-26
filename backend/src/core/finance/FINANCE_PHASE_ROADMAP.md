# Zenvix Finance — Full Phase Roadmap

## 1. Accounting Foundation
- [x] Chart of Accounts (COA) hierarchy
- [x] Double-entry bookkeeping rules
- [x] Real-time Account Balances
- [x] Fiscal Period lifecycle (OPEN, SOFT_LOCK, HARD_LOCK)

## 2. Immutable Ledger Engine
- [x] JournalEntry & JournalLine generation
- [x] LedgerPostingService queue
- [x] Hash-chained journals (SHA-256)
- [x] HMAC-signed posting tokens

## 3. High Volume Pipeline
- [x] LedgerWorkerService (background processing)
- [x] SKIP LOCKED concurrency strategy
- [x] Exponential backoff & retry
- [x] Dead Letter Queue (DLQ)

## 4. Platform Hardening
- [x] Deterministic `ledgerSequence` ordering
- [x] Merkle Ledger Checkpoints (O(log n) audits)
- [x] Ledger Architecture Guard (CI enforcement)
- [x] Invariant Service (delta balance checks)

## 5. Production Safeguards
- [x] **Atomic Event Idempotency**: Insert-first logic to block duplicate business events.
- [x] **Fiscal Lock Enforcement**: Strict pre-write validation for hard-locked periods.
- [x] **DLQ Replay Tool**: Operational support for reprocessing terminal failures.

## 6. Financial Projection Engine
- [x] **TrialBalanceProjection**: Real-time read model for balance inquiries.
- [x] **GeneralLedgerProjection**: Transaction history with incremental running balances.
- [x] **AccountStatementProjection**: Ordered ledger history for statements.
- [x] **Accounting Dimensions**: Optional cost center, department, and project tracking in GL/Statement.
- [x] **Idempotent Workers**: Sequence-checkpointed projection updates.

## 7. Disaster Recovery & Audit
- [x] **Projection Rebuild**: Streaming batch recovery (1,000 journals/batch) from immutable ledger.
- [x] **Financial Snapshots**: Sequence-based checkpoints for reporting acceleration.
- [x] **Daily Hash Anchors**: External proof-of-state for audit logs.

## 8. Financial Reporting Engine (Phase 12)
- [ ] **Profit & Loss (P&L)**: Instant income statement via `TrialBalanceProjection` aggregation.
- [ ] **Balance Sheet (BS)**: Real-time balance sheet with Asset/Liability/Equity invariant verification.
- [ ] **Cash Flow Statement**: Categorized cash reporting derived from `AccountStatementProjection`.
- [ ] **Dimension-Aware Reporting**: Indexed dimension filtering using `GeneralLedgerProjection`.
- [ ] **Deterministic Snapshots**: Checkpoint-sequenced caching for instant dashboard retrieval.

## 9. Reporting Performance Design
The Zenvix reporting architecture guarantees constant-time or logarithmic performance by strictly decoupling reporting from the ledger.
- **Ledger Scan**: O(n) (Auditing/Proof only).
- **Projection Query**: O(1) (Real-time Reporting).
- **Snapshot Hydration**: O(log n) (Recovery/Audit).
- **Rule**: Financial reports must **NEVER** scan the ledger directly.
