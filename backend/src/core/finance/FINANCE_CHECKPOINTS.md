# Zenvix Finance — Phase Checkpoints

To ensure production integrity, every phase must satisfy the following criteria:

## ✔ Standard Verification
- [x] **Integration Test Suite**: All phases (1-11) must pass with zero failures.
- [x] **Ledger Invariants**: No journals may exist with unbalanced lines or broken hash links.
- [x] **Architecture Guard**: Zero violations in CI scan (unauthorized imports or raw SQL).

## ✔ Data Integrity
- [x] **Hash Linkage**: `entryHash` must cryptographically prove the chain state.
- [x] **Merkle Proofs**: Selected journals must provide O(log n) proof of inclusion.
- [x] **Sequence Gap Check**: Monotonic `ledgerSequence` must have no missing values per tenant.

## ✔ Projection Accuracy
- [x] **TB Equality**: AccountBalance must equal TrialBalanceProjection totals.
- [x] **GL Consistency**: Running balance in GeneralLedgerProjection must be continuous.
- [x] **Dimension Propagation**: Dimensions must flow to GL/Statement but remain isolated from Trial Balance.
- [x] **Rebuild Audit**: Rebuilt projections must be binary-identical to original state.

## ✔ Operational Safety

- [x] **Idempotency**: Duplicate event ingestions must be silently ignored (already POSTED) or retried properly.
- [x] **Fiscal Lockdown**: No writes permitted to HARD_LOCK periods.
- [x] **Token TTL**: HM_CTX tokens must expire within 30 seconds to prevent replay.

## ✔ Phase 12 Reporting Engine
- [ ] **P&L Integrity**: (Total Revenue - Total Expense) must precisely match reported Net Profit.
- [ ] **BS Equation**: Total Assets must equal Liabilities + Equity (A = L + E).
- [ ] **Snapshot Latency**: Cached reports must be retrieved in < 100ms.
- [ ] **Snapshot Consistency**: Cached report `projectionCheckpointSequence` must match current projection checkpoint.
- [ ] **Dimension Accuracy**: Dimension-filtered totals must match account-level Trial Balance aggregates.
