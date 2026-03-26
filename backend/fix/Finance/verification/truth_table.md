# Finance Verification: Truth Table

| Issue | Audit Claim | Code Reality | Status |
| :--- | :--- | :--- | :--- |
| **Ledger Hash Chain** | Implemented | Deterministic SHA-256 links active in `LedgerPostingService`, `PeriodClosingService`, and `LedgerIntegrityService`. | ✅ VERIFIED |
| **Subledger Atomicity** | Fixed | `ArInvoiceService.issueInvoice` uses `Prisma.$transaction` block. Sequential flow is atomic. Tax calculation is outside but results are passed in. | ✅ VERIFIED |
| **Balance Enforcement** | Fixed | `BALANCE_TOLERANCE = 0` enforced in `JournalValidationService` and `LedgerInvariantService`. | ✅ VERIFIED |
| **Reversal Guards** | Fixed | Double reversal and fiscal lock (`HARD_LOCK`, `CLOSED`) guards implemented in `JournalReversalService`. | ✅ VERIFIED |
| **Drafts in Locked Periods** | Fixed | `FiscalPeriodService` now blocks locking if `DRAFT` journals exist. `JournalDbRepository` supports counting and voiding drafts. | ✅ VERIFIED |
| **Idempotency Race** | Fixed (Claimed) | `@@unique([tenantId, companyId, sourceEventId])` exists on `finance_ledger_idempotency` and `finance_ledger_event_log`. | ✅ VERIFIED |
| **Worker Concurrency**| Fixed (Claimed) | `claimPostings` uses atomic `UPDATE ... WHERE status = 'PENDING'` via transaction in `LedgerPostingDbRepository`. | ✅ VERIFIED |
| **Precision** | Standardized | `Decimal(19, 4)` enforced in `schema.prisma` and throughout all financial services (AR, Inventory, RevRec). | ✅ VERIFIED |
