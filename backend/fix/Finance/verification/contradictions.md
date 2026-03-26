# Finance Verification: Contradictions

| # | Contradiction | Resolution Details | Status |
| :--- | :--- | :--- | :--- |
| **C-01** | Ledger Hashing | Replaced `'MOCK-HASH'` with deterministic SHA-256 chain in `PeriodClosingService`. Added `verifyJournalHash` to `LedgerIntegrityService`. | ✅ RESOLVED |
| **C-02** | Drafts Guard | `FiscalPeriodService` now enforces "No DRAFT" rule during locking. Added `countDraftsInPeriod` to Repository. | ✅ RESOLVED |
| **C-03** | Subledger Precision | Converted `Float` to `Decimal(19, 4)` in `schema.prisma` and applied `Prisma.Decimal` to all inventory/revrec services. | ✅ RESOLVED |
